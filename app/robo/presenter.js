
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

const dateFormat = new Intl.DateTimeFormat('de-DE', {
  day: 'numeric', month: 'long',
  hour: 'numeric', minute: 'numeric'
});

function mapStatus(status) {
  let label = labels.get(status['state']) || 'Unbekannt';
  let battery = status['battery'] || 0;
  let cleaning = status['in_cleaning'] != 0;
  let charging = status['state'] == 8;
  let paused = [2, 3, 10].includes(status['state']);
  let cleanDate = status['last_clean'] && new Date(status['last_clean'][0] * 1000);

  return { label, battery, cleaning, charging, paused, cleanDate };
}

Presenter.prototype.showIndex = function() {
  let { topBar, bottomSheet, roomSelect } = this.shell;

  let state = topBar.addStatus('Status');
  let power = topBar.addStatus('Ladezustand');
  let lastClean = topBar.addStatus('Letzte Reinigung');

  let charge = bottomSheet.addButton()
    .setLabel('Aufladen')
    .setIcon('charge')
    .setEnabled(false);

  let pause = bottomSheet.addButton()
    .setLabel('Anhalten')
    .setIcon('pause')
    .setEnabled(false);

  let showStatus = (status) => {
    let {
      label, battery,
      cleaning, charging,
      paused, cleanDate
    } = mapStatus(status);

    state.set(label);
    power.set(battery + '%');

    if (cleanDate) {
      lastClean.set(dateFormat.format(cleanDate) + ' Uhr');
    }

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

  roomSelect.addRoom('living-room', 'Wohnzimmer', '17');
  roomSelect.addRoom('bed-room', 'Schlafzimmer', '2');
  roomSelect.addRoom('kitchen', 'Küche', '16');
  roomSelect.addRoom('bath-room', 'Bad', '1');

  roomSelect.onSubmitted = (rooms) => this.client.clean(rooms);
  charge.onClicked = () => this.client.charge();
};

