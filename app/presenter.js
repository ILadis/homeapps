
import { Repository } from './repository.js';
import { Search } from './search.js';
import * as Views from './views.js';

export function Presenter() {
  this.shell = new Views.Shell();
  this.repository = new Repository();
}

Presenter.prototype.showIndex = async function() {
  let iterator = this.repository.fetchAll();
  let recipes = new Set();

  let view = new Views.Index();
  view.setRefreshable(true);
  view.setCreatable(true);

  this.shell.setTitle('Kochbuch');
  this.shell.setContent(view);

  view.onQueryChanged = (query) => {
    if (!query) {
      let iterator = recipes.values();
      return showRecipes(view, iterator);
    }

    let search = new Search(recipes);
    search.execute(query, function*(recipe) {
      yield recipe.name;
      for (let { ingredient } of recipe.ingredients) {
        yield ingredient;
      }
      for (let { step } of recipe.steps) {
        yield step;
      }
    });

    let iterator = search.values();
    showRecipes(view, iterator);
  };

  view.onRefreshClicked = () => {
    let views = view.recipes.values();
    for (let v of views) {
      view.removeRecipe(v);
    }

    let iterator = this.repository.fetchAll(true);
    recipes.clear();

    showRecipes(view, iterator);
  };

  view.onCreateClicked = () => {
    this.showForm();
  };

  let showRecipes = async (view, iterator) => {
    let views = view.recipes.values();
    for await (let recipe of iterator) {
      recipes.add(recipe);

      let v = views.next().value || view.addRecipe();
      v.setName(recipe);
      v.onClicked = () => this.showRecipe(recipe.alias);
    }

    for (let v of views) {
      view.removeRecipe(v);
    }
  };

  showRecipes(view, iterator);
  this.onIndexShown();
};

Presenter.prototype.onIndexShown = function() {
};

Presenter.prototype.showRecipe = async function(alias) {
  let recipe = await this.repository.fetchByAlias(alias);

  let view = new Views.Recipe();
  view.setName(recipe);
  view.setServings(recipe.servings);

  this.shell.setTitle(recipe.name);
  this.shell.setContent(view);

  view.onServingsClicked = (change) => {
    change *= recipe.servings.increment || 1;
    recipe.servings.quantity += change;
    view.setServings(recipe.servings);

    showIngredients(view, recipe);
    showSteps(view, recipe);
  };

  let showIngredients = (view, { ingredients }) => {
    let views = view.ingredients.values();
    for (let ingredient of ingredients) {
      let v = views.next().value || view.addIngredient();
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

Presenter.prototype.showForm = function() {
  let view = new Views.Form();

  this.shell.setTitle('Neues Rezept');
  this.shell.setContent(view);

  let addStep = view.onAddClicked = () => {
    let step = view.addStep();
    step.onIngredientSubmitted = (ingredient) => {
      step.addIngredient(ingredient);
    };
  };

  view.onDoneClicked = () => {
    this.showIndex();
  };

  addStep();
  this.onFormShown();
};

Presenter.prototype.onFormShown = function() {
};

