
import { html, define } from './dom.js';

export const Shell = define('app-shell', 'div', html`
<div is="server-info"></div>
<div is="client-list"></div>`, function() {
  this.serverInfo = this.querySelector('[is=server-info]');
  this.clientList = this.querySelector('[is=client-list]');
});

export const ServerInfo = define('server-info', 'div', html`
<svg viewBox="0 0 256 256" class="vacuum">
  <defs>
    <clipPath id="shape">
      <path id="test" d="M 152 0 C 132 50 128 104 128 104 128 104 128 126 128 126 126 143 133 189 133 189 71 187 67 134 67 134 67 134 68 104 68 104 68 104 72 26 93 0 93 0 152 0 152 0 Z"></path>
    </clipPath>
    <filter id="shadow">
      <feDropShadow dx="2" dy="2" stdDeviation="3" flood-color="#2389b9" flood-opacity="1"></feDropShadow>
    </filter>
  </defs>
  <linearGradient id="gradient1" x1="0" x2="0" y1="0" y2="1">
    <stop offset="0%" stop-color="#2b3c6b"></stop>
    <stop offset="100%" stop-color="#4863b1"></stop>
  </linearGradient>
  <circle cx="128" cy="128" r="117" fill="url(#gradient1)"></circle>
  <linearGradient id="gradient2" x1="0" x2="0" y1="0" y2="1">
    <stop offset="0%" stop-color="#26355e"></stop>
    <stop offset="100%" stop-color="#384e8a"></stop>
  </linearGradient>
  <circle cx="128" cy="128" r="110" fill="url(#gradient2)"></circle>
  <circle cx="128" cy="128" r="88" fill="#4dcaed"></circle>
  <linearGradient id="gradient3" x1="0" x2="0" y1="0" y2="1">
    <stop offset="0%" stop-color="#177b9f"></stop>
    <stop offset="100%" stop-color="#22b2e7"></stop>
  </linearGradient>
  <circle cx="128" cy="128" r="81" fill="url(#gradient3)"></circle>
  <circle cx="128" cy="128" r="63" fill="#2389b9"></circle>
  <circle cx="128" cy="128" r="61" fill="#b7bdd2"></circle>
  <g clip-path="url(#shape)" filter="url(#shadow)">
    <circle cx="128" cy="128" r="110" fill="#4dcaed"></circle>
    <circle cx="128" cy="128" r="103" fill="#187ea3"></circle>
    <circle cx="128" cy="128" r="95" fill="#b7bdd2"></circle>
    <circle cx="128" cy="128" r="88" fill="#9aa7c9"></circle>
  </g>
</svg>
<dl></dl>`);

ServerInfo.prototype.add = function(key, value) {
  let dt = document.createElement('dt');
  dt.textContent = key;

  let dd = document.createElement('dd');
  dd.textContent = value;

  let dl = this.querySelector('dl');
  dl.appendChild(dt);
  dl.appendChild(dd);
};

export const ClientList = define('client-list', 'div', html`
<h1>Online</h1>
<ul></ul>`);

ClientList.prototype.add = function(nickname) {
  let li = document.createElement('li');
  li.textContent = nickname;

  let ul = this.querySelector('ul');
  ul.appendChild(li);
};

