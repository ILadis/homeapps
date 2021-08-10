
import { html, define } from './dom.js';

export const Shell = define('app-shell', 'div', html`
<ul></ul>`);

Shell.prototype.addClient = function(nickname) {
  let li = document.createElement('li');
  li.textContent = nickname;

  let ul = this.querySelector('ul');
  ul.appendChild(li);
};

