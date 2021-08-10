
export function Presenter(shell, client) {
  this.shell = shell;
  this.client = client;
}

Presenter.prototype.showIndex = async function() {
  let clients = await this.client.listClients();

  for (let client of clients) {
    this.shell.addClient(client);
  }
};

