
import * as Views from './views.js';

export function Presenter(shell, client) {
  this.shell = shell;
  this.client = client;
}

Presenter.prototype.showIndex = function() {
  let { topBar } = this.shell;

  let state = topBar.addStatus('Status');
  let power = topBar.addStatus('Ladezustand');
  let lastClean = topBar.addStatus('Letzte Reinigung');

  let showStatus = (status) => {
    state.set(toLabel(status.state));
    power.set(status.battery + '%');
    // TODO show last clean date
  };

  let refreshStatus = async () => {
    try {
      let status = await this.client.status();
      showStatus(status);
    } finally {
      setTimeout(refreshStatus, 8000);
    }
  };

  let startClean = async (rooms) => {
    if (rooms.length) {
      await this.client.clean(rooms);
      topBar.toggleSpin(true);
    }
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

function toLabel(state) {
  return labels.get(state) || 'Unbekannt';
}

