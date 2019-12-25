
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
  let node = importNode(Index.template);

  let input = node.querySelector('header input');
  input.oninput = () => this.onQueryChanged(input.value);

  this.node = node;
  this.recipes = new Set();
  this.setTitle('Kochbuch');
}

Index.template = html`
<div class="index">
  <header>
    <button></button>
    <h1><!-- title --></h1>
    <input type="search" placeholder="Suchbegriff...">
  </header>
  <section>
    <ol><!-- recipes --></ol>
    <button></button>
  </section>
</div>
`;

Index.prototype.setTitle = function(title) {
  let h1 = this.node.querySelector('header h1');
  h1.textContent = title;
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
  let node = importNode(Index.Recipe.template);
  node.onclick = () => this.onClicked();

  this.node = node;
}

Index.Recipe.template = html`
<li>
  <span><!-- name --></span>
</li>
`;

Index.Recipe.prototype.setName = function({ name }) {
  let span = this.node.querySelector('span');
  span.textContent = name;
  return this;
};

Index.Recipe.prototype.onClicked = function() {
};

export const Recipe = function() {
  let node = importNode(Recipe.template);

  let buttons = node.querySelectorAll('button');
  buttons[0].onclick = () => this.onServingsClicked(-1);
  buttons[1].onclick = () => this.onServingsClicked(+1);

  this.node = node;
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

Recipe.prototype.setServings = function({ servings }) {
  let span = this.node.querySelector('header span');
  span.textContent = `Zutaten für ${servings}`;
  return this;
};

Recipe.prototype.onServingsClicked = function(delta) {
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

Recipe.Ingredient.prototype.setLabel = function({ name, quantity }) {
  let label = quantity + ' ' + name;
  let span = this.node.querySelector('span');
  span.textContent = label;
  return this;
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

Recipe.Step.prototype.setText = function({ text, ingredients }) {
  let h3 = this.node.querySelector('h3');
  h3.textContent = 'Zutaten';
  h3.hidden = ingredients.size == 0;

  let span = this.node.querySelector('span');
  span.textContent = text;
  return this;
};

Recipe.Step.prototype.addIngredient = function() {
  let ul = this.node.querySelector('ul');

  let view = new Recipe.Ingredient();
  ul.appendChild(view.node);

  this.ingredients.add(view);
  return view;
};

export const Form = function() {
  let node = importNode(Form.template);

  var input = node.querySelector('fieldset[name=label] > input');
  input.onchange = (event) => this.onLabelChanged(event.target.value);

  var input = node.querySelector('fieldset[name=servings] > input');
  input.onchange = (event) => this.onServingsChanged(event.target.value);

  var button = node.querySelector('header > button');
  button.onclick = () => this.onDoneClicked();

  var button = node.querySelector('section > button');
  button.onclick = () => this.onAddClicked();

  this.node = node;
  this.setTitle('Neues Rezept');
}

Form.template = html`
<div class="form">
  <header>
    <button></button>
    <h1><!-- title --></h1>
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
    <ol><!-- steps + ingredients --></ol>
    <button></button>
  </section>
</div>
`;

Form.prototype.onLabelChanged = function(name) {
};

Form.prototype.onServingsChanged = function(quantity) {
};

Form.prototype.setTitle = function(title) {
  let h1 = this.node.querySelector('header h1');
  h1.textContent = title;
};

Form.prototype.addStep = function() {
  let ol = this.node.querySelector('section > ol');

  let view = new Form.Step();
  ol.appendChild(view.node);

  let options = { behavior: 'smooth' };
  let scroll = () => view.node.scrollIntoView(options);
  setTimeout(scroll, 100);

  return view;
};

Form.prototype.onAddClicked = function() {
};

Form.prototype.onDoneClicked = function() {
};

Form.Step = function() {
  let node = importNode(Form.Step.template);

  let form = node.querySelector('form');
  let input = node.querySelector('form input');
  input.onchange =
  form.onsubmit = (event) => {
    event.preventDefault();
    if (input.value.length) {
      this.onIngredientSubmitted(input.value);
      input.value = '';
    }
  };

  let textarea = node.querySelector('textarea');
  textarea.onchange = () => this.onStepTextChanged(textarea.value);
  textarea.oninput = () => {
    textarea.style.height = 'auto';
    textarea.style.height = (textarea.scrollHeight) + 'px';
  };

  this.node = node;
}

Form.Step.template = html`
<li>
  <form><input type="text" placeholder="Zutaten hinzufügen"></form>
  <textarea rows="1" placeholder="Arbeitsschritte beschreiben"></textarea>
</li>
`;

Form.Step.prototype.addIngredient = function({ name, quantity }) {
  let view = new Form.Step.Ingredient(name, quantity);

  let spans = this.node.querySelectorAll('span');
  if (spans.length) {
    insertAfter(view.node, spans[spans.length - 1]);
  } else {
    this.node.prepend(view.node);
  }

  return view;
};

Form.Step.prototype.removeIngredient = function(view) {
  this.node.removeChild(view.node);
};

Form.Step.prototype.onIngredientSubmitted = function(ingredient) {
};

Form.Step.prototype.onStepTextChanged = function(text) {
};

Form.Step.Ingredient = function(name, quantity) {
  let node = importNode(Form.Step.Ingredient.template);
  node.textContent = quantity + ' ' + name;
  node.onclick = () => this.onClicked();
  this.node = node;
}

Form.Step.Ingredient.template = html`
<span></span>
`;

Form.Step.Ingredient.prototype.onClicked = function() {
};

function html(source) {
  let template = document.createElement('template');
  template.innerHTML = source[0];
  return template.content;
}

function importNode(template) {
  let node = document.importNode(template, true);
  return normalizeNodes(node.firstElementChild);
}

function insertAfter(newNode, node) {
  node.parentNode.insertBefore(newNode, node.nextSibling);
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
