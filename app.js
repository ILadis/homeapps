
import Repository from './repository.js';
import Views from './views.js';

const App = {
  loadIndex: async () => {
    Views.clearAll(document.body);

    let view = new Views.Index();
    let index = await Repository.fetchIndex();

    view.appendTo(document.body);
    Presenter.showIndex(view, index);
  },

  loadRecipe: async (id) => {
    Views.clearAll(document.body);

    let view = new Views.Recipe();
    let recipe = await Repository.fetchRecipe(id);

    view.appendTo(document.body);
    Presenter.showRecipe(view, recipe);
  }
};

const Presenter = {
  showIndex: function(view, index) {
    view.setQuery();
    view.onQueryChanged = (query) => {
      index.query = query;
      this.showRecords(view, index);
    };
    this.showRecords(view, index);
  },

  showRecords: function(view, { records }) {
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
  },

  showRecipe: function(view, recipe) {
    view.setName(recipe.name);
    view.setServings(recipe.servings);

    view.onServingsClicked = (change) => {
      recipe.servings.quantity += change;
      this.showRecipe(view, recipe);
    };

    this.showIngredients(view, recipe);
    this.showSteps(view, recipe);
  },

  showIngredients: function(view, { ingredients }) {
    let views = view.ingredients.values();
    for (let ingredient of ingredients) {
      let v = views.next().value || view.addIngredient();
      v.setQuantity(ingredient);
      v.setUnit(ingredient);
      v.setLabel(ingredient);
    }
  },

  showSteps: function(view, { steps }) {
    let views = view.steps.values();
    for (let step of steps) {
      let v = views.next().value || view.addStep();
      v.setText(step);

      if (!step.ingredients) {
        continue;
      }

      this.showIngredients(v, step);
    }
  }
};

export default App;

