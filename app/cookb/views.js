
import { html, define, submitHandler } from './dom.js';

export function Shell() {
  this.content = null;
}

Shell.prototype.setTitle = function(title) {
  document.title = title;
};

Shell.prototype.setContent = function(content) {
  if (this.content) {
    this.content.remove();
  }

  document.body.prepend(content);
  this.content = content;
};

export const Index = define('recipe-index', 'div', html`
<header>
  <h1>
    <svg viewBox="0 0 24 24"><use href="#refresh"></use></svg>
    <span><!-- title --></span>
  </h1>
  <input type="search" placeholder="Suchbegriff...">
</header>
<section>
  <ol><!-- recipes --></ol>
  <svg viewBox="0 0 24 24"><use href="#create"></use></svg>
</section>`, function() {
  let buttons = this.querySelectorAll('svg');
  buttons[0].onclick = () => this.onRefreshClicked();
  buttons[1].onclick = () => this.onCreateClicked();

  let input = this.querySelector('header input');
  input.oninput = () => this.onQueryChanged(input.value);

  this.recipes = new Set();
  this.states = new Map();
});

Index.prototype.saveStates = function() {
  let position = this.querySelector('section').scrollTop;
  this.states.set('scrollTop', position);
};

Index.prototype.restoreStates = function() {
  let position = this.states.get('scrollTop') || 0;
  this.querySelector('section').scrollTop = position;
  this.querySelector('header input').value = '';
};

Index.prototype.setTitle = function(title) {
  let span = this.querySelector('header h1 span');
  span.textContent = title;
};

Index.prototype.onRefreshClicked = function() {
};

Index.prototype.onCreateClicked = function() {
};

Index.prototype.onQueryChanged = function(query) {
};

Index.prototype.getQuery = function() {
  let input = this.querySelector('header input');
  return input.value;
};

Index.prototype.addRecipe = function() {
  let ol = this.querySelector('section ol');

  let view = new Index.Recipe();
  ol.appendChild(view);

  this.recipes.add(view);
  return view;
};

Index.prototype.removeRecipe = function(view) {
  let ol = this.querySelector('section ol');
  ol.removeChild(view);
  this.recipes.delete(view);
};

Index.Recipe = define('index-item', 'li', html`<span><!-- name --></span>`, function() {
  this.onclick = () => this.onClicked();
});

Index.Recipe.prototype.setName = function({ name }) {
  let span = this.querySelector('span');
  span.textContent = name;
  return this;
};

Index.Recipe.prototype.onClicked = function() {
};

export const Recipe = define('recipe-details', 'div', html`
<header>
  <h1>
    <svg viewBox="0 0 24 24"><use href="#edit"></use></svg>
    <span><!-- name --></span>
  </h1>
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
</section>`, function() {
  let buttons = this.querySelectorAll('svg, button');
  buttons[0].onclick = () => this.onEditClicked();
  buttons[1].onclick = () => this.onServingsClicked(-1);
  buttons[2].onclick = () => this.onServingsClicked(+1);

  this.ingredients = new Set();
  this.steps = new Set();
});

Recipe.prototype.setName = function({ name }) {
  let span = this.querySelector('header h1 span');
  span.textContent = name;
  return this;
};

Recipe.prototype.setServings = function({ servings }) {
  let span = this.querySelector('header h2 span');
  span.textContent = `Zutaten für ${servings}`;
  return this;
};

Recipe.prototype.onServingsClicked = function(delta) {
};

Recipe.prototype.addIngredient = function() {
  let ul = this.querySelector('header ul');

  let view = new Recipe.Ingredient();
  ul.appendChild(view);

  this.ingredients.add(view);
  return view;
};

Recipe.prototype.addStep = function() {
  let h2 = this.querySelector('section h2');
  h2.textContent = 'Zubereitung';

  let ol = this.querySelector('section ol');

  let view = new Recipe.Step();
  ol.appendChild(view);

  this.steps.add(view);
  return view;
};

Recipe.Ingredient = define('details-ingredient', 'li', html`<span><!-- (quantity unit) ingredient --></span>`);

Recipe.Ingredient.prototype.setLabel = function({ name, quantity }) {
  let label = quantity + ' ' + name;
  let span = this.querySelector('span');
  span.textContent = label;
  return this;
};

Recipe.Step = define('details-step', 'li', html`
<h3><!-- ingredients --></h3>
<ul><!-- (quantity unit) ingredient --></ul>
<span><!-- step --></span>`, function() {
  this.ingredients = new Set();
});

Recipe.Step.prototype.setText = function({ text, ingredients }) {
  let h3 = this.querySelector('h3');
  h3.textContent = 'Zutaten';
  h3.hidden = ingredients.size == 0;

  let span = this.querySelector('span');
  span.textContent = text;
  return this;
};

Recipe.Step.prototype.addIngredient = function() {
  let ul = this.querySelector('ul');

  let view = new Recipe.Ingredient();
  ul.appendChild(view);

  this.ingredients.add(view);
  return view;
};

export const Form = define('recipe-form', 'div', html`
<header>
  <h1>
    <svg viewBox="0 0 24 24"><use href="#delete"></use></svg>
    <a><svg viewBox="0 0 24 24"><use href="#export"></use></svg></a>
    <svg viewBox="0 0 24 24"><use href="#done"></use></svg>
    <span><!-- title --></span>
  </h1>
  <!-- name + servings -->
  <fieldset name="label">
    <legend>Bezeichnung</legend>
    <input type="text">
  </fieldset>
  <fieldset name="servings">
    <legend>Mengenangabe</legend>
    <input type="text">
    <select>
      <option>Stück</option>
      <option>Personen</option>
      <option value="other">andere...</option>
    </select>
  </fieldset>
</header>
<section>
  <ol><!-- steps + ingredients --></ol>
  <svg viewBox="0 0 24 24"><use href="#create"></use></svg>
</section>`, function() {
  let buttons = this.querySelectorAll('svg');
  buttons[0].onclick = () => this.onDeleteClicked();
  buttons[1].onclick = () => this.onExportClicked();
  buttons[2].onclick = () => this.onDoneClicked();
  buttons[3].onclick = () => this.onAddStepClicked();

  let inputs = this.querySelectorAll('fieldset input');
  inputs[0].onchange = ({ target }) => this.onLabelChanged(target.value);
  inputs[1].onchange = ({ target }) => this.onQuantityChanged(target.value);

  let select = this.querySelector('fieldset select');
  select.onchange = ({ target }) => target.value === 'other'
    ? this.onOtherUnitClicked()
    : this.onUnitChanged(target.value);

  this.steps = new Set();
});

Form.prototype.setTitle = function(title) {
  let span = this.querySelector('header h1 span');
  span.textContent = title;
};

Form.prototype.onDoneClicked = function() {
};

Form.prototype.setExportUrl = function(name, url) {
  let a = this.querySelector('header a');
  if (!name || !url) {
    a.removeAttribute('download');
    a.removeAttribute('href');
  } else {
    a.setAttribute("download", name);
    a.setAttribute("href", url);
  }
};

Form.prototype.onExportClicked = function() {
};

Form.prototype.onDeleteClicked = function() {
};

Form.prototype.setLabel = function({ name }) {
  let input = this.querySelector('fieldset[name=label] input');
  input.value = name || '';
};

Form.prototype.onLabelChanged = function(name) {
};

Form.prototype.setServings = function({ servings }) {
  let input = this.querySelector('fieldset[name=servings] input');
  input.value = servings.value || '';

  let select = this.querySelector('fieldset[name=servings] select');

  let byUnit = o => o.textContent === servings.unit;
  let option = Array.from(select.options).find(byUnit);

  if (!option && servings.unit) {
    option = document.createElement('option');
    option.textContent = servings.unit;
    select.prepend(option);
  }

  if (!option) {
    option = select.options[0];
  }

  option.selected = true;
};

Form.prototype.onQuantityChanged = function(quantity) {
};

Form.prototype.onUnitChanged = function(unit) {
};

Form.prototype.onOtherUnitClicked = function() {
};

Form.prototype.promptForUnit = function() {
  // replace this with HTML5 dialog once it's usable
  let unit = prompt('Einheit für Mengenangabe angeben:');
  this.onUnitChanged(unit);
};

Form.prototype.addStep = function() {
  let ol = this.querySelector('section ol');

  let view = new Form.Step();
  ol.appendChild(view);

  let options = { behavior: 'smooth' };
  let scroll = () => view.scrollIntoView(options);
  setTimeout(scroll, 100);

  this.steps.add(view);
  return view;
};

Form.prototype.removeStep = function(view) {
  let ol = this.querySelector('section ol');
  ol.removeChild(view);
  this.steps.delete(view);
};

Form.prototype.onAddStepClicked = function() {
};

Form.Step = define('form-step', 'li', html`
<form><input type="text" placeholder="Zutaten hinzufügen"></form>
<div><textarea rows="1" placeholder="Arbeitsschritte beschreiben"></textarea></div>`, function() {
  let form = this.querySelector('form');
  let input = this.querySelector('form input');
  input.onchange =
  form.onsubmit = submitHandler((value) => this.onIngredientSubmitted(value));

  let textarea = this.querySelector('textarea');
  textarea.onchange = () => this.onStepTextChanged(textarea.value);
  textarea.oninput = () => textarea.parentNode.dataset.value = textarea.value;

  this.ingredients = new Set();
});

Form.Step.prototype.setStepText = function({ text }) {
  let textarea = this.querySelector('textarea');
  textarea.value = text || '';

  let event = new Event('input');
  textarea.dispatchEvent(event);
};

Form.Step.prototype.onStepTextChanged = function(text) {
};

Form.Step.prototype.addIngredient = function() {
  let view = new Form.Step.Ingredient();

  let span = this.querySelector('span:last-of-type');
  if (span) {
    this.insertBefore(view, span.nextSibling);
  } else {
    this.prepend(view);
  }

  this.ingredients.add(view);
  return view;
};

Form.Step.prototype.removeIngredient = function(view) {
  this.removeChild(view);
  this.ingredients.delete(view);
};

Form.Step.prototype.onIngredientSubmitted = function(ingredient) {
};

Form.Step.Ingredient = define('form-ingredient', 'span', html``, function() {
  this.onclick = () => this.onClicked();
});

Form.Step.Ingredient.prototype.onClicked = function() {
};

Form.Step.Ingredient.prototype.setLabel = function({ name, quantity }) {
  let label = quantity + ' ' + name;
  this.textContent = label;
  return this;
};

