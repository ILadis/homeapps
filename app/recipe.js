
export function Recipe(name, id) {
  this.id = id;
  this.name = name;
  this.servings = undefined;
  this.ingredients = new Map();
  this.steps = new Set();
  Object.seal(this);
}

Recipe.prototype.setName = function(name) {
  this.name = name;
};

Recipe.prototype.setServings = function(quantity, unit) {
  var quantity = Number(quantity);
  var unit = unit ? String(unit) : undefined;

  if (isNaN(quantity)) {
    return null;
  }

  let servings = new Quantity(quantity, unit);
  this.servings = servings;

  return servings;
};

Recipe.prototype.convertServings = function(delta) {
  let scale = this.servings.scalingFor(delta);
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

  var name = String(name);
  var quantity = quantity ? Number(quantity) : undefined;
  var unit = unit ? String(unit) : undefined;

  if (ingredient) {
    ingredient.quantity.changeBy(quantity || 0);
  } else {
    ingredient = new Ingredient(name, new Quantity(quantity, unit));
  }

  this.ingredients.set(name, ingredient);

  let ref = ingredient.createRef();
  ref.setQuantity(quantity);
  return ref;
};

Recipe.prototype.removeIngredient = function(ref) {
  let ingredient = this.ingredients.get(ref.name);
  let orphaned = ingredient.deleteRef(ref);

  if (orphaned) {
    this.ingredients.delete(ref.name);
  }

  else {
    let quantity = -(ref.quantity.value || 0);
    ingredient.quantity.changeBy(quantity);
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

Quantity.prototype.changeBy = function(delta) {
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

const $refs = Symbol('refs');

function Ingredient(name, quantity) {
  this[$refs] = new Set();
  this.name = name;
  this.quantity = quantity;
  Object.freeze(this);
}

Ingredient.prototype.createRef = function() {
  let ref = new Ingredient.Ref(this);
  this[$refs].add(ref);
  return ref;
};

Ingredient.prototype.deleteRef = function(ref) {;
  let refs = this[$refs];
  refs.delete(ref);
  return refs.size == 0;
};

const $ingredient = Symbol('ingredient');
const $quantity = Symbol('quantity');

Ingredient.Ref = function(ingredient) {
  this[$ingredient] = ingredient;
  this[$quantity] = undefined;
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

Recipe.fromJSON = function(json) {
  let { name, id, servings, steps, ingredients } = json;

  let recipe = new Recipe(name, id);
  recipe.setServings(servings.quantity, servings.unit);

  let ingredientOf = (ref) => ingredients[ref];

  for (let { ingredient, quantity, unit } of ingredients.values()) {
    recipe.addIngredient(ingredient, quantity, unit);
  }

  for (let { step, ingredients = [] } of steps.values()) {
    recipe.addStep(step, ingredients.map(({ ref, quantity }) => {
      var ref = ingredientOf(ref);

      let ingredient = recipe.addIngredient(ref.ingredient);
      ingredient.setQuantity(quantity || ref.quantity);

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
