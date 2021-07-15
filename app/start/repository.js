
import { Database } from './storage.js';

export function Page(id = undefined) {
  this.id = id;
  this.url = Page.aboutBlank;
  this.title = Page.emptyTitle;
  this.tags = new Set();
  this.hits = 0;
}

Page.aboutBlank = new URL('about:blank');
Page.emptyTitle = '';

Page.prototype.tryUrl = function(url) {
  try {
    this.url = new URL(url);
    return true;
  } catch {
    return false;
  }
};

Page.prototype.inspect = async function() {
  let url = this.url.toString();

  let request = new Request('/api/inspect', {
    method: 'POST',
    body: url
  });

  let response = await fetch(request);
  if (!response.ok) {
    return false;
  }

  // TODO consider adding image/favicon
  let { title, favicon } = await response.json();

  this.setTitle(title);
};

Page.prototype.setTitle = function(title) {
  this.title = title;
};

Page.prototype.addTag = function(tag) {
  this.tags.add(tag);
};

Page.prototype.increaseHits = function() {
  this.hits++;
};

Page.fromJSON = function(json) {
  let { id, url, title, tags, hits } = json;

  let page = new Page(id);
  page.tryUrl(url);
  page.setTitle(title);

  for (let tag of tags.values()) {
    page.addTag(tag);
  }

  while (hits-- > 0) {
    page.increaseHits();
  }

  return page;
};

Page.toJSON = function(page) {
  let { id, url, title, tags, hits } = page;

  let json = {
    id, title, hits,
    url: url.toString(),
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
