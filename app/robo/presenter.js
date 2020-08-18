
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

Presenter.prototype.showIndex = function() {
  let { topBar } = this.shell;

  let state = topBar.addStatus('Status');
  let power = topBar.addStatus('Ladezustand');
  let lastClean = topBar.addStatus('Letzte Reinigung');

  let showStatus = (status) => {
    let state = labels.get(status['state']) || 'Unbekannt';
    state.set(state);

    let battery = status['battery'] || 0;
    power.set(battery + '%');

    // TODO show last clean date

    let cleaning = status['in_cleaning'] != 1;
    tobBar.enableBrush(cleaning);
  };

  let refreshStatus = async () => {
    try {
      let status = await this.client.status();
      showStatus(status);
    } finally {
      setTimeout(refreshStatus, 8000);
    }
  };

  let startClean = (rooms) => {
    this.client.clean(rooms);
  };

  state.set('Verbindung herstellen');
  refreshStatus();

  let select = new Views.RoomSelect();
  select.addRoom('living-room', 'Wohnzimmer', '17');
  select.addRoom('bed-room', 'Schlafzimmer', '2');
  select.addRoom('kitchen', 'Küche', '16');
  select.addRoom('bath-room', 'Bad', '1');

  select.onSubmitted = startClean;

  this.shell.setContent(select);
};

