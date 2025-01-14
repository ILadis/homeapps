
import { Page } from './page.js';
import { Search } from './search.js';

export function Presenter(shell, repository, accountsManager, tabsManager) {
  this.shell = shell;
  this.repository = repository;
  this.accountsManager = accountsManager;
  this.tabsManager = tabsManager;
}

Presenter.prototype.showIndex = async function() {
  let { accounts, clock, form, tabs, bookmarks } = this.shell;

  tabs.setHeadline('Tabs');
  bookmarks.setHeadline('Lesezeichen');

  updateClock();
  window.setInterval(updateClock, 1000);

  let repository = this.repository;
  let accountsManager = this.accountsManager;
  let tabsManager = this.tabsManager;

  let pages = new Set();
  let search = new Search(pages, Page.search);

  let self = accountsManager.currentUser();
  await showUsers(accountsManager.listUsers());

  accountsManager.switchUser(self);

  accounts.onChanged = switchUser;
  accounts.onSubmitted = createUser;

  tabs.hidden = true;
  tabsManager.isAvailable().then(available => tabs.hidden = !available);
  showTabs(tabsManager.observeTabs());

  form.setTagPattern(Page.tagPattern);

  form.onChanged = searchBookmarks;
  form.onSubmitted = submitBookmark;

  showBookmarks(repository.fetchAll());
  await repository.syncAll(self);
  showBookmarks(repository.fetchAll(), true);

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

  async function switchUser(token) {
    self = await accountsManager.findUser(token);
    accountsManager.switchUser(self);

    await repository.syncAll(self);
    showBookmarks(repository.fetchAll(), true);
  }

  async function createUser() {
    let name = prompt('Benutzername:');

    try {
      self = await accountsManager.createUser(name);

      accountsManager.switchUser(self);
      accounts.addUser(self, true);
    } catch {
      accounts.selectUser(self);
    }

    await repository.syncAll(self);
    showBookmarks(repository.fetchAll(), true);
  }

  async function showTabs(iterator) {
    for await (let pages of iterator) {
      let items = tabs.items.values();

      for (let page of pages) {
        let item = items.next().value || tabs.addItem();
        item.setTitle(page);
        item.setUrl(page);
      }

      for (let item of items) {
        tabs.removeItem(item);
      }
    }
  }

  async function showBookmarks(iterator, clear = false) {
    let items = bookmarks.items.values();

    if (clear) {
      pages.clear();
      form.removeTags();
    }

    for await (let page of iterator) {
      pages.add(page);
      page.tags.forEach(tag => form.addTag(tag));

      let item = items.next().value || bookmarks.addItem();
      item.onEdited = editBookmark(page);
      item.setTitle(page);
      item.setUrl(page);
    }

    for (let item of items) {
      bookmarks.removeItem(item);
    }
  }

  function searchBookmarks() {
    let query = [form.url, ...form.tags].join(' ');
    let results = search.execute(query) || pages;
    showBookmarks(results);
  }

  function editBookmark(page) {
    return async (title) => {
      page.setTitle(title);
      await repository.save(page, self);
    };
  }

  async function submitBookmark() {
    let page = new Page();
    page.addTags(form.tags);

    if (page.tryUrl(form.url)) {
      form.clearValues();

      await repository.inspect(page);
      await repository.save(page, self);

      pages.add(page);

      let item = bookmarks.addItem(true);
      item.setTitle(page);
      item.setUrl(page);
    }
  }
};

