
window.onhashchange =
window.onload = async function() {
  let id = document.location.hash.substr(1);

  let repository = new Repository();
  let recipe = await repository.fetchRecipe(id);

  Views.clearAll(document.body);

  var view = new Views.Recipe();
  view.setName(recipe.name);
  view.setServings(recipe.servings);
  for (let ingredient of recipe.ingredients) {
    view.addIngredient(ingredient);
  }

  view.appendTo(document.body);

  var view = new Views.Steps();
  for (let step of recipe.steps) {
    view.addStep(step);
  }

  view.appendTo(document.body);
};

