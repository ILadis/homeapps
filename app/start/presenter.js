
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

    let items = list.items.values();

    for await (let page of pages) {
      let item = items.next().value || list.addItem();
      item.setTitle(page);
      item.setURL(page);
    }

    for (let item of items) {
      list.removeItem(item);
    }
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

