
export function Recipe(name, alias) {
  this.name = name;
  this.alias = alias;
  this.servings = null;
  this.ingredients = new Map();
  this.steps = new Set();
  Object.seal(this);
}

Recipe.prototype.setName = function(name, alias) {
  this.name = name;
  this.alias = alias;
};

Recipe.prototype.setServings = function(quantity, unit) {
  var quantity = Number(quantity);
  if (!Number.isNaN(quantity)) {
    this.servings = new Quantity(quantity, unit);
  }
};

Recipe.prototype.convertServings = function(delta) {
  let scale = this.servings.scalingFor(delta);
  this.servings.scaleTo(scale);

  for (let ingredient of this.ingredients.values()) {
    ingredient.quantity.scaleTo(scale);
  }

  for (let step of this.steps.values()) {
    for (let ingredient of step.ingredients.values()) {
      if (ingredient[$quantity]) {
        ingredient.quantity.scaleTo(scale);
      }
    }
  }
};

Recipe.prototype.addIngredient = function(name, quantity, unit) {
  let ingredient = this.ingredients.get(name);

  var quantity = Number(quantity) || quantity;

  if (ingredient) {
    ingredient.quantity.changeBy(quantity);
  } else {
    ingredient = new Ingredient(name, new Quantity(quantity, unit));
  }

  this.ingredients.set(name, ingredient);

  let ref = new Ingredient.Ref(ingredient);
  ref.setQuantity(quantity);
  return ref;
};

Recipe.prototype.removeIngredient = function(ingredient) {
  let quantity = this.ingredients.get(ingredient.name).quantity;
  quantity[$value] -= ingredient.quantity.value;

  if (quantity[$value] == 0) {
    this.ingredients.delete(ingredient.name);
  }
};

Recipe.prototype.addStep = function(text, ingredients) {
  let step = new Step(text, ingredients);
  this.steps.add(step);
  return step;
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

Quantity.prototype.changeBy = function(delta = 0) {
  if (this[$value]) {
    this[$value] += delta;
  }
}

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

function Ingredient(name, quantity) {
  this.name = name;
  this.quantity = quantity;
  Object.freeze(this);
}

const $ingredient = Symbol('ingredient');
const $quantity = Symbol('quantity');

Ingredient.Ref = function(ingredient) {
  this[$ingredient] = ingredient;
  this[$quantity] = null;
  Object.seal(this);
};

Ingredient.Ref.prototype = {
  get name() {
    return this[$ingredient].name;
  },
  get quantity() {
    return this[$quantity] || this[$ingredient].quantity;
  }
};

Ingredient.Ref.prototype.setQuantity = function(quantity) {
  this[$quantity] = new Quantity(quantity, this.quantity.unit);
};

Ingredient.Ref.prototype.indexIn = function(recipe) {
  let ingredients = Array.from(recipe.ingredients.values());
  return ingredients.indexOf(this[$ingredient]);
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
