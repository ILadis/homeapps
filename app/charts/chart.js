
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

async function require(url, names = []) {
  try {
    define.amd = true;
    define.names = names;
    define.modules = define.modules || {};

    await import(url);
  } finally {
    define.amd = false;
    define.names = [];
  }
}

window.define = define;

await require('./vendor/chart.js', ['chart.js']);

/* for available date adapters see:
 * https://github.com/chartjs/awesome?tab=readme-ov-file#adapters
 */
await require('./vendor/moment.js', ['moment']);
await require('./vendor/chartjs-adapter-moment.js');

const Chart = define.modules['chart.js'];
const { define: element, html } = await import('./dom.js');

export const Timechart = element('chart-time', 'div', html`
<canvas>
  <!-- where the chart is drawn -->
</canvas>`, function() {
  /* for available time chart options see:
   * https://www.chartjs.org/docs/latest/axes/cartesian/time.html
   */

  let options = {
    responsive: true,
    maintainAspectRatio: false,
    elements: { point: { pointStyle: false } },
    scales: { x: { type: 'time' }, y: { } },
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

