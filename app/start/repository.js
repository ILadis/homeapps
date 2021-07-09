
import { Database } from './storage.js';

export function Page(url, id = undefined) {
  this.url = url;
  this.id = id;
  this.title = '';
  this.tags = new Set();
  // TODO consider adding image/favicon
}

Page.prototype.setUrl = function(url) {
  this.url = url;
};

Page.prototype.setTitle = function(title) {
  this.title = title;
};

Page.prototype.addTag = function(tag) {
  this.tags.add(tag);
};

Page.fromJSON = function(json) {
  let { id, url, title, tags } = json;

  let page = new Page(url, id);
  page.setTitle(title);

  for (let tag of tags.values()) {
    page.addTag(tag);
  }

  return page;
};

Page.toJSON = function(page) {
  let { url, id, title, tags } = page;

  let json = {
    url, id, title,
    tags: Array.from(tags)
  };

  return json;
};

export function Repository() {
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

Repository.prototype.save = async function(page) {
  let db = await this.db;
  db.beginTx('pages', 'readwrite');

  let data = Page.toJSON(page);
  await db.save(data);
};
