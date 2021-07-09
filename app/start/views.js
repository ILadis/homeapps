
import { html, define } from './dom.js';

export const Shell = define('app-shell', 'div', html`
<div is="pages-form"></div>
<div is="pages-list"></div>
<div is="clean-select"></div>
<div is="clean-select"></div>`, function() {
  this.form = this.querySelector('[is=pages-form]');
  this.list = this.querySelector('[is=pages-list]');
});

export const Form = define('pages-form', 'div', html`
<form>
  <label for="url">Adresse:</label>
  <input type="text" id="url">
  <label for="title">Titel:</label>
  <input type="text" id="title">
  <button type="submit">Hinzufügen</button>
</form>`, function() {
  let inputs = this.querySelectorAll('input');
  inputs[0].onchange = ({ target }) => this.onUrlChanged(target.value);
  inputs[1].onchange = ({ target }) => this.onTitleChanged(target.value);

  let form = this.querySelector('form');
  form.onsubmit = (event) => (event.preventDefault(), this.onSubmitted());
});

Form.prototype.onUrlChanged = function(url) {
};

Form.prototype.onTitleChanged = function(title) {
};

Form.prototype.onSubmitted = function() {
};

Form.prototype.clearValues = function() {
  let form = this.querySelector('form');
  form.reset();
};

export const List = define('pages-list', 'div', html`
<ul></ul>`);

List.prototype.addItem = function({ title, url }) {
  let a = document.createElement('a');
  a.href = url;
  a.textContent = title;

  let li = document.createElement('li');
  li.appendChild(a);

  let ul = this.querySelector('ul');
  ul.appendChild(li);
};

