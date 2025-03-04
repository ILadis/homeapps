
export function Client() {
}

Client.prototype.serverInfo = function() {
  return get('./api/ts3/info');
};

Client.prototype.listClients = async function() {
  return get('./api/ts3/clients');
};

async function get(url) {
  let request = new Request(url, { method: 'GET' });
  let response = await fetch(request);

  if (!response.ok) {
    throw new Error(`failed to get: ${url}`);
  }

  return await response.json();
}
