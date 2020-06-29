
import { AsyncGenerator } from './async.js';

export function Repository() {
}

Repository.prototype.uploadFile = function(file) {
  let fallbackType = 'application/octet-stream';
  let type = file.type || fallbackType;
  let name = encodeURI(file.name);

  let request = new XMLHttpRequest();
  request.responseType = 'json';
  request.open('POST', './api/files');
  request.setRequestHeader('X-Filename', name);
  request.overrideMimeType(type);

  let progress = new AsyncGenerator();

  request.upload.onprogress = (event) => {
    if (event.lengthComputable) {
      let { loaded, total } = event;
      let percent = Math.round((loaded / total) * 100);
      progress.advance(percent, false);
    }
  };

  request.upload.onload = () => {
    progress.advance(100, false);
  };

  // TODO implement onerror handlers
  request.onload = () => {
    Object.setPrototypeOf(file, null);
    Object.assign(file, request.response);
    file.uri = `./api/files/${file.id}/raw`;
    progress.advance(100, true);
  };

  request.send(file);
  return progress.asIterable();
};

Repository.prototype.saveFile = async function(file) {
  let body = JSON.stringify(file);
  let request = new Request(`./api/files/${file.id}`, {
    method: 'POST', body
  });

  let response = await fetch(request);
  if (!response.ok) {
    throw new Error('failed to save file');
  }
};

Repository.prototype.listFiles = async function*() {
  let request = new Request('./api/files', {
    method: 'GET'
  });

  let response = await fetch(request);
  if (!response.ok) {
    throw new Error('failed to fetch files');
  }

  let files = await response.json();
  for (let file of files) {
    file.uri = `./api/files/${file.id}/raw`;
    yield file;
  }
};

Repository.prototype.findFileById = async function(id) {
  let request = new Request(`./api/files/${id}`, {
    method: 'GET'
  });

  let response = await fetch(request);
  if (!response.ok) {
    throw new Error('failed to fetch file');
  }

  let file = await response.json();
  file.uri = `./api/files/${file.id}/raw`;

  return file;
};

Repository.prototype.deleteFile = async function(file) {
  let request = new Request(`./api/files/${file.id}`, {
    method: 'DELETE'
  });

  let response = await fetch(request);
  if (!response.ok) {
    throw new Error('failed to delete file');
  }
};

Repository.prototype.addTag = async function(file, tag) {
  let request = new Request(`./api/files/${file.id}/tags`, {
    method: 'POST', body: tag
  });

  let response = await fetch(request);
  if (!response.ok) {
    throw new Error('failed to add tag');
  }
};

Repository.prototype.listInboxFiles = async function*() {
  let request = new Request('./api/inbox/files', {
    method: 'GET'
  });

  let response = await fetch(request);
  if (!response.ok) {
    throw new Error('failed to fetch inbox files');
  }

  let files = await response.json();
  for (let file of files) {
    file.uri = `./api/files/${file.id}/raw`;
    yield file;
  }
};

Repository.prototype.deleteInboxFiles = async function() {
  let request = new Request('./api/inbox/files', {
    method: 'DELETE'
  });

  let response = await fetch(request);
  if (!response.ok) {
    throw new Error('failed to delete inbox files');
  }
};

Repository.prototype.scanInboxFile = async function() {
  let request = new Request('./api/inbox/scan', {
    method: 'POST'
  });

  let response = await fetch(request);
  if (!response.ok) {
    throw new Error('failed to scan inbox file');
  }

  let file = await response.json();
  file.uri = `./api/files/${file.id}/raw`;

  return file;
};

Repository.prototype.convertInboxFiles = async function() {
  let request = new Request('./api/inbox/convert', {
    method: 'POST'
  });

  let response = await fetch(request);
  if (!response.ok) {
    throw new Error('failed to convert inbox files');
  }

  let file = await response.json();
  file.uri = `./api/files/${file.id}/raw`;

  return file;
};

