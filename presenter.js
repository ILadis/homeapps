
import { Repository } from './repository.js';
import { Views } from './views.js';

export function Presenter() {
}

Presenter.showIndex = async function() {
  let repository = await Repository.create();
  let iterator = repository.fetchAll();
  let recipes = new Set();
  let view = new Views.Index();

  Views.clearAll(document.body);
  view.appendTo(document.body);

  view.setQuery();
  view.onQueryChanged = (query) => filterRecords(view, recipes, query);

  showRecords(view, recipes, iterator);
};

Presenter.showRecipe = function(recipe) {
  let view = new Views.Recipe();

  Views.clearAll(document.body);
  view.appendTo(document.body);

  view.setName(recipe);
  view.setServings(recipe.servings);
  view.onServingsClicked = (change) => {
    recipe.servings.quantity += change;
    view.setServings(recipe.servings);
    showIngredients(view, recipe.ingredients);
    showSteps(view, recipe.steps);
  };

  showIngredients(view, recipe.ingredients);
  showSteps(view, recipe.steps);
};

async function showRecords(view, recipes, iterator) {
  let views = view.records.values();
  for await (let recipe of iterator) {
    recipes.add(recipe);

    let v = views.next().value || view.addRecord();
    v.setName(recipe);
    v.onRecordClicked = () => Presenter.showRecipe(recipe);
  }

  for (let v of views) {
    view.removeRecord(v);
  }
}

function filterRecords(view, recipes, query) {
  let hasScore = (r) => r.score(query) > 0;
  let byScore = (r1, r2) => r2.score(query) - r1.score(query);

  let iterator = [...recipes].filter(hasScore).sort(byScore).values();
  showRecords(view, recipes, iterator);
}

function showIngredients(view, ingredients) {
  let views = view.ingredients.values();
  for (let ingredient of ingredients) {
    let v = views.next().value || view.addIngredient();
    v.setQuantity(ingredient);
    v.setUnit(ingredient);
    v.setLabel(ingredient);
  }
}

function showSteps(view, steps) {
  let views = view.steps.values();
  for (let step of steps) {
    let v = views.next().value || view.addStep();
    v.setText(step);

    if ('ingredients' in step) {
      showIngredients(v, step.ingredients);
    }
  }
}

