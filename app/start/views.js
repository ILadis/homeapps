
import { html, define } from './dom.js';

export const Shell = define('app-shell', 'div', html`
<div is="pages-clock"></div>
<div is="pages-form"></div>
<div is="pages-list"></div>`, function() {
  this.clock = this.querySelector('[is=pages-clock]');
  this.form = this.querySelector('[is=pages-form]');
  this.list = this.querySelector('[is=pages-list]');
});

export const Clock = define('pages-clock', 'div', html`
<h1><!-- time --></h1>
<h2><!-- date --></h2>`);

Clock.timeFormat = new Intl.DateTimeFormat('de', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false
});

Clock.dateFormat = new Intl.DateTimeFormat('de', {
  weekday: 'long',
  month: 'long',
  day: 'numeric'
});

Clock.prototype.setTime = function(date) {
  let h1 = this.querySelector('h1');
  h1.textContent = Clock.timeFormat.format(date);
};

Clock.prototype.setDate = function(date) {
  let h2 = this.querySelector('h2');
  h2.textContent = Clock.dateFormat.format(date);
};

export const Form = define('pages-form', 'div', html`
<form>
  <input type="text" placeholder="Seite hinzufügen" class="url">
  <input type="text" placeholder="Tag hinzufügen"  class="tag">
  <input type="submit" hidden>
</form>`, function() {
  let inputs = this.querySelectorAll('input[type=text]');
  inputs[0].oninput = () => this.onChanged();

  let form = this.querySelector('form');
  form.onsubmit = (event) => (event.preventDefault(), inputs[1].value
      ? this.addTag(inputs[1].value, true)
      : this.onSubmitted());

  this.tags = new Set();
  Object.defineProperty(this, 'url', { get: () => inputs[0].value });
});

Form.prototype.onChanged = function() {
};

Form.prototype.onSubmitted = function() {
};

Form.prototype.addTag = function(tag, isChecked = false) {
  let inputs = this.querySelectorAll('input[type=text]');
  let input = document.getElementById(tag);

  if (input) return false;

  input = document.createElement('input');
  input.type = 'checkbox';
  input.checked = isChecked;
  input.id = tag;

  input.onchange = () => (input.checked
    ? this.tags.add(tag)
    : this.tags.delete(tag),
      this.onChanged());

  let label = document.createElement('label');
  label.setAttribute('for', tag);
  label.textContent = tag;

  inputs[1].parentNode.insertBefore(input, inputs[1]);
  inputs[1].parentNode.insertBefore(label, inputs[1]);
  inputs[1].value = '';

  if (isChecked) {
    this.tags.add(tag);
    this.onChanged();
  }
};

Form.prototype.setTagPattern = function(pattern) {
  let input = this.querySelector('input.tag');
  input.pattern = pattern.source;
};

Form.prototype.clearValues = function() {
  let form = this.querySelector('form');
  form.reset();

  this.tags.clear();
  this.onChanged();
};

export const List = define('pages-list', 'div', html`
<h1>Lesezeichen</h1>
<ul></ul>`, function() {
  this.items = new Set();
});

List.prototype.addItem = function(isNew = false) {
  let view = new Page();
  view.className = isNew ? 'new' : '';

  let ul = this.querySelector('ul');
  ul.prepend(view);

  this.items.add(view);
  return view;
};

List.prototype.removeItem = function(view) {
  let ul = this.querySelector('ul');
  ul.removeChild(view);

  this.items.delete(view);
};

List.prototype.clearItems = function() {
  let ul = this.querySelector('ul');
  while (ul.firstChild) {
    ul.firstChild.remove();
  }
};

export const Page = define('pages-item', 'li', html`
<input type="text">
<a></a>`, function() {
  let input = this.querySelector('input');
  input.onchange = () => this.onEdited(input.value);
});

Page.prototype.onEdited = function(title) {
};

Page.prototype.setTitle = function({ title }) {
  let input = this.querySelector('input');
  input.value = title;
};

Page.prototype.setUrl = function({ url }) {
  let a = this.querySelector('a');
  a.textContent = toHostname(url);
  a.href = url;
};

function toHostname(url) {
  return new URL(url).hostname;
}

