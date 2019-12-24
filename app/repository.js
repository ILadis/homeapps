
import { Recipe } from './recipe.js';

const whiteList = new RegExp('^([a-z\\-]+)\\.json$');

export function Repository() {
}

Repository.prototype.fetchAll = async function*(fresh = false) {
  let request = new Request('./recipes');
  if (fresh) {
    request.headers.set('cache-control', 'no-cache');
  }

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
    yield this.fetchByAlias(alias, fresh);
  }
};

Repository.prototype.fetchByAlias = async function(alias, fresh) {
  let name = `${alias}.json`;
  let matches = name.match(whiteList);
  if (!matches) {
    throw new Error(`failed to fetch recipe '${alias}'`);
  }

  let request = new Request(`./recipes/${name}`);
  if (fresh) {
    request.headers.set('cache-control', 'no-cache');
  }

  let response = await fetch(request);
  if (!response.ok) {
    throw new Error(`failed to fetch recipe '${alias}'`);
  }

  let json = await response.json();
  json.alias = alias;

  return toRecipe(json);
};

Repository.prototype.save = function(recipe) {
  let alias = recipe.alias;
  let name = `${alias}.json`;
  let json = JSON.stringify(toJSON(recipe));

  let request = new Request(`./recipes/${name}`, {
    method: 'PUT',
    body: json,
    headers: {
      'Content-Type': 'application/json'
    }
  });

  let response = await fetch(request);
  if (!response.ok) {
    throw new Error(`failed to save recipe '${alias}'`);
  }

  return recipe;
};

function toRecipe(json) {
  let { name, alias, servings, steps, ingredients } = json;

  let recipe = new Recipe(name, alias);
  recipe.setServings(servings.quantity, servings.unit);

  let ingredientOf = (ref) => ingredients[ref];

  for (let { step, ingredients = [] } of steps.values()) {
    recipe.addStep(step, ingredients.map(({ ref, quantity }) => {
      var ref = ingredientOf(ref);
      return recipe.addIngredient(ref.ingredient, quantity || ref.quantity, ref.unit);
    }));
  }

  return recipe;
}

function toJSON(recipe) {
  let { name, servings, steps, ingredients } = recipe;

  let json = {
    name,
    servings: {
      quantity: servings.value,
      unit: servings.unit
    },
    ingredients: [],
    steps: []
  };

  for (let { name, quantity } of ingredients.values()) {
    json.ingredients.push({
      ingredient: name,
      quantity: quantity.value,
      unit: quantity.unit
    });
  }

  for (let { text, ingredients } of steps.values()) {
    json.steps.push({
      step: text,
      ingredients: Array.from(ingredients).map(ingredient => ({
        ref: ingredient.indexIn(recipe),
        quantity: ingredient.quantity.value
      }))
    });
  }

  return json;
}
