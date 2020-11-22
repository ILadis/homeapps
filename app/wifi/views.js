
import { html, define } from './dom.js';

export const Shell = define('app-shell', 'div', html`
<div is="top-bar"></div>`, function() {
  this.topBar = this.querySelector('[is=top-bar]');
});

export const Bar = define('top-bar', 'div', html`
<header>
  <svg viewBox="0 0 24 24" class="wifi">
    <use href="#wifi"></use>
  </svg>
  <h1>Gäste WLAN</h1>
  <input type="checkbox" id="wifi-toggle">
  <label for="wifi-toggle" class="toggle"></label>
</header>
<figure>
  <img src="app/qrcode.png">
</figure>
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

