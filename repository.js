
(function(exports) {

  const whiteList = new RegExp('^[a-z\\-]+$');

  function Repository() {
  }

  Repository.fetchIndex = async function() {
    let request = await fetch(`recipes/index.json`);
    if (!request.ok) {
      throw new Error(`request for index failed`);
    }

    let index = await request.json();

    for (let record of index) {
      let getter = Index.score(index, record);
      Object.defineProperty(record, 'score', {
        get: getter
      });
    }

    return index;
  };

  Repository.fetchRecipe = async function(id) {
    if (id == 'index' || !whiteList.test(id)) {
      throw new Error('invalid id given');
    }

    let request = await fetch(`recipes/${id}.json`);
    if (!request.ok) {
      throw new Error(`request for recipe '${id}' failed`);
    }

    let recipe = await request.json();

    for (let step of recipe.steps) {
      if ('ingredients' in step) {
        let iterator = Recipe.ingredients(recipe, step);
        Object.defineProperty(step, 'ingredients', {
          value: { [Symbol.iterator]: iterator }
        });
      }
    }

    for (let ingredient of recipe.ingredients) {
      if ('quantity' in ingredient) {
        let getter = Recipe.quantity(recipe, ingredient);
        Object.defineProperty(ingredient, 'quantity', {
          get: getter
        });
      }
    }

    return recipe;
  };

  function Index() {
  }

  Index.score = (index, record) => {
    return function() {
      let query = index.query;
      if (!query) {
        return true;
      }

      let match = record.name.includes(query);
      if (match) {
        return query.length / record.name.length;
      }

      return false;
    };
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

      for (let { ref, quantity } of iterator) {
        let ingredient = recipe.ingredients[ref];
        if (!quantity) {
          quantity = ingredient.quantity;
        }

        yield Object.assign({ }, ingredient, { quantity });
      }
    };
  };

  exports.Repository = Repository;

})(this);

