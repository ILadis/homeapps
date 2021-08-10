
export function Client() {
}

Client.prototype.listClients = async function() {
  let request = new Request(`./api/ts3/clients`, {
    method: 'GET'
  });

  let response = await fetch(request);
  if (!response.ok) {
    throw response;
  }

  let clients = await response.json();
  return clients;
};

