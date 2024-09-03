
export function Presenter(shell, client) {
  this.shell = shell;
  this.client = client;
}

Presenter.prototype.showIndex = async function() {
  let { serverInfo, clientList } = this.shell;

  let client = this.client;
  refreshPlayers();
  refreshInfo();

  async function refreshInfo() {
    let info = await client.serverInfo();

    if (info !== false) {
      serverInfo.add('Name', info.name);
      serverInfo.add('Version', info.version);
    }
  }

  async function refreshPlayers() {
    let players = await client.listPlayers();

    if (players !== false) {
      clientList.online(true);
      clientList.set(players);
    } else {
      clientList.online(false);
    }
  }
};

