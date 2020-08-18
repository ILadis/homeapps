
import { html, define } from './dom.js';

export const Shell = define('app-shell', 'div', html`
<div is="top-bar"></div>`, function() {
  this.contents = new Set();
  this.topBar = this.querySelector('[is=top-bar]')
});

Shell.prototype.setTitle = function(title) {
  document.title = title;
};

Shell.prototype.setContent = function(...contents) {
  for (var content of this.contents) {
    content.remove();
  }

  this.contents.clear();
  for (var content of contents) {
    this.appendChild(content);
    this.contents.add(content);
  }
};

export const TopBar = define('top-bar', 'div', html`
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

TopBar.prototype.enableBrush = function(enable) {
  let svg = this.querySelector('.brush');
  svg.classList.add('spin');

  if (!enable) {
    svg.classList.remove('spin');
  }
};

TopBar.prototype.addStatus = function(key) {
  let dt = document.createElement('dt');
  dt.textContent = key;

  let dd = document.createElement('dd');

  let dl = this.querySelector('dl');
  dl.appendChild(dt);
  dl.appendChild(dd);

  return { set: (value) => dd.textContent = value }
}

export const RoomSelect = define('room-select', 'div', html`
<form>
  <h2>Raumwahl</h2>
  <div></div>
  <div>
    <button>Reinigung starten</button>
  </div>
</form>`, function() {
  let form = this.querySelector('form');
  form.onsubmit = (event) => {
    event.preventDefault();
    let data = new FormData(form);
    let values = Array.from(data.values());
    this.onSubmitted(values);
  };
});

RoomSelect.prototype.addRoom = function(key, name, value) {
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

RoomSelect.prototype.onSubmitted = function(rooms) {
};

