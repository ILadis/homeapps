
import { html, define } from './dom.js';

export const Shell = define('app-shell', 'div', html`
<header is="server-info"></header>
<table is="player-list"></table>`, function() {
  this.serverInfo = this.querySelector('[is=server-info]');
  this.playerList = this.querySelector('[is=player-list]');
});

export const ServerInfo = define('server-info', 'header', html`
<svg viewBox="0 0 1639.373 280.629"  class="logo">
  <defs>
    <style>.a{fill:#3d3938;} .b{fill:#d0c5c0;}</style>
  </defs>
  <path d="M1607.741,101.632l29.553-49.007L1620.9,0H494.142l-5.274,38.4L478.426,0H215.833l-9.044,36.157h-21.83l-5.177,20L150.794,0H65.22L0,209.344l51.97,71.284h85.465l10.456-39.55h34.518l23.147,39.55H469.362l6.283-45.87,14.6,45.87h881.366l35.68-73.944h32.267l29.97-58.654,32,132.6h88.725l49.119-71.4ZM846.208,151.295l.109-24.988h75.807l.768,24.988Z"></path>
  <polygon class="a" points="59.37 266.076 16.071 206.686 85.96 206.686 125.597 266.077 59.37 266.076"></polygon>
  <polygon class="a" points="342.207 206.686 272.321 206.686 302.204 266.077 368.431 266.077 342.207 206.686"></polygon>
  <polygon class="a" points="365.503 206.686 390.507 266.077 456.735 266.077 435.389 206.686 365.503 206.686"></polygon>
  <polygon class="a" points="575.162 206.686 589.189 266.077 743.72 266.077 738.23 206.686 575.162 206.686"></polygon>
  <polygon class="a" points="924.595 206.686 920.327 266.077 765.796 266.077 761.525 206.686 924.595 206.686"></polygon>
  <polygon class="a" points="947.89 206.686 1017.774 206.686 1008.63 266.077 942.403 266.077 947.89 206.686"></polygon>
  <polygon class="a" points="1041.071 206.686 1030.706 266.077 1096.933 266.077 1110.957 206.686 1041.071 206.686"></polygon>
  <polygon class="a" points="1134.252 206.686 1119.009 266.076 1185.237 266.077 1204.139 206.686 1134.252 206.686"></polygon>
  <polygon class="a" points="1227.434 206.686 1207.312 266.077 1273.54 266.077 1297.32 206.686 1227.434 206.686"></polygon>
  <polygon class="a" points="1320.615 206.686 1295.616 266.077 1361.843 266.077 1390.503 206.686 1320.615 206.686"></polygon>
  <polygon class="a" points="1553.57 206.686 1516.374 266.077 1582.601 266.077 1623.457 206.686 1553.57 206.686"></polygon>
  <polygon class="a" points="481.98 206.686 500.886 266.077 567.114 266.077 551.866 206.686 481.98 206.686"></polygon>
  <polygon class="a" points="179.141 206.686 249.029 206.686 280.128 266.077 213.9 266.077 179.141 206.686"></polygon>
  <path class="b" d="M199.243,126.307h-22.59l-10.237,39.54H120.542l10.93-39.54h-22.59L85.957,206.685H16.071L75.928,14.553h64.828L130.444,50.71H152.37L142.077,87.945h44.507l9.64-37.235H218.15l9.044-36.157h64.831l-43,192.132H179.141Z"></path>
  <path class="b" d="M313.631,14.553h64.828L342.207,206.685H272.321Z"/><path class="b" d="M594.552,14.553H745.818L744.39,50.71H656.683l-2.777,37.235h89.013L741.4,126.307h-90.36l-2.95,39.54h91.749l-1.613,40.838H575.161Z"></path>
  <path class="b" d="M767.427,14.553H918.692L919.8,50.71H832.1l-.5,115.137h91.747l1.254,40.838H761.525Z"></path>
  <path class="b" d="M1035.075,126.307h-22.591l5.29,80.378H947.89L940.3,14.552h151.265l7.407,73.392H1076.72l1.755,19.037h22.42l10.062,99.7h-69.886Zm-27.566-75.6,2.45,37.235h22.255l-2.778-37.235Z"></path>
  <path class="b" d="M1286.051,14.553h151.265l8.726,36.157h-87.707l7.679,37.235h89.014l9.258,38.362h-90.36l16.577,80.378h-69.888Z"></path>
  <path class="b" d="M1511.822,50.71h-43.853l-9.044-36.157H1610.19l11.265,36.157H1577.6l45.856,155.975h-69.887Z"></path>
  <path class="b" d="M490.245,145.926H467.482l5.64-38.944H450.7l-15.312,99.7H365.5L400.068,14.553H464.9L459.343,50.71H481.27l-5.392,37.235h22.254l9.983-73.392h64.828L551.866,206.685H481.98Z"></path>
  <path class="b" d="M1264.441,14.553H1113.176l21.077,192.132h69.886l-8.265-60.759h22.763l8.8,60.759h69.886ZM1213.49,84.8H1224.6l5.278,35.033h-15.022L1213,106.982h-22.42l1.747,12.851H1177.3l-4.56-35.033h11.113l-1.263-9.389h-25.834l-3.072-24.7h29.236l2.937,21.587h22.116l-3.126-21.587h29.235l3.866,24.7h-25.834Z"></path>
</svg>
<table></table>`);

ServerInfo.prototype.add = function(key, value) {
  let th = document.createElement('th');
  th.textContent = key;

  let td = document.createElement('td');
  td.textContent = value;

  let tr = document.createElement('tr');
  tr.appendChild(th);
  tr.appendChild(td);

  let table = this.querySelector('table');
  table.appendChild(tr);
};

export const PlayerList = define('player-list', 'table', html`
<thead>
  <tr><th></th></tr>
</thead>
<tbody></tbody>`);

PlayerList.prototype.online = function(online) {
  let th = this.querySelector('thead th');
  th.textContent = online ? 'Online' : 'Offline';
};

PlayerList.prototype.set = function(players) {
  let tbody = this.querySelector('tbody');

  while (tbody.firstChild) {
    tbody.removeChild(tbody.firstChild);
  }

  for (let player of players) {
    let td = document.createElement('td');
    td.textContent = player;

    let tr = document.createElement('tr');
    tr.appendChild(td);

    tbody.appendChild(tr);
  }
};
