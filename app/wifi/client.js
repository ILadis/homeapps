
export function Client() {
}

Client.prototype.enable = async function() {
  let request = new Request(`./api/wifi/enable`, {
    method: 'POST'
  });

  let response = await fetch(request);
  if (!response.ok) {
    throw new Error('failed to enable wifi');
  }
};

Client.prototype.disable = async function() {
  let request = new Request(`./api/wifi/disable`, {
    method: 'POST'
  });

  let response = await fetch(request);
  if (!response.ok) {
    throw new Error('failed to disable wifi');
  }
};

Client.prototype.status = async function() {
  let request = new Request(`./api/wifi/status`, {
    method: 'GET'
  });

  let response = await fetch(request);
  if (!response.ok) {
    throw new Error('failed to query wifi status');
  }

  let status = await response.json();
  return status;
};

Client.prototype.stations = async function() {
  let request = new Request(`./api/wifi/stations`, {
    method: 'GET'
  });

  let response = await fetch(request);
  if (!response.ok) {
    throw new Error('failed to query wifi stations');
  }

  let status = await response.json();
  return status;
};
