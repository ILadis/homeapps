
export function Presenter(shell, client) {
  this.shell = shell;
  this.client = client;
}

Presenter.prototype.showIndex = async function() {
  let { serverInfo, playerList } = this.shell;

  let client = this.client;
  refreshPlayers();
  refreshInfo();

  async function refreshInfo() {
    let info = await client.serverInfo();

    if (info !== false) {
      serverInfo.add('Name', info.name);
      serverInfo.add('Version', info.version);
      serverInfo.add('Tage', info.days);
    }
  }

  async function refreshPlayers() {
    let players = await client.listPlayers();

    if (players !== false) {
      playerList.online(true);
      playerList.set(players);
    } else {
      playerList.online(false);
    }
  }
};

