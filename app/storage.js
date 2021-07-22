
export function Database(db) {
  this.db = db;
}

Database.create = async function(name, schema) {
  let request = indexedDB.open(name);

  request.onupgradeneeded = () => {
    let db = request.result;
    schema(db);
  };

  let db = await Database.promisify(request);
  return new Database(db);
};

Database.promisify = function(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

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

Database.prototype.fetchNext = async function(name, range) {
  let index = this.store;
  if (name) {
    index = this.store.index(name);
  }

  let request = index.openCursor(range);
  let cursor = await Database.promisify(request);

  return cursor ? cursor.value : false;
};

Database.prototype.iterateAll = async function*(name, range) {
  let index = this.store;
  if (name) {
    index = this.store.index(name);
  }

  let request = index.openCursor(range);

  do {
    let cursor = await Database.promisify(request);
    if (!cursor) {
      return;
    }

    yield cursor.value;

    cursor.continue();
  } while (true);
};
