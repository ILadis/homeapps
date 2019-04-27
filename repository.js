
export function Repository(db) {
  this.db = db;
}

Repository.create = async function() {
  let schema = (db) => {
    db.createStore('recipes', { keyPath: 'id', autoIncrement: true });
  };
  schema.version = 1;

  let db = await Database.create('cookbook', schema);
  return new Repository(db);
};

Repository.prototype.save = function(data) {
  this.db.beginTx('recipes', 'readwrite');
  return this.db.storeData(data);
};

Repository.prototype.iterateAll = function() {
  this.db.beginTx('recipes', 'readonly');
  return this.db.iterateData(Recipe);
};

Repository.prototype.purgeAll = function() {
  this.db.beginTx('recipes', 'readwrite');
  return this.db.clearData();
};

export function Recipe() {
  for (let step of this.steps) {
    if ('ingredients' in step) {
      let ingredients = Recipe.ingredients(this, step);
      Object.defineProperty(step, 'ingredients', {
        value: { [Symbol.iterator]: ingredients }
      });
    }
  }

  for (let ingredient of this.ingredients) {
    if ('quantity' in ingredient) {
      let quantity = Recipe.quantity(this, ingredient);
      Object.defineProperty(ingredient, 'quantity', {
        get: quantity
      });
    }
  }

  let score = Recipe.score(this);
  Object.defineProperty(this, 'score', {
    value: score
  });

  return this;
}

Recipe.quantity = (recipe, { quantity }) => {
  let servings = recipe.servings.quantity;
  return function() {
    let factor = recipe.servings.quantity / servings;
    let value = quantity * factor;

    if (value <= 0.1) {
      return '';
    } else if (value >= 1) {
      return Number.isInteger(value)
        ? value.toString()
        : value.toFixed(0);
    }

    let fraction = Number.parseInt(1 / value);
    let codePoints = [
      0, 49, 189, 8531, 188, 8533, 8537, 8528, 8539, 8529, 8530
    ];

    return String.fromCodePoint(codePoints[fraction]);
  };
};

Recipe.ingredients = (recipe, { ingredients }) => {
  return function*() {
    let iterator = ingredients.values();

    for (let { ref, quantity } of iterator) {
      let ingredient = recipe.ingredients[ref];
      if (!quantity) {
        quantity = ingredient.quantity;
      }

      yield Object.assign({ }, ingredient, { quantity });
    }
  };
};

Recipe.score = (recipe) => {
  return function(query) {
    if (!query) {
      return true;
    }

    let name = recipe.name;
    let match = name.includes(query);

    if (match) {
      return query.length / name.length;
    }

    return false;
  };
};

export function Database(db) {
  this.db = db;
}

Database.create = function(name, schema) {
  let request = indexedDB.open(name, schema.version);

  return new Promise((resolve, reject) => {
    request.onupgradeneeded = () => {
      let db = new Database(request.result);
      schema(db);
    };

    request.onsuccess = () => {
      let db = new Database(request.result);
      resolve(db);
    };

    request.onerror = () => {
      let error = request.error;
      reject(error);
    };
  });
};

Database.promisify = function(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

Database.prototype.createStore = function(name, options) {
  let store = this.db.createObjectStore(name, options);
  this.store = store;
  return this;
};

Database.prototype.createIndex = function(name, options) {
  this.store.createIndex(name, name, options);
  return this;
};

Database.prototype.beginTx = function(name, mode) {
  let store = this.db.transaction(name, mode).objectStore(name);
  this.store = store;
  return this;
};

Database.prototype.storeData = function(data) {
  let keyPath = this.store.keyPath;
  if (keyPath in data) {
    var request = this.store.put(data);
  } else {
    var request = this.store.add(data);
  }
  return Database.promisify(request);
};

Database.prototype.fetchData = async function(index, value, decorator) {
  let request = this.store.index(index).get(value);
  let data = await Database.promisify(request);
  return decorator.call(data);
};

Database.prototype.iterateData = async function*(decorator) {
  let request = this.store.openCursor();

  do {
    let cursor = await Database.promisify(request);
    if (!cursor) {
      return;
    }

    yield decorator.call(cursor.value);

    cursor.continue();
  } while (true);
};

Database.prototype.clearData = function() {
  let request = this.store.clear();
  return Database.promisify(request);
};

