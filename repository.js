
(function(exports) {

  const whiteList = new RegExp('^[a-z\\-]+$');

  function Repository() {
  }

  Repository.fetchRecipe = async function(id) {
    if (id == 'index' || !whiteList.test(id)) {
      throw new Error('invalid id given');
    }

    let request = await fetch(`recipes/${id}.json`);
    if (!request.ok) {
      throw new Error(`request for ${id} failed`);
    }

    let recipe = await request.json();

    for (let step of recipe.steps) {
      if ('ingredients' in step) {
        let iterator = Recipe.ingredients(recipe, step);
        step.ingredients = { [Symbol.iterator]: iterator };
      }
    }

    for (let ingredient of recipe.ingredients) {
      if ('quantity' in ingredient) {
        let primitive = Recipe.quantity(recipe, ingredient);
        ingredient.quantity = { [Symbol.toPrimitive]: primitive };
      }
    }

    return recipe;
  };

  function Recipe() {
  }

  Recipe.quantity = (recipe, { quantity }) => {
    let servings = recipe.servings.quantity;
    return function() {
      let q = quantity * (recipe.servings.quantity / servings);
      if (q <= 0.1) {
        return '';
      } else if (q >= 1) {
        return Number.isInteger(q)
          ? q.toString()
          : q.toFixed(0);
      }

      let fraction = Number.parseInt(1 / q);
      let codePoints = [
        0, 49, 189, 8531, 188, 8533, 8537, 8528, 8539, 8529, 8530
      ];

      return String.fromCodePoint(codePoints[fraction]);
    };
  };

  Recipe.ingredients = (recipe, { ingredients }) => {
    return function*() {
      let iterator = ingredients.values();

      var result = iterator.next();
      while (!result.done) {
        let { ref, quantity } = result.value;
        let ingredient = recipe.ingredients[ref];

        if (!quantity) {
          quantity = ingredient.quantity;
        }

        var result = iterator.next();
        yield Object.assign({ }, ingredient, { quantity });
      }
    };
  };

  exports.Repository = Repository;

})(this);

