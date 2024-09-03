
export function Client() {
}

Client.prototype.serverInfo = async function loadServerInfos() {
  return get('/api/mc/info');
};

Client.prototype.listPlayers = async function() {
  return get('/api/mc/players');
};

async function get(url) {
  let request = new Request(url, { method: 'GET' });
  let response = await fetch(request);

  if (!response.ok) {
    return false;
  }

  return await response.json();
}
