
import { AsyncGenerator } from './async.js';

export function Repository() {
}

Repository.prototype.saveFile = function(file) {
  let fallbackType = 'application/octet-stream';
  let type = file.type || fallbackType;

  let request = new XMLHttpRequest();
  request.responseType = 'json';
  request.open('POST', './api/files');
  request.setRequestHeader('X-Filename', file.name);
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
    let { id, date } = request.response;
    file.id = id;
    file.date = date;
    progress.advance(100, true);
  };

  request.send(file);
  return progress.asIterable();
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
    yield file;
  }
};

Repository.prototype.addTag = async function(file, tag) {
  let request = new Request(`./api/files/${file.id}/tags`, {
    method: 'POST',
    body: tag
  });

  let response = await fetch(request);
  if (!response.ok) {
    throw new Error('failed to add tag');
  }
};

