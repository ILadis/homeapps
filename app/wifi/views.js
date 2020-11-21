
import { html, define } from './dom.js';

export const Shell = define('app-shell', 'div', html`
<div is="top-bar"></div>`, function() {
  this.topBar = this.querySelector('[is=top-bar]');
});

export const Bar = define('top-bar', 'div', html`
<input type="checkbox" id="wifi-toggle">
<label for="wifi-toggle" class="toggle"></label>
<h1>Gäste WLAN</h1>
<svg viewBox="0 0 40 40" class="ripple">
  <circle cx="20" cy="20" r="20"></circle>
  <circle cx="20" cy="20" r="16"></circle>
  <circle cx="20" cy="20" r="12"></circle>
</svg>
<svg viewBox="0 0 24 24" class="wifi">
  <use href="#wifi"></use>
</svg>
<dl></dl>`, function() {
  let input = this.querySelector('input');
  input.onclick = () => this.onToggleClicked(input.checked);
});

Bar.prototype.onToggleClicked = function(enabled) {
};

Bar.prototype.setToggle = function(enabled) {
  let input = this.querySelector('input');
  input.checked = enabled;
};

Bar.prototype.addStatus = function(key) {
  let dd = document.createElement('dd');
  let dt = document.createElement('dt');
  dt.textContent = key;

  let dl = this.querySelector('dl');
  dl.appendChild(dt);
  dl.appendChild(dd);

  return { set: (value) => dd.textContent = value };
};

