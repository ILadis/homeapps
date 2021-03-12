
export function Client() {
}

Client.prototype.segmentClean = async function(segments) {
  let body = JSON.stringify(segments);
  let request = new Request(`./api/vacuum/clean/segment`, {
    method: 'POST', body
  });

  await exchange(request);
};

Client.prototype.zoneClean = async function(zones) {
  let body = JSON.stringify(zones);
  let request = new Request(`./api/vacuum/clean/zone`, {
    method: 'POST', body
  });

  await exchange(request);
};

Client.prototype.pause = async function() {
  let request = new Request(`./api/vacuum/pause`, {
    method: 'POST'
  });

  await exchange(request);
};

Client.prototype.resume = async function() {
  let request = new Request(`./api/vacuum/resume`, {
    method: 'POST'
  });

  await exchange(request);
};

Client.prototype.charge = async function() {
  let request = new Request(`./api/vacuum/charge`, {
    method: 'POST'
  });

  await exchange(request);
};

Client.prototype.status = async function() {
  let request = new Request(`./api/vacuum/status`, {
    method: 'GET'
  });

  let response = await exchange(request);

  let status = await response.json();
  return status;
};

async function exchange(request) {
  let response = await fetch(request);
  if (!response.ok) {
    throw new Error('failed to send command');
  }
  return response;
}
