
import { Repository } from './repository.js';
import * as Views from './views.js';

export function Presenter() {
  this.shell = new Views.Shell();
  this.repository = new Repository();
}

Presenter.prototype.showIndex = async function() {
  let recipes = new Set();
  let view = new Views.Index();

  this.shell.setTitle('Kochbuch');
  this.shell.setContent(view);

  view.setQuery();
  view.onQueryChanged = (query) => {
    let hasScore = (r) => r.score(query) > 0;
    let byScore = (r1, r2) => r2.score(query) - r1.score(query);

    let iterator = [...recipes]
      .filter(hasScore)
      .sort(byScore)
      .values();

    showRecipes(view, iterator);
  };

  let showRecipes = async (view, iterator) => {
    let views = view.records.values();
    for await (let recipe of iterator) {
      recipes.add(recipe);

      let v = views.next().value || view.addRecord();
      v.setName(recipe);
      v.onRecordClicked = () => this.showRecipe(recipe.alias);
    }

    for (let v of views) {
      view.removeRecord(v);
    }
  };

  let iterator = this.repository.fetchAll();
  showRecipes(view, iterator);

  this.onIndexShown();
};

Presenter.prototype.onIndexShown = function() {
};

Presenter.prototype.showRecipe = async function(alias) {
  let recipe = await this.repository.fetchByAlias(alias);
  let view = new Views.Recipe();

  this.shell.setTitle(recipe.name);
  this.shell.setContent(view);

  view.setName(recipe);
  view.setServings(recipe.servings);
  view.onServingsClicked = (change) => {
    recipe.servings.quantity += change;
    view.setServings(recipe.servings);

    showIngredients(view, recipe);
    showSteps(view, recipe);
  };

  let showIngredients = (view, { ingredients }) => {
    let views = view.ingredients.values();
    for (let ingredient of ingredients) {
      let v = views.next().value || view.addIngredient();
      v.setQuantity(ingredient);
      v.setUnit(ingredient);
      v.setLabel(ingredient);
    }
  };

  let showSteps = (view, { steps }) => {
    let views = view.steps.values();
    for (let step of steps) {
      let v = views.next().value || view.addStep();
      v.setText(step);

      if ('ingredients' in step) {
        showIngredients(v, step);
      }
    }
  };

  showIngredients(view, recipe);
  showSteps(view, recipe);

  this.onRecipeShown(recipe);
};

Presenter.prototype.onRecipeShown = function(recipe) {
};

