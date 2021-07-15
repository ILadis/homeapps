
import { Page } from './repository.js';

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
  for await (let page of repository.fetchAll()) {
    list.addItem(page);
  }

  search.onChanged = () => undefined;
  search.onSubmitted = submitPage;

  async function submitPage(url) {
    let page = new Page();
    if (page.tryUrl(url)) {
      search.clearValues();
      await page.inspect();
      await repository.save(page);
      list.addItem(page);
    }
  }
};

