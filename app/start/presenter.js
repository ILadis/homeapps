
import { Page } from './repository.js';

export function Presenter(shell, repository) {
  this.shell = shell;
  this.repository = repository;
}

Presenter.prototype.showIndex = async function() {
  let { list, form } = this.shell;

  for await (let page of this.repository.fetchAll()) {
    list.addItem(page);
  }

  let page = new Page();
  form.onUrlChanged = (url) => page.setUrl(url);
  form.onTitleChanged = (title) => page.setTitle(title);

  form.onSubmitted = async () => {
    form.clearValues();
    await this.repository.save(page);
    list.addItem(page);
    page = new Page();
  }
};

