
import { AsyncGenerator, AsyncMulticast } from './async.js';

export function OpenHab(client) {
  this.client = client;
  this.broadcast = new AsyncMulticast(client.listenEvents());
  this.broadcast.start();
}

OpenHab.connect = function(uri) {
  const client = new Client(uri);
  return new OpenHab(client);
}

OpenHab.prototype.item = function(uid) {
  return new Item(this.client, this.broadcast, uid);
};

export function Item(client, events, uid) {
  this.client = client;
  this.events = events;
  this.uid = uid;
}

Object.defineProperty(Item.prototype, 'state', {
  get: async function*() {
    const { state } = await this.client.fetchItem(this.uid);
    yield state;

    const changed = `${this.uid}/statechanged`
    for await (const { topic, payload } of this.events.listen()) {
      if (topic.endsWith(changed)) {
        yield payload.value;
      }
    }
  },
  set: async function(value) {
    await this.client.saveState(this.uid, value);
  }
});

export function Client(uri) {
  this.uri = uri;
}

Client.prototype.fetchThing = async function(uid) {
  const uri = `${this.uri}/things/${uid}`;
  const request = new Request(uri, {
    method: 'GET'
  });

  const response = await fetch(request);
  if (!response.ok) {
    throw response;
  }

  return await response.json();
};

Client.prototype.fetchItem = async function(uid) {
  const uri = `${this.uri}/items/${uid}`;
  const request = new Request(uri, {
    method: 'GET'
  });

  const response = await fetch(request);
  if (!response.ok) {
    throw response;
  }

  return await response.json();
};

Client.prototype.saveState = async function(uid, state) {
  const uri = `${this.uri}/items/${uid}`;
  const request = new Request(uri, {
    method: 'POST',
    body: state,
    headers: {
      'Content-Type': 'text/plain'
    }
  });

  const response = await fetch(request);
  if (!response.ok) {
    throw response;
  }

  return await response.json();
};

Client.prototype.listenEvents = function() {
  const uri = `${this.uri}/events`
  const source = new EventSource(uri);

  const generator = new AsyncGenerator();

  source.onmessage = ({ data }) => {
    let { topic, payload, type } = JSON.parse(data);
    payload = JSON.parse(payload);
    generator.advance({ topic, payload, type }, false);
  };

  source.onerror = () => {
    if (source.readyState == 2) {
      generator.advance(null, true);
    }
  };

  return generator.asIterable();
};
