
import { Database } from './storage.js';
import { Page } from './page.js';

export function Repository(manager) {
  this.manager = manager;
  this.db = Database.create('startpage', (schema) => {
    schema.createObjectStore('pages', {
      keyPath: 'id',
      autoIncrement: true
    }).createIndex('tags', 'tags', {
      unique: false,
      multiEntry: true,
      locale: 'auto'
    });
  });
}

Repository.prototype.fetchAll = async function*() {
  let db = await this.db;
  db.beginTx('pages', 'readonly');

  let iterator = db.iterateAll();
  for await (let data of iterator) {
    yield Page.fromJSON(data);
  }
};

Repository.prototype.fetchWithTag = async function*(tag) {
  let db = await this.db;
  db.beginTx('pages', 'readonly');

  let iterator = db.iterateAll('tags', IDBKeyRange.only(tag));
  for await (let data of iterator) {
    yield Page.fromJSON(data);
  }
};

Repository.prototype.saveNew = async function(page) {
  await this.inspect(page);

  let db = await this.db;
  db.beginTx('pages', 'readwrite');

  let data = Page.toJSON(page);
  await db.save(data);

  this.syncNew(page);
};

Repository.prototype.syncNew = async function(page) {
  var body = Page.toJSON(page);
  delete body['url'];
  delete body['hits'];

  var body = JSON.stringify(body);
  let url = encodeURIComponent(page.url);

  let request = new Request(`/api/pages/${url}`, {
    method: 'PUT', body
  });

  await this.manager.tryFetch(request);
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
