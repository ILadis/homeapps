
import { Search } from './search.js';
import { Recipe, Ingredient } from './recipe.js';
import * as Views from './views.js';

export function Presenter(shell, repo, principal) {
  this.shell = shell;
  this.repo = repo;
  this.principal = principal;
}

Presenter.prototype.showIndex = async function() {
  let recipes = new Set();
  let search = new Search(recipes, Recipe.search);

  if (this.view) {
    var view = this.view;
  } else {
    var view = new Views.Index();
    view.setTitle('Kochbuch');
  }

  this.view = view;
  this.shell.setTitle('Kochbuch');
  this.shell.setContent(view);

  let authenticated = this.principal.authenticated();
  view.onPasswordProvided = async (password) => {
    authenticated = await this.principal.login(password);
    if (authenticated) {
      this.showForm();
    }
  };

  view.onQueryChanged = (query) => {
    let results = search.execute(query) || recipes;
    showRecipes(view, results);
  };

  view.onRefreshClicked = () => {
    let views = view.recipes.values();
    for (let v of views) {
      view.removeRecipe(v);
    }

    let iterator = this.repo.fetchAll(true);
    recipes.clear();

    showRecipes(view, iterator);
  };

  view.onCreateClicked = () => {
    if (authenticated) {
      this.showForm();
    }
    else view.promptForPassword();
  };

  let showRecipes = async (view, iterator) => {
    let views = view.recipes.values();
    for await (let recipe of iterator) {
      recipes.add(recipe);

      let v = views.next().value || view.addRecipe();
      v.setName(recipe);
      v.onClicked = () => {
        view.saveStates();
        this.showRecipe(recipe.id);
      };
    }

    for (let v of views) {
      view.removeRecipe(v);
    }
  };

  view.restoreStates();

  let empty = await this.repo.isEmpty();
  let fresh = empty == true;

  let iterator = this.repo.fetchAll(fresh);
  showRecipes(view, iterator);
  this.onIndexShown();
};

Presenter.prototype.onIndexShown = function() {
};

Presenter.prototype.showRecipe = async function(id) {
  let recipe = await this.repo.fetchById(id);

  let view = new Views.Recipe();
  view.setName(recipe);
  view.setServings(recipe);

  let authenticated = this.principal.authenticated();
  view.enableEditAction(authenticated);

  this.shell.setTitle(recipe.name);
  this.shell.setContent(view);

  view.onEditClicked = () => {
    this.showForm(id);
  };

  view.enableShareAction(!!navigator.share);
  view.onShareClicked = () => {
    navigator.share({
      title: recipe.name,
      url: location.href,
    })
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
  let view = new Views.Form();
  if (id) {
    var recipe = await this.repo.fetchById(id);
    var title = 'Rezept bearbeiten';
  } else {
    var recipe = new Recipe();
    recipe.setServings(undefined, 'Stück');
    recipe.addStep();
    var title = 'Neues Rezept';
  }

  let authenticated = this.principal.authenticated();
  view.enableDoneAction(authenticated);
  view.enableDeleteAction(authenticated);

  view.setTitle(title);

  this.shell.setTitle(title);
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
      await this.repo.save(recipe);
      this.showRecipe(recipe.id);
    }
  };

  view.onDeleteClicked = async () => {
    if (recipe.id) {
      await this.repo.delete(recipe);
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

    for (let v of views) {
      view.removeStep(v);
    }
  };

  let addIngredient = (text) => {
    let { ingredient, quantity, unit } = Ingredient.parse(text);
    if (ingredient) {
      return recipe.addIngredient(ingredient, quantity, unit);
    }
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

