
import * as Views from './views.js';

export function Presenter(shell, client) {
  this.shell = shell;
  this.client = client;
}

Presenter.prototype.showIndex = function() {
  let { topBar } = this.shell;
  topBar.addStatus('Status', 'Reinigen');
  topBar.addStatus('Ladezustand', '100%');
  topBar.addStatus('Letzte Reinigung', '01.01.2020');

  let select = new Views.RoomSelect();
  select.addRoom('living-room', 'Wohnzimmer');
  select.addRoom('bed-room', 'Schlafzimmer');
  select.addRoom('kitchen', 'Küche');
  select.addRoom('bath-room', 'Bad');

  select.onSubmitted = () => topBar.toggleSpin(true);

  this.shell.setContent(select);
};

