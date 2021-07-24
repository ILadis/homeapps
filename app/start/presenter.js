
import { Page } from './page.js';
import { Search } from './search.js';

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
  let pages = new Set();

  showPages(repository.fetchAll());

  async function showPages(iterator = pages) {
    let items = list.items.values();

    for await (let page of iterator) {
      pages.add(page);

      let item = items.next().value || list.addItem();
      item.setTitle(page);
      item.setURL(page);
    }

    for (let item of items) {
      list.removeItem(item);
    }
  }

  function searchPages(query) {
    let search = new Search(pages, Page.search);
    let results = search.execute(query) || pages;
    showPages(results);
  }

  search.onChanged = searchPages;
  search.onSubmitted = submitPage;

  async function submitPage(url) {
    let page = new Page();

    if (page.tryUrl(url)) {
      search.clearValues();
      await repository.saveNew(page);
      pages.add(page);
      showPages();
    }
  }
};

