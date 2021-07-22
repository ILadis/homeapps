
import { Page } from './page.js';

export function Presenter(shell, repository) {
  this.shell = shell;
  this.repository = repository;
}

Presenter.prototype.showIndex = async function() {
  let { clock, search, list } = this.shell;

  function updateClock() {
    let date = new Date();
    clock.setTime(date);
    clock.setDate(date);
  }

  updateClock();
  window.setInterval(updateClock, 1000);

  let repository = this.repository;
  loadPages();

  async function loadPages(tag) {
    let pages = Page.isTag(tag)
      ? repository.fetchWithTag(tag)
      : repository.fetchAll();

    list.clearItems();
    for await (let page of pages) list.addItem(page);
  }

  search.onChanged = loadPages;
  search.onSubmitted = submitPage;

  async function submitPage(url) {
    let page = new Page();

    if (page.tryUrl(url)) {
      search.clearValues();
      await repository.saveNew(page);
      list.addItem(page);
    }
  }
};

