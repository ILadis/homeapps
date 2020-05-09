
export function Vacuum(hab) {
  this.hab = hab;
}

Vacuum.prototype.state = function() {
  const item = this.hab.item('RoboState');
  return item.state;
};

Vacuum.prototype.battery = function() {
  const item = this.hab.item('RoboBattery');
  return item.state;
};

Vacuum.prototype.startClean = function() {
  const item = this.hab.item('RoboPower');
  return item.state = 'ON';
};

Vacuum.prototype.lastClean = async function*() {
  const item = this.hab.item('RoboLastClean');
  for await (const state of item.state) {
    yield new Date(state);
  }
};

Vacuum.prototype.goHome = function() {
  const item = this.hab.item('RoboCommand');
  return item.state = 'app_charge';
};
