
import { Search } from './search.js';
import * as Views from './views.js';

export function Presenter(shell, repo) {
  this.shell = shell;
  this.repo = repo;
}

Presenter.prototype.showFileList = async function() {
  let { bottomBar, uploadList } = this.shell;
  let fileList = new Views.FileList();
  let files = new Set();

  let searchFiles = (query) => {
    if (!query) {
      let iterator = files.values();
      return showFiles(iterator);
    }

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

  let showUpload = async (files) => {
    let progress = new Array();

    for (let file of files) {
      let upload = this.repo.uploadFile(file);
      progress.push(showProgress(file, upload));
    }

    uploadList.pullUp();
    await Promise.all(progress);

    let iterator = this.repo.listFiles();
    showFiles(iterator);
  };

  let showProgress = async (file, upload) => {
    let item = uploadList.addItem()
      .setName(file.name)
      .setProgress(0);

    for await (let percent of upload) {
      item.setProgress(percent);
    }
  };

  let showFiles = async (iterator) => {
    let items = fileList.items.values();
    for await (let file of iterator) {
      files.add(file);

      let item = (items.next().value || fileList.addItem())
        .setName(file.name)
        .setSize(file.size)
        .setDate(file.date);

      item.onClicked = () => this.showFileDetails(file);

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

  bottomBar.clearActions();
  bottomBar.addAction('menu', () => uploadList.pullUp());
  bottomBar.addAction('inbox', () => this.showFileScan());
  bottomBar.addAction('search', () => fileList.focusSearch());
  bottomBar.setFloatingAction('create', showUpload, true);

  fileList.onSearchChanged = searchFiles;

  let iterator = this.repo.listFiles();
  showFiles(iterator);

  this.shell.setContent(fileList);
};

Presenter.prototype.showFileScan = function() {
  let { bottomBar } = this.shell;
  let fileScan = new Views.FileScan();

  bottomBar.clearActions();
  bottomBar.addAction('back', () => this.showFileList());
  bottomBar.setFloatingAction('print', async () => {
    let url = await this.repo.scanFile();
    let item = fileScan.addItem();
    item.setImage(url);
    item.scrollTo();
  });

  this.shell.setContent(fileScan);
};

Presenter.prototype.showFileDetails = function(file) {
  let { bottomBar } = this.shell;
  let fileDetails = new Views.FileDetails();
  let tags = new Set();

  let deleteFile = async () => {
    await this.repo.deleteFile(file);
    this.showFileList();
  };

  let saveFile = async () => {
    file.tags = Array.from(tags);
    await this.repo.saveFile(file);
    this.showFileList();
  };

  let downloadFile = () => {
    window.location.href = file.uri;
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

  bottomBar.clearActions();
  bottomBar.addAction('back', () => this.showFileList());
  bottomBar.addAction('delete', deleteFile);
  bottomBar.addAction('save', saveFile);
  bottomBar.setFloatingAction('download', downloadFile);

  fileDetails.setName(file.name);
  fileDetails.setDate(file.date);

  fileDetails.onNameChanged = (name) => file.name = name;
  fileDetails.onDateChanged = (date) => file.date = date;
  fileDetails.onTagSubmitted = addTag;

  for (let tag of file.tags) {
    addTag(tag);
  }

  this.shell.setContent(fileDetails);
};

