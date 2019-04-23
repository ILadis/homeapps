(function(exports) {

  function* ingredients(recipe, ingredients) {
    for (let i = 0; i < ingredients.length; i++) {
      let ingredient = ingredients[i];
      let ref = recipe.ingredients[ingredient.ref];
      yield Object.assign({ }, ref, ingredient);
    }
  }

  const whiteList = new RegExp('^[a-z\\-]+$');

  function Repository() {
  }

  Repository.prototype.fetchRecipe = async function(id) {
    if (!whiteList.test(id)) {
      throw new Error('invalid id given');
    }

    let request = await fetch(`recipes/${id}.json`);
    if (!request.ok) {
      throw new Error(`request for ${id} failed`);
    }

    let recipe = await request.json();

    for (let step of recipe.steps) {
      if (step.ingredients) {
        let iterator = ingredients.bind(null, recipe, step.ingredients);
        step.ingredients[Symbol.iterator] = iterator;
      }
    }

    return recipe;
  };

  exports.Repository = Repository;

})(this);

