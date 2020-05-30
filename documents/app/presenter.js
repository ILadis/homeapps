
import { Search } from './search.js';
import * as Views from './views.js';

export function Presenter(shell, repo) {
  this.shell = shell;
  this.repo = repo;
}

Presenter.prototype.showList = async function() {
  let { bottomBar, uploadList } = this.shell;
  let fileList = new Views.FileList();
  let files = new Set();

  let searchFiles = (query) => {
    let search = new Search(files);
    search.execute(query, function*(file) {
      yield file.name;
      for (let tag of file.tags) {
        yield tag;
      }
    });

    let iterator = search.values();
    showFiles(iterator);
  };

  let uploadFiles = async (iterator) => {
    let progress = new Array();

    for (let file of iterator) {
      let upload = this.repo.uploadFile(file);
      progress.push(showProgress(file, upload));
    }

    uploadList.pullUp();
    await Promise.all(progress);
  };

  let showProgress = async (file, upload) => {
    let item = uploadList.addItem()
      .setName(file.name)
      .setProgress(0);

    for await (let percent of upload) {
      item.setProgress(percent);
    }

    files.add(file);

    let iterator = files.values();
    showFiles(iterator);
  };

  let showFiles = async (iterator) => {
    let items = fileList.items.values();
    for await (let file of iterator) {
      files.add(file);

      let item = (items.next().value || fileList.addItem())
        .setName(file.name)
        .setSize(file.size)
        .setDate(file.date);

      item.onClicked = () => this.showDetails(file.id);

      let tags = item.tags.values();
      for (let tag of file.tags) {
        let view = (tags.next().value || item.addTag());
        view.setLabel(tag);
      }

      for (let tag of tags) {
        item.removeTag(tag);
      }
    }

    for (let item of items) {
      fileList.removeItem(item);
    }
  };

  uploadList.clearItems();
  bottomBar.clearActions();
  bottomBar.addAction('menu', () => uploadList.pullUp());
  bottomBar.addAction('inbox', () => this.showInbox());
  bottomBar.addAction('search', () => fileList.focusSearch());
  bottomBar.setFloatingAction('create', uploadFiles, true);

  fileList.onSearchChanged = searchFiles;

  let iterator = this.repo.listFiles();
  showFiles(iterator);

  this.shell.setContent(fileList);
  this.onListShown();
};

Presenter.prototype.onListShown = function() {
};

Presenter.prototype.showInbox = function() {
  let { bottomBar, uploadList } = this.shell;
  let fileScan = new Views.FileScan();
  let files = new Set();

  let scanFile = async () => {
    let file = await this.repo.scanInboxFile();
    files.add(file);

    let iterator = files.values();
    showFiles(iterator);
  };

  let clearFiles = () => {
    this.repo.deleteInboxFiles();
    this.showList();
  };

  let convertFiles = async () => {
    await this.repo.convertInboxFiles();
    await this.repo.deleteInboxFiles();
    this.showList();
  };

  let showFiles = async (iterator) => {
    let items = fileScan.items.values();
    for await (let file of iterator) {
      files.add(file);

      let item = (items.next().value || fileScan.addItem())
        .setImage(file.uri);
      // TODO call scrollTo, but image may still be loading
    }

    for (let item of items) {
      fileScan.removeItem(item);
    }
  };

  uploadList.clearItems();
  bottomBar.clearActions();
  bottomBar.addAction('back', clearFiles);
  bottomBar.addAction('save', convertFiles);
  bottomBar.setFloatingAction('print', scanFile);

  let iterator = this.repo.listInboxFiles();
  showFiles(iterator);

  this.shell.setContent(fileScan);
  this.onInboxShown();
};

Presenter.prototype.onInboxShown = function() {
};

Presenter.prototype.showDetails = async function(id) {
  let { bottomBar, uploadList } = this.shell;
  let fileDetails = new Views.FileDetails();
  let tags = new Set();

  let deleteFile = async () => {
    await this.repo.deleteFile(file);
    this.showList();
  };

  let saveFile = async () => {
    file.tags = Array.from(tags);
    await this.repo.saveFile(file);
    this.showList();
  };

  let downloadFile = () => {
    if (file.name.endsWith('pdf')) {
      this.showViewer(file.id);
    } else {
      window.location.href = file.uri;
    }
  };

  let addTag = (tag) => {
    if (!tags.has(tag)) {
      tags.add(tag);

      let view = fileDetails.addTag();
      view.setLabel(tag);
      view.onClicked = () => {
        tags.delete(tag);
        fileDetails.removeTag(view);
      };
    }
  };

  uploadList.clearItems();
  bottomBar.clearActions();
  bottomBar.addAction('back', () => this.showList());
  bottomBar.addAction('delete', deleteFile);
  bottomBar.addAction('save', saveFile);
  bottomBar.setFloatingAction('download', downloadFile);

  let file = await this.repo.findFileById(id);
  fileDetails.setName(file.name);
  fileDetails.setDate(file.date);

  fileDetails.onNameChanged = (name) => file.name = name;
  fileDetails.onDateChanged = (date) => file.date = date;
  fileDetails.onTagSubmitted = addTag;

  for (let tag of file.tags) {
    addTag(tag);
  }

  this.shell.setContent(fileDetails);
  this.onDetailsShown(file);
};

Presenter.prototype.onDetailsShown = function(file) {
};

Presenter.prototype.showViewer = async function(id) {
  let { bottomBar, uploadList } = this.shell;
  let fileViewer = new Views.PdfFileViewer();

  uploadList.clearItems();
  bottomBar.clearActions();
  bottomBar.addAction('back', () => this.showDetails(file.id));

  let file = await this.repo.findFileById(id);
  fileViewer.renderUrl(file.uri);

  this.shell.setContent(fileViewer);
  this.onViewerShown(file);
};

Presenter.prototype.onViewerShown = function(file) {
};

