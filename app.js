
(function(exports) {

  function showIndex(view, index) {
    view.setQuery();

    for (let record of index) {
      let v = view.addRecord();
      v.setName(record);
      v.onRecordClicked = () => {
        location.hash = `#${record.id}`;
      };
    }
  }

  function showRecipe(view, recipe) {
    view.setName(recipe.name);
    view.setServings(recipe.servings);

    view.onServingsClicked = (change) => {
      recipe.servings.quantity += change;
      showRecipe(view, recipe);
    };

    showIngredients(view, recipe);
    showSteps(view, recipe);
  }

  function showIngredients(view, { ingredients }) {
    let views = view.ingredients.values();
    for (let ingredient of ingredients) {
      let v = views.next().value || view.addIngredient();
      v.setQuantity(ingredient);
      v.setUnit(ingredient);
      v.setLabel(ingredient);
    }
  }

  function showSteps(view, { steps }) {
    let views = view.steps.values();
    for (let step of steps) {
      let v = views.next().value || view.addStep();
      v.setText(step);

      if (!step.ingredients) {
        continue;
      }

      showIngredients(v, step);
    }
  }

  exports.App = {
    loadIndex: async function() {
      Views.clearAll(document.body);

      let view = new Views.Index();
      let index = await Repository.fetchIndex();

      showIndex(view, index);
      view.appendTo(document.body);
    },
    loadRecipe: async function(id) {
      Views.clearAll(document.body);

      let view = new Views.Recipe();
      let recipe = await Repository.fetchRecipe(id);

      showRecipe(view, recipe);
      view.appendTo(document.body);
    }
  };

})(this);

window.onhashchange =
window.onload = function() {
  let id = location.hash.substr(1);
  if (!id) {
    App.loadIndex();
  } else {
    App.loadRecipe(id);
  }
};

