
import { Recipe } from './recipe.js';

export function Repository() {
  this.remote = new RemoteRepository();
  this.local = new LocalRepository();
}

Repository.prototype.isEmpty = function() {
  return this.local.isEmpty();
};

Repository.prototype.fetchAll = async function*(fresh = false) {
  if (fresh) {
    let recipes = this.remote.fetchAll();
    for await (let recipe of recipes) {
      await this.local.save(recipe);
    }
  }

  let recipes = this.local.fetchAll();
  for await (let recipe of recipes) {
    yield recipe;
  }
};

Repository.prototype.fetchById = function(id) {
  return this.local.fetchById(id);
};

Repository.prototype.save = async function(recipe) {
  await this.remote.save(recipe);
  await this.local.save(recipe);
};

Repository.prototype.delete = async function(recipe) {
  await this.remote.delete(recipe);
  await this.local.delete(recipe);
};

function RemoteRepository() {
}

RemoteRepository.prototype.fetchAll = async function*() {
  let request = new Request('./recipes', {
    method: 'GET',
    headers: {
      'Cache-Control': 'no-cache'
    }
  });

  let response = await fetch(request);
  if (!response.ok) {
    throw new Error('failed to fetch index');
  }

  let index = await response.json();
  for (let { id } of index) {
    yield this.fetchById(id);
  }
}

RemoteRepository.prototype.fetchById = async function(id) {
  let request = new Request(`./recipes/${id}`, {
    method: 'GET',
    headers: {
      'Cache-Control': 'no-cache'
    }
  });

  let response = await fetch(request);
  if (!response.ok) {
    throw new Error('failed to fetch recipe');
  }

  let json = await response.json();
  return Recipe.fromJSON(json);
};

RemoteRepository.prototype.save = async function(recipe) {
  let url = ['recipes', recipe.id].filter(Boolean);
  var json = Recipe.toJSON(recipe);

  let request = new Request(`./${url.join('/')}`, {
    method: recipe.id ? 'PUT' : 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache'
    },
    body: JSON.stringify(json)
  });

  let response = await fetch(request);
  if (!response.ok) {
    throw new Error('failed to save recipe');
  }

  var json = await response.json();
  recipe.id = json.id;
};

RemoteRepository.prototype.delete = async function(recipe) {
  let request = new Request(`./recipes/${recipe.id}`, {
    method: 'DELETE',
    headers: {
      'Cache-Control': 'no-cache'
    }
  });

  let response = await fetch(request);
  if (!response.ok) {
    throw new Error('failed to delete recipe');
  }
};

function LocalRepository() {
  this.db = Database.create('cookbook', {
    'recipes': {
      keyPath: 'id',
      autoIncrement: false
    }
  });
}

LocalRepository.prototype.isEmpty = async function() {
  let db = await this.db;
  db.beginTx('recipes', 'readonly');

  let count = await db.count();
  return count == 0;
};

LocalRepository.prototype.fetchAll = async function*() {
  let db = await this.db;
  db.beginTx('recipes', 'readonly');

  let iterator = db.iterateAll();
  for await (let data of iterator) {
    yield Recipe.fromJSON(data);
  }
};

LocalRepository.prototype.fetchById = async function(id) {
  let db = await this.db;
  db.beginTx('recipes', 'readonly');

  let data = await db.fetchByKey(id);
  return Recipe.fromJSON(data);
};

LocalRepository.prototype.save = async function(recipe) {
  let db = await this.db;
  db.beginTx('recipes', 'readwrite');

  let data = Recipe.toJSON(recipe);
  await db.save(data);
};

LocalRepository.prototype.delete = async function(recipe) {
  let db = await this.db;
  db.beginTx('recipes', 'readwrite');

  await db.deleteByKey(recipe.id);
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
