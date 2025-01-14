
import { AsyncGenerator } from './async.js';

export function TabsManager(broker) {
  this.broker = broker;
}

TabsManager.prototype.isAvailable = function() {
  return new Promise(resolve => {
    let timer = setTimeout(() => (unsubscribe(), resolve(false)), 1000);
    let unsubscribe = this.broker.listen(message => {
      if ('pong' in message) {
        clearTimeout(timer);
        unsubscribe();
        resolve(true);
      }
    });
    this.broker.send({ 'ping': true });
  });
};

TabsManager.prototype.observeTabs = function() {
  let generator = new AsyncGenerator();

  this.broker.listen(message => {
    if ('pages' in message) {
      generator.advance(message.pages, false);
    }
  });

  return generator.asIterable();
};
