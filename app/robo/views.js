
import { html, define } from './dom.js';

export const Shell = define('app-shell', 'div', html`
<div is="top-bar"></div>
<div is="bottom-sheet"></div>
<div is="clean-select"></div>`, function() {
  this.topBar = this.querySelector('[is=top-bar]');
  this.bottomSheet = this.querySelector('[is=bottom-sheet]');
  this.zoneSelect = this.querySelector('[is=clean-select]');
});

export const RippleButton = define('ripple-button', 'button', html``, function() {
  this.addEventListener('click', (event) => this.createRipple(event));
});

RippleButton.prototype.createRipple = function(event) {
  let rect = this.getBoundingClientRect();

  let diameter = Math.max(rect.width, rect.height);
  let radius = diameter / 2;

  let left = event.clientX - rect.left - radius;
  let top = event.clientY - rect.top - radius;

  var span = this.querySelector('.ripple');
  if (span) {
    span.remove();
  }

  var span = document.createElement('span');
  span.style.width =
  span.style.height = diameter + 'px';
  span.style.left = left + 'px';
  span.style.top = top + 'px';
  span.className = 'ripple';

  span.onanimationend = () => span.remove();

  this.appendChild(span);
};

export const Bar = define('top-bar', 'div', html`
<h1>Roborock</h1>
<svg viewBox="0 0 120 120" class="vacuum">
  <defs>
    <filter id="shadow">
      <feDropShadow dx="0" dy="0" stdDeviation="3" flood-color="#3e3e3e" flood-opacity="0.4"></feDropShadow>
    </filter>
  </defs>
  <circle cx="60" cy="60" r="50" filter="url(#shadow)"></circle>
  <circle cx="60" cy="60" r="46"></circle>
  <line x1="50" y1="23" x2="70" y2="23" stroke-width="2"></line>
  <line x1="15" y1="50" x2="105" y2="50" stroke-width="3"></line>
  <circle cx="60" cy="50" r="15"></circle>
  <circle cx="60" cy="50" r="12"></circle>
</svg>
<svg viewBox="0 0 60 60" class="brush">
  <line x1="30" y1="30" x2="58" y2="20" stroke-width="3"></line>
  <line x1="30" y1="30" x2="47" y2="54" stroke-width="3"></line>
  <line x1="30" y1="30" x2="12" y2="54" stroke-width="3"></line>
  <line x1="30" y1="30" x2="0" y2="20" stroke-width="3"></line>
  <line x1="30" y1="30" x2="30" y2="0" stroke-width="3"></line>
</svg>
<dl></dl>`);

Bar.prototype.enableBrush = function(enable) {
  let svg = this.querySelector('.brush');

  if (!enable) {
    svg.classList.remove('spin');
  } else {
    svg.classList.add('spin');
  }
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

export const CleanSelect = define('clean-select', 'div', html`
<form>
  <h2></h2>
  <div></div>
  <div>
    <button is="ripple-button">Reinigung starten</button>
  </div>
</form>`, function() {
  let form = this.querySelector('form');
  form.onsubmit = (event) => {
    event.preventDefault();

    let data = new FormData(form);
    let values = Array.from(data.values());

    if (values.length) {
      this.onSubmitted(values);
    }
  };
});

CleanSelect.prototype.onSubmitted = function(values) {
};

CleanSelect.prototype.setTitle = function(title) {
  let h2 = this.querySelector('h2');
  h2.textContent = title;
};

CleanSelect.prototype.addOption = function(key, name, value) {
  let input = document.createElement('input');
  input.id =  key;
  input.name = key;
  input.value = value;
  input.type = 'checkbox';
  input.className = 'chip';

  let label = document.createElement('label');
  label.setAttribute('for', key);
  label.textContent = name;

  let div = this.querySelector('div');
  div.appendChild(input);
  div.appendChild(label);
};

export const Sheet = define('bottom-sheet', 'div', html``);

Sheet.prototype.addButton = function() {
  let view = new SheetButton();
  this.appendChild(view);
  return view;
};

export const SheetButton = define('sheet-button', 'button', html`
<svg viewBox="0 0 24 24"><use></use></svg>
<span></span>`, function() {
  this.onclick = () => this.onClicked();
});

SheetButton.prototype.onClicked = function() {
};

SheetButton.prototype.setLabel = function(label) {
  let span = this.querySelector('span');
  span.textContent = label
  return this;
};

SheetButton.prototype.setIcon = function(icon) {
  let use = this.querySelector('use');
  use.setAttribute('href', '#' + icon);
  return this;
};

SheetButton.prototype.setEnabled = function(enabled) {
  this.disabled = !enabled;
  return this;
};

