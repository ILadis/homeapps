
export function Presenter(shell, client) {
  this.shell = shell;
  this.client = client;
}

Presenter.prototype.showIndex = async function() {
  let { serverInfo, clientList } = this.shell;

  let client = this.client;
  refreshClients();
  refreshInfo();

  async function refreshInfo() {
    let info = await client.serverInfo();
    // TODO format version and uptime
    serverInfo.add('Servername', info.name);
    serverInfo.add('Version', info.version);
    serverInfo.add('Laufzeit', info.uptime);
  }

  async function refreshClients() {
    let clients = await client.listClients();
    for (let client of clients) {
      clientList.add(client);
    }
  }
};

