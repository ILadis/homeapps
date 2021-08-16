
import { Page } from './page.js';
import { Search } from './search.js';

export function Presenter(shell, repository, accountsManager) {
  this.shell = shell;
  this.repository = repository;
  this.accountsManager = accountsManager;
}

Presenter.prototype.showIndex = async function() {
  let { accounts, clock, form, list } = this.shell;

  updateClock();
  window.setInterval(updateClock, 1000);

  let repository = this.repository;
  let pages = new Set();
  let search = new Search(pages, Page.search);

  let self = this.accountsManager.currentUser();
  await showUsers(this.accountsManager.listUsers());

  accounts.onChanged = switchUsers;

  form.setTagPattern(Page.tagPattern);

  form.onChanged = searchPages;
  form.onSubmitted = submitPage;

  showPages(repository.fetchAll());

  await repository.syncAll(self);
  pages.clear();

  showPages(repository.fetchAll());

  function updateClock() {
    let date = new Date();
    clock.setTime(date);
    clock.setDate(date);
  }

  async function showUsers(users) {
    for (let user of await users) {
      if (self == false) self = user;

      let current = self?.token === user?.token;
      accounts.addUser(user, current);
    }
  }

  async function switchUsers(id) {
    // TODO
  }

  async function showPages(iterator = pages) {
    let items = list.items.values();

    for await (let page of iterator) {
      pages.add(page);
      page.tags.forEach(tag => form.addTag(tag));

      let item = items.next().value || list.addItem();
      item.onEdited = editPage(page);
      item.setTitle(page);
      item.setUrl(page);
    }

    for (let item of items) {
      list.removeItem(item);
    }
  }

  function searchPages() {
    let query = [form.url, ...form.tags].join(' ');
    let results = search.execute(query) || pages;
    showPages(results);
  }

  function editPage(page) {
    return async (title) => {
      page.setTitle(title);
      await repository.save(page);
    };
  }

  async function submitPage() {
    let page = new Page();
    page.addTags(form.tags);

    if (page.tryUrl(form.url)) {
      form.clearValues();
      showPages();

      await repository.inspect(page);
      await repository.save(page, self);

      pages.add(page);

      let item = list.addItem(true);
      item.setTitle(page);
      item.setUrl(page);
    }
  }
};

