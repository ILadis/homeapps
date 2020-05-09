
import { html, define, normalize } from './dom.js';

const DateFormat = new Intl.DateTimeFormat('de-DE', {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric'
});

const TimeFormat = new Intl.DateTimeFormat('de-DE', {
  hour: 'numeric',
  minute: 'numeric'
});

export const DashboardGrid = define('dashboard-grid', 'main', html`
<template id="panel">
  <div><h1></h1></div>
</template>`);

DashboardGrid.prototype.addPanel = function(headline, panel) {
  let template = this.querySelector('#panel');
  let node = normalize(template.content.cloneNode(true));

  let h1 = node.querySelector('h1');
  h1.textContent = headline;

  let div = node.querySelector('div');
  div.appendChild(panel);

  this.appendChild(node);
};

export const ListPanel = define('list-panel', 'ul', html`
<template id="link">
  <li>
    <svg viewBox="0 0 24 24"><use></use></svg>
    <a></a>
  </li>
</template>
<template id="item">
  <li>
    <svg viewBox="0 0 24 24"><use></use></svg>
    <span></span>
  </li>
</template>`);

// TODO use this
ListPanel.icons = new Map([
  ['geo', 'place'],
  ['tel', 'phone'],
  ['http', 'website']
]);

ListPanel.prototype.addLink = function(label, url, icon) {
  let template = this.querySelector('#link');
  let node = normalize(template.content.cloneNode(true));

  let a = node.querySelector('a');
  a.setAttribute('href', url);
  a.textContent = label;

  this.setIcon(node, icon);
  this.appendChild(node);
};

ListPanel.prototype.addItem = function(label, icon) {
  let template = this.querySelector('#item');
  let node = normalize(template.content.cloneNode(true));

  let span = node.querySelector('span');
  span.textContent = label;

  this.setIcon(node, icon);
  this.appendChild(node);
};

ListPanel.prototype.setIcon = function(node, icon) {
  let use = node.querySelector('use');
  use.setAttribute('href', `#${icon}`);
};

export const VacuumPanel = define('vacuum-panel', 'div', html`
<section>
  <h2>Status</h2>
  <p name="state">...</p>
  <h2>Ladezustand</h2>
  <p name="battery-level">...</p>
  <h2>Letzte Reinigung</h2>
  <p name="last-clean">...</p>
</section>
<hr>
<section>
  <button>reinigen</button>
  <button>aufladen</button>
</section>`, function() {
  let buttons = this.querySelectorAll('button');
  buttons[0].onclick = () => this.onCleanClicked();
  buttons[1].onclick = () => this.onChargeClicked();
});

VacuumPanel.prototype.setState = async function(state) {
  const node = this.querySelector('[name=state]');
  for await (const value of state) {
    node.textContent = value;
  }
};

VacuumPanel.prototype.setBatteryLevel = async function(battery) {
  const node = this.querySelector('[name=battery-level]');
  for await (const value of battery) {
    node.textContent = `${value} / 100`;
  }
};

VacuumPanel.prototype.setLastClean = async function(date) {
  const node = this.querySelector('[name=last-clean]');
  const isValid = (d) => d instanceof Date && !isNaN(d);

  for await (var value of date) {
    if (!isValid(value)) {
      var value = 'unbekannt';
    } else {
      const date = DateFormat.format(value);
      const time = TimeFormat.format(value);
      var value = `zuletzt am ${date} gegen ${time} Uhr`;
    }

    node.textContent = value;
  }
};

