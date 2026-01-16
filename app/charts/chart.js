
function define() {
  if (arguments.length == 2) {
    var depends = arguments[0];
    var factory = arguments[1];
  } else {
    var depends = [];
    var factory = arguments[0];
  }

  const module = factory.apply(window, depends.map(name => define.modules[name]));

  for (const name of define.names) {
    define.modules[name] = module;
  }
}

async function require(url, names = [], factory = () => import(url)) {
  try {
    define.amd = true;
    define.names = names;
    define.modules = define.modules || {};

    await factory();
  } finally {
    define.amd = false;
    define.names = [];
  }
}

function declare(name, depends, factory) {
  return require('.', [name], () => define(depends, factory));
}

window.define = define;
window.require = require;

await require('./vendor/chart.js', ['chart.js']);

/* minimum set of helper functions required by zoom plugin, for implementations see:
 * https://github.com/chartjs/Chart.js/tree/master/src/helpers
 */
await declare('chart.js/helpers', [], () => Object.seal({
  // math:
  sign: (value) => Math.sign(value),
  almostEquals: (x, y, epsilon) => Math.abs(x - y) < epsilon,
  // utils:
  getRelativePosition: (event) => ('native' in event) ? event : undefined,
  valueOrDefault: (value, defaultValue) => (typeof value === 'undefined') ? defaultValue : value,
  callback: (handler, args, self) => (typeof handler?.call === 'function') ? handler.apply(self, args) : undefined,

  each: (value, handler, self) => {
    const entries = Object.entries(value);
    entries.forEach(([_, value], index) => handler.call(self, value, index));
  }
}));

/* for available date adapters see:
 * https://github.com/chartjs/awesome?tab=readme-ov-file#adapters
 */
await require('./vendor/moment.js', ['moment']);
await require('./vendor/chartjs-adapter-moment.js');

await require('./vendor/hammer.js', ['hammerjs']);
await require('./vendor/chartjs-plugin-zoom.js');

const Chart = define.modules['chart.js'];
const { define: element, html } = await import('./dom.js');

const Colors = {
  'River':     ['#5DADE2', '#AED6F1'],
  'Sunflower': ['#F4D03F', '#F9E79F'],
  'Emerald':   ['#58D68D', '#ABEBC6'],
  'Alizarin':  ['#EC7063', '#F5B7B1'],
  'Wisteria':  ['#A569BD', '#D2B4DE'],
  'Carrot':    ['#EB984E', '#F5CBA7'],
  'Asphalt':   ['#5D6D7E', '#AEB6BF'],
  'Grey':      ['#eeeeee'],
};

Colors.primary = function(kind) {
  let names = Object.keys(this);

  switch (typeof kind) {
    case 'string': return this[kind]?.[0];
    case 'number': return this[names[kind % names.length]][0];
    case 'undefined': return names.map(name => this[name][0]);
  }
};

Colors.secondary = function(name) {
  return this[name]?.[1];
};

export const Timechart = element('chart-time', 'div', html`
<canvas>
  <!-- where the chart is drawn -->
</canvas>`, function() {
  /* for available zoom plugin options see:
   * https://www.chartjs.org/chartjs-plugin-zoom/latest/guide/options.html
   */
  let zoom = {
    pan: {
      enabled: true,
      mode: 'x'
    },
    zoom: {
      wheel: { enabled: true },
      pinch: { enabled: true },
      mode: 'x',
    },
    limits: {
      x: { min: 'original', max: 'original' },
      y: { min: 'original', max: 'original' },
    }
  };

  /* for available time chart options see:
   * https://www.chartjs.org/docs/latest/axes/cartesian/time.html
   */
  let options = {
    responsive: true,
    maintainAspectRatio: false,
    elements: { point: { pointStyle: false } },
    scales: { x: { type: 'time' }, y: { } },
    plugins: { zoom },
  };

  let canvas = this.querySelector('canvas');
  let chart = new Chart(canvas, { type: 'line', options });

  this.options = options;
  this.data = chart.data;

  this.update = () => chart.update();
  this.destroy = () => chart.destroy();
});

Timechart.prototype.setTitle = function(title) {
  this.options.plugins.title = { text: title, display: !!title };
};

Timechart.prototype.setLabels = function(abscissa, ordinate) {
  this.options.scales.x.title = { text: abscissa, display: !!abscissa };
  this.options.scales.y.title = { text: ordinate, display: !!ordinate };
};

Timechart.prototype.setOrdinate = function(label, formatter) {
  this.options.scales.y.title = { text: label, display: !!label };
  this.options.scales.y.ticks = { callback: formatter };
};

Timechart.prototype.showLegends = function(show, alignment = 'top') {
  this.options.plugins.legend = { display: show, position: alignment };
};

Timechart.prototype.showTooltips = function(show) {
  this.options.plugins.tooltip = { enabled: show };
};

Timechart.prototype.timeSpan = function(span) {
  this.options.scales.x.time = {
    'days': { unit: 'day', displayFormats: { day: 'DD. MMM' }, tooltipFormat: 'DD.MM.YYYY HH:mm:ss' },
  }[span];
}

Timechart.prototype.addDataset = async function(label, dataset, ...options) {
  let data = new Array();

  this.data.datasets.push({
    label, data,
    backgroundColor: Colors.primary('River'),
    borderColor: Colors.primary('River'),
    fill: { target: 'origin', above: Colors.secondary('River') },
    cubicInterpolationMode: 'monotone',
  });

  for await (let value of dataset(...options)) {
    data.push(value);
  }

  this.update();
};

export const Barchart = element('chart-bar', 'div', html`
<canvas>
  <!-- where the chart is drawn -->
</canvas>`, function() {
  let options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: { x: { stacked: true }, y: { stacked: true } },
  };

  let canvas = this.querySelector('canvas');
  let chart = new Chart(canvas, { type: 'bar', options });

  this.options = options;
  this.data = chart.data;

  this.update = () => chart.update();
  this.destroy = () => chart.destroy();
});

Barchart.prototype.setTitle = function(title) {
  this.options.plugins.title = { text: title, display: !!title };
};

Barchart.prototype.showLegends = function(show, alignment = 'top') {
  this.options.plugins.legend = { display: show, position: alignment };
};

Barchart.prototype.setDataset = async function(dataset, ...options) {
  let [labels, values] = await dataset(...options);

  while (this.data.datasets.pop());

  for (let label in values) {
    this.data.labels = labels;
    this.data.datasets.push({
      label, data: values[label],
      backgroundColor: Colors.primary(this.data.datasets.length),
      borderColor: Colors.primary(this.data.datasets.length),
    });
  }

  this.update();
};

export const Piechart = element('chart-pie', 'div', html`
<canvas>
  <!-- where the chart is drawn -->
</canvas>`, function() {
  let options = {
    responsive: true,
    maintainAspectRatio: false,
  };

  let canvas = this.querySelector('canvas');
  let chart = new Chart(canvas, { type: 'doughnut', options });

  this.options = options;
  this.data = chart.data;

  this.update = () => chart.update();
  this.destroy = () => chart.destroy();
});

Piechart.prototype.setTitle = function(title) {
  this.options.plugins.title = { text: title, display: !!title };
};

Piechart.prototype.showLegends = function(show, alignment = 'top') {
  this.options.plugins.legend = { display: show, position: alignment };
};

Piechart.prototype.setDataset = async function(dataset, ...options) {
  let [labels, values] = await dataset(...options);

  while (this.data.datasets.pop());

  this.data.labels = labels;
  this.data.datasets.push({
    label: '', data: values,
    backgroundColor: Colors.primary(),
  });

  this.update();
};

export const Gaugechart = element('chart-gauge', 'div', html`
<canvas>
  <!-- where the chart is drawn -->
</canvas>`, function() {
  let options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '80%',
    spacing: 3,
    rotation: 220,
    circumference: 280,
  };

  let canvas = this.querySelector('canvas');
  let chart = new Chart(canvas, { type: 'doughnut', options });

  this.options = options;
  this.data = chart.data;

  this.update = () => chart.update();
  this.destroy = () => chart.destroy();
});

Gaugechart.prototype.addDataset = async function(label, dataset, ...options) {
  let data = new Array();

  this.data.labels = [];
  this.data.datasets.push({
    label, data,
    backgroundColor: [
      Colors.primary('River'),
      Colors.primary('Grey')
    ],
  });

  let values = await dataset(...options);
  data.push(...values);

  this.options.plugins.title = { text: label, display: true };
  this.options.plugins.tooltip = { enabled: false };

  this.options.plugins.subtitle = {
    text: values[0].toString(),
    font: { size: 18 },
    position: 'bottom',
    display: true,
  };

  this.update();
};
