
import * as Views from './views.js';

export function Presenter(shell, client) {
  this.shell = shell;
  this.client = client;
}

Presenter.prototype.showIndex = async function() {
  let { topBar } = this.shell;

  let ssid = topBar.addStatus('SSID');
  ssid.set('unbekannt');

  let active = topBar.addStatus('Status');
  active.set('unbekannt');

  let numStations = topBar.addStatus('Verbundene Geräte');
  numStations.set('unbekannt');

  let toggleStatus = async (enabled) => {
    try {
      await (enabled
        ? this.client.enable()
        : this.client.disable());
    } catch (e) {
      topBar.setToggle(!enabled);
    }
  };

  let showStatus = (status) => {
    let enabled = status['state'] == 'ENABLED';

    ssid.set(status['ssid[0]']);
    numStations.set(status['num_sta[0]'])

    active.set(enabled ? 'Aktiv' : 'Deaktiviert');
    topBar.setToggle(enabled);
  };

  let refreshStatus = async () => {
    try {
      let status = await this.client.status();
      showStatus(status);
    } finally {
      setTimeout(refreshStatus, 8000);
    }
  };

  topBar.onToggleClicked = (enabled) => toggleStatus(enabled);

  refreshStatus();
};

