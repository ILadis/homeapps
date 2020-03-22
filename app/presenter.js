
import { Client } from './client.js';
import { Repository } from './repository.js';
import { Search } from './search.js';
import { Recipe } from './recipe.js';
import * as Views from './views.js';

export function Presenter() {
  this.shell = new Views.Shell();
  this.client = new Client();
  this.repository = Repository.create();
}

Presenter.prototype.showIndex = async function() {
  let repo = await this.repository;
  let recipes = new Set();

  let view = new Views.Index();
  view.setTitle('Kochbuch');

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
      for (let { name } of recipe.ingredients.values()) {
        yield name;
      }
      for (let { text } of recipe.steps.values()) {
        yield text;
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

    let iterator = repo.fetchAll();
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
      v.onClicked = () => this.showRecipe(recipe.id);
    }

    for (let v of views) {
      view.removeRecipe(v);
    }
  };

  let empty = await repo.isEmpty();
  if (empty) {
    let iterator = this.client.fetchAll(true);
    for await (let recipe of iterator) {
      await repo.save(recipe);
    }
  }

  let iterator = repo.fetchAll();
  showRecipes(view, iterator);
  this.onIndexShown();
};

Presenter.prototype.onIndexShown = function() {
};

Presenter.prototype.showRecipe = async function(id) {
  let repo = await this.repository;
  let recipe = await repo.fetchById(id);

  let view = new Views.Recipe();
  view.setName(recipe);
  view.setServings(recipe);

  this.shell.setTitle(recipe.name);
  this.shell.setContent(view);

  view.onEditClicked = () => {
    this.showForm(id);
  };

  view.onServingsClicked = (delta) => {
    // TODO this does currently not work
    delta *= recipe.servings.increment || 1;
    recipe.convertServings(delta);
    view.setServings(recipe);

    showIngredients(view, recipe);
    showSteps(view, recipe);
  };

  let showIngredients = (view, { ingredients }) => {
    let views = view.ingredients.values();
    for (let ingredient of ingredients.values()) {
      let v = views.next().value || view.addIngredient();
      v.setLabel(ingredient);
    }
  };

  let showSteps = (view, { steps }) => {
    let views = view.steps.values();
    for (let step of steps.values()) {
      let v = views.next().value || view.addStep();
      v.setText(step);

      showIngredients(v, step);
    }
  };

  showIngredients(view, recipe);
  showSteps(view, recipe);
  this.onRecipeShown(recipe);
};

Presenter.prototype.onRecipeShown = function(recipe) {
};

Presenter.prototype.showForm = async function(id) {
  let repo = await this.repository;

  let view = new Views.Form();
  if (id) {
    var recipe = await repo.fetchById(id);
    view.setTitle('Rezept bearbeiten');
  } else {
    var recipe = new Recipe();
    recipe.setServings(undefined, 'Stück');
    recipe.addStep();
    view.setTitle('Neues Rezept');
  }

  this.shell.setTitle('Neues Rezept');
  this.shell.setContent(view);

  view.setLabel(recipe);
  view.onLabelChanged = (name) => {
    recipe.setName(name);
  };

  view.setServings(recipe);
  view.onQuantityChanged = (quantity) => {
    recipe.setServings(quantity, recipe.servings.unit);
    view.setServings(recipe);
  };

  view.onUnitChanged = (unit) => {
    recipe.setServings(recipe.servings.value, unit);
    view.setServings(recipe);
  };

  view.onOtherUnitClicked = () => {
    view.promptForUnit();
  };

  view.onExportClicked = () => {
    recipe.removeEmptySteps();
    showSteps(view, recipe);

    if (recipe.isValid()) {
      var name = recipe.name + '.json';
      var url = Recipe.toURL(recipe);
    }

    view.setExportUrl(name, url);
  };

  view.onAddStepClicked = () => {
    recipe.addStep();
    showSteps(view, recipe);
  };

  view.onDoneClicked = async () => {
    recipe.removeEmptySteps();
    showSteps(view, recipe);

    if (recipe.isValid()) {
      await repo.save(recipe);
      this.showRecipe(recipe.id);
    }
  };

  view.onDeleteClicked = async () => {
    if (recipe.id) {
      await repo.delete(recipe);
    }
    this.showIndex();
  };

  let showIngredients = (view, step) => {
    let iterator = step.ingredients.values();
    let views = view.ingredients.values();
    for (let ingredient of iterator) {
      let v = views.next().value || view.addIngredient();
      v.setLabel(ingredient);
      v.onClicked = removeIngredient(view, step, ingredient);
    }

    for (let v of views) {
      view.removeIngredient(v);
    }
  };

  let showSteps = (view, { steps }) => {
    let iterator = steps.values();
    let views = view.steps.values();
    for (let step of iterator) {
      let v = views.next().value || view.addStep();
      v.setStepText(step);

      v.onIngredientSubmitted = (ingredient) => {
        var ingredient = addIngredient(ingredient);
        if (ingredient) {
          step.addIngredient(ingredient);
          showIngredients(v, step);
        }
      };

      v.onStepTextChanged = (text) => {
        step.setText(text);
      };

      showIngredients(v, step);
    }
  };

  let addIngredient = (ingredient) => {
    let parts = ingredient.split(' ').filter(p => !!p);
    switch (parts.length) {
    case 0:
      return;
    case 1:
      var ingredient = parts[0];
      break;
    case 2:
      var quantity = parts[0];
      var ingredient = parts[1];
      break;
    case 3:
    default:
      var quantity = parts[0];
      var unit = parts[1];
      var ingredient = parts.slice(2).join(' ');
      break;
    }

    if (quantity && isNaN(Number(quantity))) {
      ingredient = quantity + ' ' + ingredient;
      quantity = undefined;
    }

    return recipe.addIngredient(ingredient, quantity, unit);
  };

  let removeIngredient = (view, step, ingredient) => {
    return function() {
      step.removeIngredient(ingredient);
      recipe.removeIngredient(ingredient);
      view.removeIngredient(this);
    };
  };

  showSteps(view, recipe);
  this.onFormShown(recipe);
};

Presenter.prototype.onFormShown = function(edit) {
};

