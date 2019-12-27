
import { Recipe } from './recipe.js';

export function Repository(db) {
  this.db = db;
}

Repository.create = async function() {
  let schema = {
    'recipes': {
      keyPath: 'id',
      autoIncrement: true
    }
  };

  let db = await Database.create('cookbook', schema);
  return new Repository(db);
};

Repository.prototype.isEmpty = async function() {
  this.db.beginTx('recipes', 'readonly');
  let count = await this.db.count();
  return count == 0;
}

Repository.prototype.fetchAll = async function*() {
  this.db.beginTx('recipes', 'readonly');
  let iterator = this.db.iterateAll();

  for await (let data of iterator) {
    yield Recipe.fromJSON(data);
  }
};

Repository.prototype.fetchById = async function(id) {
  this.db.beginTx('recipes', 'readonly');
  let data = await this.db.fetchByKey(Number(id));
  return Recipe.fromJSON(data);
};

Repository.prototype.save = async function(recipe) {
  this.db.beginTx('recipes', 'readwrite');

  let data = Recipe.toJSON(recipe);
  await this.db.save(data);
};

Repository.prototype.delete = async function(recipe) {
  this.db.beginTx('recipes', 'readwrite');
  await this.db.deleteByKey(recipe.id);
};

function Database(db) {
  this.db = db;
}

Database.create = async function(name, schema) {
  let request = indexedDB.open(name);

  request.onupgradeneeded = () => {
    let db = request.result;
    for (let name in schema) {
      let options = schema[name];
      db.createObjectStore(name, options);
    }
  };

  let db = await Database.promisify(request);
  return new Database(db);
};

Database.promisify = function(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

Database.prototype.beginTx = function(name, mode) {
  let store = this.db.transaction(name, mode).objectStore(name);
  this.store = store;
  return this;
};

Database.prototype.save = function(data) {
  let keyPath = this.store.keyPath;
  if (data[keyPath]) {
    var request = this.store.put(data);
  } else {
    delete data[keyPath];
    var request = this.store.add(data);
  }
  return Database.promisify(request);
};

Database.prototype.count = function() {
  let request = this.store.count();
  return Database.promisify(request);
};

Database.prototype.fetchByKey = function(key) {
  let request = this.store.get(key);
  return Database.promisify(request);
};

Database.prototype.deleteByKey = function(key) {
  let request = this.store.delete(key);
  return Database.promisify(request);
};

Database.prototype.iterateAll = async function*() {
  let request = this.store.openCursor();

  do {
    let cursor = await Database.promisify(request);
    if (!cursor) {
      return;
    }

    yield cursor.value;

    cursor.continue();
  } while (true);
};
