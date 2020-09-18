
import * as Views from './views.js';

export function Presenter(shell, client) {
  this.shell = shell;
  this.client = client;
}

const labels = new Map([
  [  1, 'Startet'],
  [  2, 'Ruhend'],
  [  3, 'Untätig'],
  [  5, 'Reinigen'],
  [  6, 'Kehrt zurück'],
  [  8, 'Wird geladen'],
  [ 10, 'Pausiert'],
  [ 12, 'Fehlerhaft'],
  [ 13, 'Wird abgeschaltet'],
  [ 17, 'Reinigt Bereich'],
  [ 18, 'Reinigt Raum'],
  [100, 'Voll aufgeladen']
]);

function mapStatus(status) {
  let label = labels.get(status['state']) || 'Unbekannt';
  let battery = status['battery'] || 0;
  let cleaning = status['in_cleaning'] != 0;
  let charging = status['state'] == 8;
  let paused = [2, 3, 10].includes(status['state']);

  return { label, battery, cleaning, charging, paused };
}

Presenter.prototype.showIndex = function() {
  let { topBar, bottomSheet } = this.shell;

  let state = topBar.addStatus('Status');
  let power = topBar.addStatus('Ladezustand');
  let lastClean = topBar.addStatus('Letzte Reinigung');

  let charge = bottomSheet.addButton()
    .setLabel('Aufladen')
    .setIcon('charge');

  let pause = bottomSheet.addButton()
    .setLabel('Anhalten')
    .setIcon('pause')
    .setEnabled(false);

  let showStatus = (status) => {
    let {
      label, battery,
      cleaning, charging,
      paused
    } = mapStatus(status);

    state.set(label);
    power.set(battery + '%');

    topBar.enableBrush(cleaning && !paused);

    pause.setLabel(paused ? 'Forsetzen' : 'Anhalten');
    pause.setIcon(paused ? 'resume' : 'pause');

    pause.setEnabled(cleaning || paused);
    charge.setEnabled(!charging);

    pause.onClicked = () => paused
      ? this.client.resume()
      : this.client.pause();
  };

  let refreshStatus = async () => {
    try {
      let status = await this.client.status();
      showStatus(status);
    } finally {
      setTimeout(refreshStatus, 8000);
    }
  };

  state.set('Verbindung herstellen');
  refreshStatus();

  let select = new Views.RoomSelect();
  select.addRoom('living-room', 'Wohnzimmer', '17');
  select.addRoom('bed-room', 'Schlafzimmer', '2');
  select.addRoom('kitchen', 'Küche', '16');
  select.addRoom('bath-room', 'Bad', '1');

  select.onSubmitted = (rooms) => this.client.clean(rooms);
  charge.onClicked = () => this.client.charge();

  this.shell.setContent(select);
};

