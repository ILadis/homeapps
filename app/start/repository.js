
import { Database } from './storage.js';
import { Page } from './page.js';

export function Repository(manager) {
  this.manager = manager;
  this.db = Database.create('startpage', (schema) => {
    schema.createObjectStore('pages', {
      keyPath: 'id',
      autoIncrement: true
    }).createIndex('url', 'url', {
      unique: true
    });
  });
}

Repository.prototype.save = async function(page, user) {
  let db = await this.db;
  db.beginTx('pages', 'readwrite');

  let data = Page.toJSON(page);
  let id = await db.save(data);

  page.id = id;

  var body = Page.toJSON(page);
  delete body['url'];
  delete body['hits'];

  var body = JSON.stringify(body);
  let url = encodeURIComponent(page.url);

  let request = new Request(`/api/pages/${url}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${user.token}`
    },
    body
  });

  await this.manager.tryFetch(request);
};

Repository.prototype.fetchAll = async function*() {
  let db = await this.db;
  db.beginTx('pages', 'readonly');

  let iterator = db.iterateAll();
  for await (let data of iterator) {
    yield Page.fromJSON(data);
  }
};

Repository.prototype.syncAll = async function(user) {
  await this.manager.syncAll();

  let request = new Request('/api/pages', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${user.token}`
    }
  });

  let response = await fetch(request);
  if (!response.ok) {
    return false;
  }

  let pages = await response.json();
  let ids = new Set();

  let db = await this.db;
  db.beginTx('pages', 'readwrite');

  for (let { title, url, tags } of pages) {
    var id = await this.idByUrl(url);

    let page = new Page(id);
    page.setTitle(title);
    page.tryUrl(url);
    page.addTags(tags);

    let data = Page.toJSON(page);
    var id = await db.save(data);

    ids.add(id);
  }

  for await (let { id } of db.iterateAll()) {
    if (!ids.has(id)) await db.deleteByKey(id);
  }
};

Repository.prototype.idByUrl = async function(url) {
  let db = await this.db;

  let range = IDBKeyRange.only(url);
  let page = await db.fetchNext('url', range);

  if (page !== false) {
    return page.id;
  }
};

Repository.prototype.inspect = async function(page) {
  let body = page.url.toString();
  let request = new Request('/api/inspect', {
    method: 'POST', body
  });

  try {
    let response = await fetch(request);

    // TODO consider adding image/favicon
    let { title, favicon } = await response.json();
    page.setTitle(title);
  } catch {
    return false;
  }
};

