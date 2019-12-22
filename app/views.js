
export function Shell() {
  this.node = document.body;
  this.content = null;
}

Shell.prototype.setTitle = function(title) {
  document.title = title;
};

Shell.prototype.setContent = function(content) {
  if (this.content) {
    this.node.removeChild(this.content.node);
  }

  this.node.appendChild(content.node);
  this.content = content;
};

export const Index = function() {
  this.node = importNode(Index.template);
  this.recipes = new Set();
}

Index.template = html`
<div class="index">
  <header>
    <button></button>
    <h1><!-- title --></h1>
    <input type="search">
  </header>
  <section>
    <ol><!-- recipes --></ol>
    <button></button>
  </section>
</div>
`;

Index.prototype.setQuery = function(query) {
  let h1 = this.node.querySelector('header h1');
  h1.textContent = 'Kochbuch';

  let input = this.node.querySelector('header input');
  input.placeholder = 'Suchbegriff...';
  input.value = `${query || ''}`;
  input.oninput = () => this.onQueryChanged(input.value);
};

Index.prototype.onQueryChanged = function(query) {
};

Index.prototype.setRefreshable = function(enabled) {
  let button = this.node.querySelector('header button');
  button.hidden = !enabled;
  button.onclick = () => this.onRefreshClicked();
};

Index.prototype.onRefreshClicked = function() {
};

Index.prototype.setCreatable = function(enabled) {
  let button = this.node.querySelector('section button');
  button.hidden = !enabled;
  button.onclick = () => this.onCreateClicked();
};

Index.prototype.onCreateClicked = function() {
};

Index.prototype.addRecipe = function() {
  let ol = this.node.querySelector('section ol');

  let view = new Index.Recipe();
  ol.appendChild(view.node);

  this.recipes.add(view);
  return view;
};

Index.prototype.removeRecipe = function(view) {
  let ol = this.node.querySelector('section ol');
  ol.removeChild(view.node);
  this.recipes.delete(view);
};

Index.Recipe = function() {
  this.node = importNode(Index.Recipe.template);
}

Index.Recipe.template = html`
<li>
  <span><!-- name --></span>
</li>
`;

Index.Recipe.prototype.setName = function({ name }) {
  let span = this.node.querySelector('span');
  span.textContent = name;

  let li = this.node;
  li.onclick = () => this.onClicked();

  return this;
};

Index.Recipe.prototype.onClicked = function() {
};

export const Recipe = function() {
  this.node = importNode(Recipe.template);
  this.ingredients = new Set();
  this.steps = new Set();
}

Recipe.template = html`
<div class="recipe">
  <header>
    <h1><!-- name --></h1>
    <h2>
      <button>-</button>
      <span><!-- servings --></span>
      <button>+</button>
    </h2>
    <ul><!-- (quantity unit) ingredient --></ul>
  </header>
  <section>
    <h2><!-- steps --></h2>
    <ol><!-- (ingredients) step --></ol>
  </section>
</div>
`;

Recipe.prototype.setName = function({ name }) {
  let h1 = this.node.querySelector('header h1');
  h1.textContent = name;
  return this;
};

Recipe.prototype.setServings = function({ quantity, unit }) {
  let span = this.node.querySelector('header span');
  span.textContent = `Zutaten für ${quantity} ${unit}`;

  let buttons = this.node.querySelectorAll('button');
  buttons[0].onclick = () => this.onServingsClicked(-1);
  buttons[1].onclick = () => this.onServingsClicked(+1);

  return this;
};

Recipe.prototype.onServingsClicked = function(change) {
};

Recipe.prototype.addIngredient = function() {
  let ul = this.node.querySelector('header ul');

  let view = new Recipe.Ingredient();
  ul.appendChild(view.node);

  this.ingredients.add(view);
  return view;
};

Recipe.prototype.addStep = function() {
  let h2 = this.node.querySelector('section h2');
  h2.textContent = 'Zubereitung';

  let ol = this.node.querySelector('section ol');

  let view = new Recipe.Step();
  ol.appendChild(view.node);

  this.steps.add(view);
  return view;
};

Recipe.Ingredient = function() {
  this.node = importNode(Recipe.Ingredient.template);
}

Recipe.Ingredient.template = html`
<li>
  <span><!-- (quantity unit) ingredient --></span>
</li>
`;

Recipe.Ingredient.prototype.setLabel = function({ quantity, unit, ingredient }) {
  let label = append(ingredient, append(unit, append(quantity)));
  let span = this.node.querySelector('span');
  span.textContent = label;

  return this;

  function append(value, label = '') {
    if (value) {
      label += label ? ' ' : '';
      label += value;
    }
    return label;
  }
};

Recipe.Step = function() {
  this.node = importNode(Recipe.Step.template);
  this.ingredients = new Set();
}

Recipe.Step.template = html`
<li>
  <h3><!-- ingredients --></h3>
  <ul><!-- (quantity unit) ingredient --></ul>
  <span><!-- step --></span>
</li>
`;

Recipe.Step.prototype.setText = function({ step, ingredients }) {
  let h3 = this.node.querySelector('h3');
  h3.textContent = 'Zutaten';
  h3.hidden = Boolean(!ingredients);

  let span = this.node.querySelector('span');
  span.textContent = step;
  return this;
};

Recipe.Step.prototype.addIngredient = function() {
  let ul = this.node.querySelector('ul');

  let view = new Recipe.Ingredient();
  ul.appendChild(view.node);

  this.ingredients.add(view);
  return view;
};

export function Form() {
  this.node = importNode(Form.template);
}

Form.template = html`
<div class="form">
  <header>
    <h1><!-- title -->Neues Rezept</h1>
    <!-- name + servings -->
    <fieldset name="label">
      <legend>Bezeichnung</legend>
      <input type="text">
    </fieldset>
    <fieldset name="servings">
      <legend>Mengenangabe</legend>
      <input type="text">
      <span>Stück</span>
    </fieldset>
  </header>
  <section>
    <ul>
      <li>
        <span>200 g Frischkäse</span><span>1 Ei</span>
        <input type="text" placeholder="Zutaten hinzufügen">
        <textarea placeholder="Arbeitsschritte beschreiben"></textarea>
      </li>
    </ul>
  </section>
  <!-- steps + ingredients -->
</div>
`;

function html(source) {
  let template = document.createElement('template');
  template.innerHTML = source[0];
  return template.content;
}

function importNode(template) {
  let node = document.importNode(template, true);
  return normalizeNodes(node.firstElementChild);
}

function normalizeNodes(node) {
  let childs = node.childNodes;
  for (let child of childs) {
    let text = child.textContent;
    let type = child.nodeType;

    switch (type) {
    case Node.TEXT_NODE:
      child.textContent = text.trim();
      break;
    case Node.COMMENT_NODE:
      child.remove();
      break;
    }
    normalizeNodes(child);
  }
  return node;
}

