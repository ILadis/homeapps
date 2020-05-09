
import * as Views from './views.js';

export function Presenter(shell, repo) {
  this.shell = shell;
  this.repo = repo;
}

Presenter.prototype.showFileList = async function() {
  let { bottomBar, uploadList } = this.shell;
  let fileList = new Views.FileList();

  this.shell.setContent(fileList);

  bottomBar.clearActions();
  bottomBar.addAction('menu', () => uploadList.pullUp());
  bottomBar.addAction('inbox', () => false);
  bottomBar.addAction('search', () => fileList.focusSearch());
  bottomBar.setFloatingAction('create', (files) => showUpload(uploadList, files), true);

  let showUpload = async (view, files) => {
    let progress = new Array();

    for (let file of files) {
      let upload = this.repo.uploadFile(file);
      progress.push(showProgress(view.addItem(), file, upload));
    }

    view.pullUp();
    await Promise.all(progress);

    let iterator = this.repo.listFiles();
    showFiles(fileList, iterator);
  };

  let showProgress = async (view, file, upload) => {
    view.setName(file.name).setProgress(0);
    for await (let percent of upload) {
      view.setProgress(percent);
    }
  };

  let showFiles = async (view, iterator) => {
    let views = view.items.values();
    for await (let file of iterator) {
      let v = (views.next().value || view.addItem())
        .setName(file.name)
        .setSize(file.size)
        .setDate(file.date);

      v.onClicked = () => this.showFileDetails(file);

      showTags(v, file.tags);
    }

    for (let v of views) {
      view.removeItem(v);
    }
  };

  let showTags = (view, iterator) => {
    let views = view.tags.values();
    for (let tag of iterator) {
      let v = (views.next().value || view.addTag());
      v.setLabel(tag);
    }

    for (let v of views) {
      view.removeTag(v);
    }
  };

  let iterator = this.repo.listFiles();
  showFiles(fileList, iterator);
};

Presenter.prototype.showFileDetails = function(file) {
  let { bottomBar } = this.shell;
  let fileDetails = new Views.FileDetails();

  this.shell.setContent(fileDetails);

  bottomBar.clearActions();
  bottomBar.addAction('back', () => this.showFileList());
  bottomBar.addAction('save', () => saveFile());
  bottomBar.setFloatingAction('download', () => downloadFile());

  fileDetails.onNameChanged = (name) => file.name = name;
  fileDetails.onDateChanged = (date) => file.date = date;
  fileDetails.onTagSubmitted = (tag) => addTag(fileDetails, tag);

  let downloadFile = () => {
    window.location.href = file.uri;
  };

  let tags = new Set();

  let saveFile = async () => {
    file.tags = Array.from(tags);
    await this.repo.saveFile(file);
    this.showFileList();
  };

  let addTag = (view, tag) => {
    if (!tags.has(tag)) {
      tags.add(tag);
      let v = view.addTag().setLabel(tag);
      v.onClicked = () => {
        tags.delete(tag);
        view.removeTag(v);
      };
    }
  };

  fileDetails.setName(file.name);
  fileDetails.setDate(file.date);
  for (let tag of file.tags) {
    addTag(fileDetails, tag);
  }
};

