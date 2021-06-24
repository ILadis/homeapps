
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

const pauseStates = [2, 3, 10];

function mapStatus(status) {
  let label = labels.get(status['state']) || 'Unbekannt';
  let battery = status['battery'] || 0;
  let cleaning = status['in_cleaning'] != 0;
  let charging = status['state'] == 8;
  let paused = pauseStates.includes(status['state']);
  let cleanDate = status['last_clean'] && new Date(status['last_clean'][0] * 1000);

  return { label, battery, cleaning, charging, paused, cleanDate };
}

function scheduleEvery(timeout, action) {
  return async function repeat() {
    try {
      await action();
    } finally {
      setTimeout(repeat, timeout);
    }
  }
}

Presenter.prototype.showIndex = function() {
  let { topBar } = this.shell;

  this.state = topBar.addStatus('Status');
  this.power = topBar.addStatus('Ladezustand');
  this.lastClean = topBar.addStatus('Letzte Reinigung');

  let { bottomSheet } = this.shell;

  this.charge = bottomSheet.addButton()
    .setLabel('Aufladen')
    .setIcon('charge')
    .setEnabled(false);

  this.pause = bottomSheet.addButton()
    .setLabel('Anhalten')
    .setIcon('pause')
    .setEnabled(false);

  let refreshStatus = scheduleEvery(8000,
    () => this.client.status().then(status => this.updateStatus(status)));

  this.state.set('Verbindung herstellen');
  refreshStatus();

  let { zoneSelect } = this.shell;

  zoneSelect.setTitle('Bereichwahl');
  zoneSelect.addOption('living-room', 'Wohnzimmer', '[22900, 20200, 25900, 24300, 1]');
  zoneSelect.addOption('dining-area', 'Essbereich', '[26000, 20200, 28600, 24100, 1]');
  zoneSelect.addOption('hallway', 'Flur', '[25700, 22500, 31600, 24100, 1]');
  zoneSelect.addOption('kitchen', 'Küche', '[26000, 24100, 27400, 26800, 1]');
  zoneSelect.addOption('bath-room', 'Bad', '[30000, 20400, 33500, 22300, 1]');
  zoneSelect.addOption('bed-room', 'Schlafzimmer', '[28600, 24100, 32800, 27450, 1]');
  zoneSelect.addOption('battle-station', 'Battlestation', '[23300, 24300, 25900, 27500, 1]');
  zoneSelect.onSubmitted = (zones) => this.client.zoneClean(zones.map(JSON.parse));

  this.charge.onClicked = () => this.client.charge();
};

Presenter.prototype.updateStatus = function(status) {
  let {
    label, battery,
    cleaning, charging,
    paused, cleanDate
  } = mapStatus(status);

  this.state.set(label);
  this.power.set(battery + '%');

  if (cleanDate) {
    this.lastClean.set(dateFormat.format(cleanDate) + ' Uhr');
  }

  this.shell.topBar.enableBrush(cleaning && !paused);

  this.pause.setLabel(paused ? 'Forsetzen' : 'Anhalten');
  this.pause.setIcon(paused ? 'resume' : 'pause');

  this.pause.setEnabled(cleaning || paused);
  this.charge.setEnabled(!charging);

  this.pause.onClicked = () => paused
    ? this.client.resume()
    : this.client.pause();
};

