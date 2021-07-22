
import { html, define } from './dom.js';

export const Shell = define('app-shell', 'div', html`
<div is="pages-clock"></div>
<div is="pages-search"></div>
<div is="pages-list"></div>`, function() {
  this.clock = this.querySelector('[is=pages-clock]');
  this.search = this.querySelector('[is=pages-search]');
  this.list = this.querySelector('[is=pages-list]');
});

export const Clock = define('pages-clock', 'div', html`
<h1><!-- time --></h1>
<h2><!-- date --></h2>`);

Clock.timeFormat = new Intl.DateTimeFormat('de', { hour: '2-digit', minute: '2-digit', hour12: false });
Clock.dateFormat = new Intl.DateTimeFormat('de', { weekday: 'long', month: 'long', day: 'numeric' });

Clock.prototype.setTime = function(date) {
  let h1 = this.querySelector('h1');
  h1.textContent = Clock.timeFormat.format(date);
};

Clock.prototype.setDate = function(date) {
  let h2 = this.querySelector('h2');
  h2.textContent = Clock.dateFormat.format(date);
};

export const Search = define('pages-search', 'div', html`
<form>
  <input type="text" placeholder="Suchen oder hinzufügen">
</form>`, function() {
  let input = this.querySelector('input');
  input.oninput = () => this.onChanged(input.value);

  let form = this.querySelector('form');
  form.onsubmit = (event) => (event.preventDefault(), this.onSubmitted(input.value));
});

Search.prototype.onChanged = function(value) {
};

Search.prototype.onSubmitted = function(value) {
};

Search.prototype.clearValues = function() {
  let form = this.querySelector('form');
  form.reset();
};

export const List = define('pages-list', 'div', html`
<ul></ul>`);

function toHostname(url) {
  return new URL(url).hostname;
}

List.prototype.addItem = function({ title, url }) {
  let span = document.createElement('span');
  span.textContent = title;

  let a = document.createElement('a');
  a.href = url;
  a.textContent = toHostname(url);

  let li = document.createElement('li');
  li.appendChild(span);
  li.appendChild(a);

  let ul = this.querySelector('ul');
  ul.appendChild(li);
};

List.prototype.clearItems = function() {
  let ul = this.querySelector('ul');
  while (ul.firstChild) {
    ul.firstChild.remove();
  }
};

