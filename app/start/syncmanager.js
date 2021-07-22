
import { Database } from './storage.js';

export function SyncManager() {
  this.db = Database.create('syncmanager', (schema) => {
    schema.createObjectStore('requests', {
      keyPath: 'id',
      autoIncrement: true
    });
  });
}

SyncManager.prototype.tryFetch = async function(request) {
  try {
    await fetch(request.clone());
    this.syncAll();
    return true;
  } catch {
    await this.preserve(request);
    return false;
  }
};

SyncManager.prototype.preserve = async function(request) {
  let db = await this.db;

  let { url, method, headers } = request;
  let body = await request.blob();

  headers = new Map(headers);

  db.beginTx('requests', 'readwrite');
  await db.save({ url, method, headers, body });
};

SyncManager.prototype.syncAll = async function() {
  let db = await this.db;

  while (true) {
    db.beginTx('requests', 'readonly');

    let request = await db.fetchNext();
    if (request === false) break;

    let { id, url, method, headers, body } = request;
    await fetch(url, { method, headers, body });

    db.beginTx('requests', 'readwrite');
    await db.deleteByKey(id);
  }
};
