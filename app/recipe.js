
export function Recipe(name, id) {
  this.id = toNumber(id);
  this.name = toString(name);
  this.servings = undefined;
  this.ingredients = new Map();
  this.steps = new Set();
  Object.seal(this);
}

Recipe.prototype.setName = function(name) {
  this.name = toString(name);
};

Recipe.prototype.setServings = function(quantity, unit) {
  var quantity = toNumber(quantity);
  var unit = toString(unit);

  let servings = new Quantity(quantity, unit);
  this.servings = servings;

  return servings;
};

Recipe.prototype.convertServings = function(delta) {
  var delta = toNumber(delta);

  let scale = this.servings.scalingFor(delta || 0);
  this.servings.scaleTo(scale);

  for (let ingredient of this.ingredients.values()) {
    ingredient.quantity.scaleTo(scale);
  }

  for (let step of this.steps.values()) {
    for (let ingredient of step.ingredients.values()) {
      ingredient.quantity.scaleTo(scale);
    }
  }
};

Recipe.prototype.addIngredient = function(name, quantity, unit) {
  let ingredient = this.ingredients.get(name);

  var name = toString(name);
  var quantity = toNumber(quantity);
  var unit = toString(unit);

  if (ingredient) {
    ingredient.quantity.changeBy(quantity || 0);
  } else {
    ingredient = new Ingredient(name, new Quantity(quantity, unit));
  }

  this.ingredients.set(name, ingredient);

  let ref = new Ingredient.Ref(ingredient);
  ref.setQuantity(quantity);

  return ref;
};

Recipe.prototype.removeIngredient = function(ingredient) {
  let orphaned = ingredient.delete();

  if (orphaned) {
    this.ingredients.delete(ingredient.name);
  }

  else {
    let quantity = -(ingredient.quantity.value || 0);
    var ingredient = this.ingredients.get(ingredient.name);
    ingredient.quantity.changeBy(quantity);
  }
};

Recipe.prototype.addStep = function(text, ingredients) {
  let step = new Step(text, ingredients);
  this.steps.add(step);
  return step;
};

Recipe.prototype.removeEmptySteps = function() {
  for (let step of this.steps) {
    if (!step.text || !step.ingredients.size) {
      this.steps.delete(step);
    }
  }
};

Recipe.prototype.isValid = function() {
  return true
    && this.name
    && this.servings
    && this.servings.value
    && this.steps.size;
};

const $value = Symbol('value');
const $scale = Symbol('scale');

function Quantity(value, unit) {
  this[$value] = value;
  this[$scale] = 1;
  this.unit = unit;
  Object.seal(this);
}

Quantity.prototype = {
  get value() {
    if (this[$value]) {
      return this[$value] * this[$scale];
    }
  }
};

Quantity.prototype.changeBy = function(delta) {
  if (this[$value]) {
    this[$value] += delta;
  }
};

Quantity.prototype.scalingFor = function(delta) {
  return (this.value + delta) / this[$value];
};

Quantity.prototype.scaleTo = function(scale) {
  this[$scale] = scale;
};

Quantity.prototype.toString = function() {
  let value = this.value || 0 ;
  let unit = this.unit || '';

  let fractions = [
    { value: 3/4, codePoint: 190 },
    { value: 2/3, codePoint: 8532 },
    { value: 1/2, codePoint: 189 },
    { value: 2/5, codePoint: 8534 },
    { value: 1/3, codePoint: 8531 },
    { value: 1/4, codePoint: 188 },
    { value: 1/5, codePoint: 8533},
  ];

  let integer = Math.trunc(value);
  let fraction = value - integer;

  if (integer >= 10 || fraction <= 0.1) {
    return (integer || '') + ' ' + unit;
  }

  let cp = fractions.reduce((closest, current) => {
    let delta1 = Math.abs(current.value - fraction);
    let delta2 = Math.abs(closest.value - fraction);
    return (delta1 < delta2) ? current : closest;
  }).codePoint;

  return (integer || '') + String.fromCodePoint(cp) + ' ' + unit;
};

const $refs = Symbol('refs');

function Ingredient(name, quantity) {
  this[$refs] = new Set();
  this.name = name;
  this.quantity = quantity;
  Object.freeze(this);
}

const $ingredient = Symbol('ingredient');

Ingredient.Ref = function(ingredient) {
  this[$ingredient] = ingredient;
  this.quantity = undefined;
  this[$ingredient][$refs].add(this);
  Object.seal(this);
};

Ingredient.Ref.prototype = {
  get name() {
    return this[$ingredient].name;
  }
};

Ingredient.Ref.prototype.setQuantity = function(quantity) {
  let ingredient = this[$ingredient];
  var quantity = new Quantity(quantity, ingredient.quantity.unit);
  this.quantity = quantity;
};

Ingredient.Ref.prototype.indexIn = function(recipe) {
  let ingredients = Array.from(recipe.ingredients.values());
  return ingredients.indexOf(this[$ingredient]);
};

Ingredient.Ref.prototype.delete = function() {;
  let refs = this[$ingredient][$refs];
  refs.delete(this);
  return refs.size == 0;
};

function Step(text, ingredients) {
  this.text = text;
  this.ingredients = new Set(ingredients);
  Object.seal(this);
}

Step.prototype.setText = function(text) {
  this.text = text;
};

Step.prototype.addIngredient = function(ingredient) {
  this.ingredients.add(ingredient);
};

Step.prototype.removeIngredient = function(ingredient) {
  this.ingredients.delete(ingredient);
};

function toString(value, fallback = undefined) {
  return value ? String(value) : fallback;
}

function toNumber(value, fallback = undefined) {
  return Number(value) || fallback;
}

Recipe.fromJSON = function(json) {
  let { name, id, servings, steps, ingredients } = json;

  let recipe = new Recipe(name, id);
  recipe.setServings(servings.quantity, servings.unit);

  let ingredientOf = (ref) => ingredients[ref];

  for (let { ingredient, quantity, unit } of ingredients.values()) {
    let ref = recipe.addIngredient(ingredient, quantity, unit);
    ref.delete();
  }

  for (let { step, ingredients = [] } of steps.values()) {
    recipe.addStep(step, ingredients.map(({ ref, quantity }) => {
      var ref = ingredientOf(ref);
      var quantity = quantity || ref.quantity;

      let ingredient = recipe.addIngredient(ref.ingredient);
      ingredient.setQuantity(quantity);

      return ingredient;
    }));
  }

  return recipe;
};

Recipe.toJSON = function(recipe) {
  let { name, id, servings, steps, ingredients } = recipe;

  let json = {
    name, id,
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
      ingredients: [...ingredients].map(ingredient => ({
        ref: ingredient.indexIn(recipe),
        quantity: ingredient.quantity.value
      }))
    });
  }

  return json;
};

Recipe.toURL = function(recipe) {
  let json = JSON.stringify(Recipe.toJSON(recipe));
  let url = 'data:application/json;charset=utf-8,'
    + encodeURIComponent(json);

  return url;
};
