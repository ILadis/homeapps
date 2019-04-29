
const whiteList = new RegExp('^([a-z\\-]+)\\.json$');

export function Repository() {
}

Repository.prototype.fetchAll = async function*() {
  let request = new Request('./recipes', {
    method: 'GET'
  });

  let response = await fetch(request);
  if (!response.ok) {
    throw new Error('failed to fetch index');
  }

  let index = await response.json();
  for (let { name } of index) {
    let matches = name.match(whiteList);
    if (!matches) {
      continue;
    }

    let alias = matches[1];
    yield this.fetchByAlias(alias);
  }
};

Repository.prototype.fetchByAlias = async function(alias) {
  let request = new Request(`./recipes/${alias}.json`, {
    method: 'GET'
  });

  let response = await fetch(request);
  if (!response.ok) {
    throw new Error(`failed to fetch recipe '${alias}'`);
  }

  let json = await response.json();
  json.alias = alias;

  return new Recipe(json);
};

export function Recipe() {
  Object.assign(this, ...arguments);

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

