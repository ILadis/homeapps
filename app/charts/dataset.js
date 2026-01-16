
export async function* TemperatureTrend(url) {
  let result = await fetch(url);
  let values = await result.json();

  for (let value of values) {
    yield { x: value['timestamp'], y: (value['value'] / 100).toFixed(2) };
  }
}

export async function TemperatureValue(url) {
  let result = await fetch(url);
  let values = await result.json();

  let temperature = (values[0]['value'] / 100).toFixed(2);
  return [temperature, 26 - temperature];
}

export async function HumidityValue(url) {
  let result = await fetch(url);
  let values = await result.json();

  let humidity = (values[0]['value'] / 100).toFixed(0);
  return [humidity, 100 - humidity];
}

export async function HttpStatusCodes(url) {
  let result = await fetch(url);
  let values = await result.json();

  let labels = new Array();
  let data = new Object();

  for (let hours = 0; hours < 24; hours++) {
    let label = 'ab ' + hours + ' Uhr';
    labels.push(label);
  }

  for (let value of values) {
    let status = value['status'];
    let date = new Date(value['timestamp']);

    if (status in data == false) {
      data[status] = new Array();
      for (let hours = 0; hours < 24; hours++) {
        data[status].push(0);
      }
    }

    let hour = date.getHours();
    data[status][hour]++;
  }

  return [labels, data];
}

export async function HttpUserAgents(url, top) {
  let result = await fetch(url);
  let values = await result.json();

  let labels, data = new Object();
  let pattern = new RegExp('(?<name>[^/ ]+)/(?<version>[0-9.]+)', 'g');

  for (let value of values) {
    let agents = value['user_agent'].matchAll(pattern);

    for (let agent of agents) {
      let label = agent.groups['name'];
      if (label in data == false) {
        data[label] = 0;
      }
      data[label]++;
    }
  }

  labels = Object.keys(data).sort((i, j) => data[j] - data[i]).splice(0, top);
  values = labels.map(label => data[label]);

  return [labels, values];
}
