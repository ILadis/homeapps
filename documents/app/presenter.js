
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
      let upload = this.repo.saveFile(file);
      progress.push(showProgress(view.addItem(), file, upload));
    }

    view.pullUp();
    await Promise.all(progress);

    for (let file of files) {
      this.repo.addTag(file, 'NEW');
    }

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
      v.clearTags();
      for (let tag of file.tags) {
        v.addTag(tag);
      }
    }

    for (let v of views) {
      view.removeItem(v);
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
  bottomBar.addAction('back', () => false);
  bottomBar.addAction('save', () => false);
  bottomBar.setFloatingAction('download', () => false);

  fileDetails.setName(file.name);
  fileDetails.setDate(file.date);
  for (let tag of file.tags) {
    fileDetails.addTag(tag);
  }

  fileDetails.onTagSubmitted = (tag) => fileDetails.addTag(tag);
};
