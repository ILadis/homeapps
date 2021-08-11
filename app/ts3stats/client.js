
export function Client() {
}

Client.fetch = async function(url) {
  let request = new Request(url, { method: 'GET' });
  let response = await fetch(request);

  if (!response.ok) {
    throw response;
  }

  return await response.json();
}

Client.prototype.serverInfo = function() {
//return { 'name': 'TeamSpeak ]I[ Server', 'version': '3.13.6 [Build: 1623234157]', 'clients':5, 'uptime':2226255 };
  return Client.fetch('./api/ts3/info');
};

Client.prototype.listClients = async function() {
//return ['User 1', 'User 2', 'User 3', 'User 4'];
  return Client.fetch('./api/ts3/clients');
};

