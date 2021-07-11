
import { Page } from './repository.js';

export function Presenter(shell, repository) {
  this.shell = shell;
  this.repository = repository;
}

Presenter.prototype.showIndex = async function() {
  let { clock, list, form } = this.shell;

  function updateClock() {
    let date = new Date();
    clock.setTime(date);
    clock.setDate(date);
  }

  updateClock();
  window.setInterval(updateClock, 1000);

  let repository = this.repository;
  for await (let page of repository.fetchAll()) {
    list.addItem(page);
  }

  let page = new Page();

  form.onUrlChanged = (url) => page.setUrl(url);
  form.onTitleChanged = (title) => page.setTitle(title);
  form.onSubmitted = submitPage;

  async function submitPage() {
    form.clearValues();
    await repository.save(page);
    list.addItem(page);
    page = new Page();
  }
};

