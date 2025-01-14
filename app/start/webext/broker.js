(function() {

  function Broker() {
    this.listeners = new Set();
    this.consumers = new Set();
  }

  const Message = Object.create(null);

  Message.createNew = function(tag, type, payload) {
    let message = Object.create(null);
    message['tags'] = [tag];
    message['type'] = type;
    message['payload'] = payload;
    return Object.freeze(message);
  };

  Message.isInstance = function(message) {
    // TODO consider setting prototype?
    return typeof message === 'object' && 'tags' in message;
  };

  Message.addTag = function(tag, message) {
    if (!message.tags.includes(tag)) {
      message.tags.push(tag);
    }
    return message;
  };

  // message listener for web scripts
  Broker.registerListener = function(tag, handler) {
    window.addEventListener('message', handle);

    function handle({ data: message }) {
      if (!message.tags.includes(tag)) {
        handler(message);
      }
    }
  };

  // message listener for background scripts
  Broker.registerHandler = function(tag, handler, listeners) {
    browser.runtime.onMessage.addListener(handle);

    function handle(message) {
      switch (message.type) {
      case 'poll':
        return new Promise(resolve => listeners.add(resolve));

      case 'message':
        if (!message.tags.includes(tag)) {
          handler(message);
        }
      }
    }
  };

  // message poller for content scripts
  Broker.pollMessages = async function(tag, handler) {
    while (true) {
      let poll = Message.createNew(tag, 'poll');
      let message = await browser.runtime.sendMessage(poll);

      if (!message.tags.includes(tag)) {
        handler(message);
      }
    }
  };

  Broker.prototype.started = function() {
    return this.tag !== undefined;
  };

  Broker.prototype.start = async function(raw = false) {
    if (this.started()) {
      return false;
    }

    let tag = this.tag = Math.random();
    let handler = (message) => this.consumers.forEach(consumer => consumer(raw ? message : message.payload));
    let poller = Promise.resolve();

    if (typeof browser !== 'undefined') {
      if ('tabs' in browser) {
        // background script
        Broker.registerHandler(tag, handler, this.listeners);
        return true;
      }

      // content script
      poller = Broker.pollMessages(tag, handler);
    }

    // web (and content) script
    Broker.registerListener(tag, handler);

    await poller;
    return true;
  };

  Broker.prototype.send = function(payload) {
    if (!this.started()) {
      false;
    }

    let message = Message.isInstance(payload)
      ? Message.addTag(this.tag, payload)
      : Message.createNew(this.tag, 'message', payload);

    if (typeof browser !== 'undefined') {
      if ('tabs' in browser) {
        // background script
        this.listeners.forEach(listener => listener(message));
        this.listeners.clear();
        return true;
      }

      // content script
      browser.runtime.sendMessage(message);
    }

    // web (and content) script
    window.postMessage(message);
    return true;
  };

  Broker.prototype.listen = function(consumer) {
    this.consumers.add(consumer);
    return () => this.consumers.delete(consumer);
  };

  window.broker = new Broker();
})();
