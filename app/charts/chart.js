
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
  let items = new Array();

  this.data.datasets.push({
    label, data: items,
    backgroundColor: '#00afd7',
    borderColor: '#00afd7',
    fill: { target: 'origin', above: '#00b0d733' },
    cubicInterpolationMode: 'monotone',
  });

  for await (let item of dataset(...options)) {
    items.push(item);
  }

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
  let items = new Array();

  this.data.labels = [];
  this.data.datasets.push({
    label, data: items,
    backgroundColor: ['#00afd7', '#eeeeee'],
  });

  let values = await dataset(...options);
  items.push(...values);

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

export const Datasets = {
  TemperatureTrend: async function*(url) {
    let data = await fetch(url);
    let values = await data.json();

    for (let value of values) {
      yield { x: value['timestamp'], y: (value['value'] / 100).toFixed(2) };
    }
  },

  TemperatureValue: async function(url) {
    let data = await fetch(url);
    let values = await data.json();

    let temperature = (values[0]['value'] / 100).toFixed(2);
    return [temperature, 26 - temperature];
  },

  HumidityValue: async function(url) {
    let data = await fetch(url);
    let values = await data.json();

    let humidity = (values[0]['value'] / 100).toFixed(0);
    return [humidity, 100 - humidity];
  },
};
