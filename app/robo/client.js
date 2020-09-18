
export function Client() {
}

Client.prototype.clean = async function(rooms) {
  let body = JSON.stringify(rooms);
  let request = new Request(`./api/vacuum/clean`, {
    method: 'POST', body
  });

  let response = await fetch(request);
  if (!response.ok) {
    throw new Error('failed to send command');
  }
};

Client.prototype.pause = async function() {
  let request = new Request(`./api/vacuum/pause`, {
    method: 'POST'
  });

  let response = await fetch(request);
  if (!response.ok) {
    throw new Error('failed to send command');
  }
};

Client.prototype.resume = async function() {
  let request = new Request(`./api/vacuum/resume`, {
    method: 'POST'
  });

  let response = await fetch(request);
  if (!response.ok) {
    throw new Error('failed to send command');
  }
};

Client.prototype.charge = async function() {
  let request = new Request(`./api/vacuum/charge`, {
    method: 'POST'
  });

  let response = await fetch(request);
  if (!response.ok) {
    throw new Error('failed to send command');
  }
};

Client.prototype.status = async function() {
  let request = new Request(`./api/vacuum/status`, {
    method: 'GET'
  });

  let response = await fetch(request);
  if (!response.ok) {
    throw new Error('failed to send command');
  }

  let status = await response.json();
  return status;
};

