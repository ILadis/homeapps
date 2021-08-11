
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
    serverInfo.add('Name', info.name);
    serverInfo.add('Version', formatVersion(info));
    serverInfo.add('Laufzeit', formatUptime(info));
  }

  async function refreshClients() {
    let clients = await client.listClients();
    for (let client of clients) {
      clientList.add(client);
    }
  }

  function formatVersion({ version }) {
    let pattern = RegExp('(\\d+\\.)+\\d');
    let matches = pattern.exec(version);
    return matches ? matches[0] : '';
  }

  function formatUptime({ uptime }) {
    let steps = new Set([
      ['Tag(e)', 60*60*24],
      ['Stunde(n)', 60*60],
    ]);

    let format = '', value;

    for (let [unit, seconds] of steps) {
      value = Math.floor(uptime / seconds);
      uptime %= seconds;
      format += value + ' ' + unit + ' ';
    }

    return format;
  }
};

