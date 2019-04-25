
(function(exports) {

  function App() {
  }

  App.loadIndex = async function() {
    Views.clearAll(document.body);

    let view = new Views.Index();
    let index = await Repository.fetchIndex();

    Presenter.showIndex(view, index);
    view.appendTo(document.body);
  };

  App.loadRecipe = async function(id) {
    Views.clearAll(document.body);

    let view = new Views.Recipe();
    let recipe = await Repository.fetchRecipe(id);

    Presenter.showRecipe(view, recipe);
    view.appendTo(document.body);
  };

  document.onselectstart = () => false;

  window.onhashchange =
  window.onload = () => {
    let id = location.hash.substr(1);
    if (!id) {
      App.loadIndex();
    } else {
      App.loadRecipe(id);
    }
  };

  function Presenter() {
  }

  Presenter.showIndex = function(view, index) {
    view.setQuery();
    view.onQueryChanged = (query) => {
      index.query = query;
      Presenter.showRecords(view, index);
    };
    Presenter.showRecords(view, index);
  };

   Presenter.showRecords = function(view, index) {
    let hasScore = (r) => r.score;
    let byScore = (r1, r2) => r2.score - r1.score;

    let records = index.filter(hasScore).sort(byScore);

    let views = view.records.values();
    for (let record of records) {
      let v = views.next().value || view.addRecord();
      v.setName(record);
      v.onRecordClicked = () => {
        location.hash = `#${record.id}`;
      };
    }

    for (let v of views) {
      view.removeRecord(v);
    }
  };

  Presenter.showRecipe = function(view, recipe) {
    view.setName(recipe.name);
    view.setServings(recipe.servings);

    view.onServingsClicked = (change) => {
      recipe.servings.quantity += change;
      Presenter.showRecipe(view, recipe);
    };

    Presenter.showIngredients(view, recipe);
    Presenter.showSteps(view, recipe);
  };

  Presenter.showIngredients = function(view, { ingredients }) {
    let views = view.ingredients.values();
    for (let ingredient of ingredients) {
      let v = views.next().value || view.addIngredient();
      v.setQuantity(ingredient);
      v.setUnit(ingredient);
      v.setLabel(ingredient);
    }
  };

  Presenter.showSteps = function(view, { steps }) {
    let views = view.steps.values();
    for (let step of steps) {
      let v = views.next().value || view.addStep();
      v.setText(step);

      if (!step.ingredients) {
        continue;
      }

      Presenter.showIngredients(v, step);
    }
  };

})(this);

