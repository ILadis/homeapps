
(function(exports) {

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
window.onload = async function() {
  let id = document.location.hash.substr(1);
  App.loadRecipe(id);
};

