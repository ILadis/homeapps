
import { Recipe } from './recipe.js';
import { Database } from './storage.js';

export function Repository(principal) {
  this.remote = new RemoteRepository(principal);
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

Repository.prototype.fetchById = async function(id) {
  var recipe = await this.local.fetchById(id);

  if (!recipe) {
    var recipe = await this.remote.fetchById(id);
  }

  return recipe;
};

Repository.prototype.save = async function(recipe) {
  await this.remote.save(recipe);
  await this.local.save(recipe);
};

Repository.prototype.delete = async function(recipe) {
  await this.remote.delete(recipe);
  await this.local.delete(recipe);
};

function RemoteRepository(principal) {
  this.principal = principal;
}

RemoteRepository.prototype.fetchAll = async function*() {
  let request = new Request('./recipes', {
    method: 'GET'
  });

  let response = await fetch(request);
  if (!response.ok) {
    throw new Error('failed to fetch index');
  }

  let index = await response.json();
  for (let { id } of index) {
    yield this.fetchById(id);
  }
};

RemoteRepository.prototype.fetchById = async function(id) {
  let request = new Request(`./recipes/${id}`, {
    method: 'GET'
  });

  let response = await fetch(request);
  if (!response.ok) {
    throw new Error('failed to fetch recipe');
  }

  let json = await response.json();
  return Recipe.fromJSON(json);
};

RemoteRepository.prototype.save = async function(recipe) {
  let url = toUrl('.', 'recipes', recipe.id);
  var json = Recipe.toJSON(recipe);

  let request = new Request(url, {
    method: recipe.id ? 'PUT' : 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(json)
  });

  this.principal.authenticate(request);

  let response = await fetch(request);
  if (!response.ok) {
    throw new Error('failed to save recipe');
  }

  var json = await response.json();
  recipe.id = json.id;
};

RemoteRepository.prototype.delete = async function(recipe) {
  let request = new Request(`./recipes/${recipe.id}`, {
    method: 'DELETE'
  });

  this.principal.authenticate(request);

  let response = await fetch(request);
  if (!response.ok) {
    throw new Error('failed to delete recipe');
  }
};

function LocalRepository() {
  this.db = Database.create('cookbook', (schema) => {
    schema.createObjectStore('recipes', {
      keyPath: 'id',
      autoIncrement: false
    }).createIndex('name', 'name', {
      unique: false,
      multiEntry: false,
      locale: 'auto'
    });
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

  let iterator = db.iterateAll('name');
  for await (let data of iterator) {
    yield Recipe.fromJSON(data);
  }
};

LocalRepository.prototype.fetchById = async function(id) {
  let db = await this.db;
  db.beginTx('recipes', 'readonly');

  let data = await db.fetchByKey(id);
  if (!data) {
    return false;
  }

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

function toUrl(...segments) {
  return segments.filter(Boolean).join('/');
}
