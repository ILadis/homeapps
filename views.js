
function Index() {
  this.node = importNode(Index.template);
  this.records = new Set();
}

Index.template = html`
<div class="index">
  <header>
    <h1><!-- title --></h1>
    <input type="search">
  </header>
  <section>
    <ol><!-- records --></ol>
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

Index.prototype.addRecord = function() {
  let ol = this.node.querySelector('section ol');

  let view = new Record();
  ol.appendChild(view.node);

  this.records.add(view);
  return view;
};

Index.prototype.removeRecord = function(view) {
  let ol = this.node.querySelector('section ol');
  ol.removeChild(view.node);
  this.records.delete(view);
};

Index.prototype.appendTo = function(node) {
  node.appendChild(this.node);
};

function Record() {
  this.node = importNode(Record.template);
}

Record.template = html`
<li>
  <span><!-- name --></span>
</li>
`;

Record.prototype.setName = function({ name }) {
  let span = this.node.querySelector('span');
  span.textContent = name;

  let li = this.node;
  li.onclick = () => this.onRecordClicked();

  return this;
};

Record.prototype.onRecordClicked = function() {
};

function Recipe() {
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

Recipe.prototype.setName = function(name) {
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

  let view = new Ingredient();
  ul.appendChild(view.node);

  this.ingredients.add(view);
  return view;
};

Recipe.prototype.addStep = function() {
  let h2 = this.node.querySelector('section h2');
  h2.textContent = 'Zubereitung';

  let ol = this.node.querySelector('section ol');

  let view = new Step();
  ol.appendChild(view.node);

  this.steps.add(view);
  return view;
};

Recipe.prototype.appendTo = function(node) {
  node.appendChild(this.node);
};

function Ingredient() {
  this.node = importNode(Ingredient.template);
}

Ingredient.template = html`
<li>
  <span><!-- quantity --></span>
  <span><!-- unit --></span>
  <span><!-- ingredient --></span>
</li>
`;

Ingredient.prototype.setQuantity = function({ quantity }) {
  let span = this.node.querySelectorAll('span')[0];
  span.textContent = `${quantity || ''}`;
  return this;
};

Ingredient.prototype.setUnit = function({ unit }) {
  let span = this.node.querySelectorAll('span')[1];
  span.textContent = `${unit || ''}`;
  return this;
};

Ingredient.prototype.setLabel = function({ ingredient }) {
  let span = this.node.querySelectorAll('span')[2];
  span.textContent = `${ingredient || ''}`;
  return this;
};

function Step() {
  this.node = importNode(Step.template);
  this.ingredients = new Set();
}

Step.template = html`
<li>
  <h3><!-- ingredients --></h3>
  <ul><!-- (quantity unit) ingredient--></ul>
  <span><!-- step --></span>
</li>
`;

Step.prototype.setText = function({ step, ingredients }) {
  let h3 = this.node.querySelector('h3');
  h3.textContent = 'Zutaten';
  h3.hidden = Boolean(!ingredients);

  let span = this.node.querySelector('span');
  span.textContent = step;
  return this;
};

Step.prototype.addIngredient = function() {
  let ul = this.node.querySelector('ul');

  let view = new Ingredient();
  ul.appendChild(view.node);

  this.ingredients.add(view);
  return view;
};

function html(source) {
  let template = document.createElement('template');
  template.innerHTML = source[0];
  return template.content;
}

function clearAll(node) {
  while (node.firstChild) {
    node.firstChild.remove();
  }
}

function trimTextNodes(node) {
  let childs = node.childNodes;
  for (let child of childs) {
    let text = child.textContent;
    if (child.nodeType == 3) {
      child.textContent = text.trim();
    } else {
      trimTextNodes(child);
    }
  }
  return node;
}

function importNode(template) {
  let node = document.importNode(template, true);
  return trimTextNodes(node.firstElementChild);
}

export default { Index, Recipe, clearAll };

