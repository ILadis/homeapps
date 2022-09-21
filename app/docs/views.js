
import { html, define, sleep, submitHandler } from './dom.js';

const DateFormat = new Intl.DateTimeFormat('de-DE', {
  year: 'numeric',
  month: 'numeric',
  day: 'numeric'
});

export const Shell = define('app-shell', 'div', html`
<div is="bottom-bar"></div>
<div is="upload-list"></div>`, function() {
  this.contents = new Set();
  this.bottomBar = this.querySelector('[is=bottom-bar]');
  this.uploadList = this.querySelector('[is=upload-list]');
});

Shell.prototype.setTitle = function(title) {
  document.title = title;
};

Shell.prototype.setContent = function(...contents) {
  for (var content of this.contents) {
    content.remove();
  }

  this.contents.clear();
  while (content = contents.pop()) {
    this.prepend(content);
    this.contents.add(content);
  }
};

export const RippleButton = define('ripple-button', 'button', html`
`, function() {
  this.onclick = async (event) => {
    event.preventDefault();
    this.playAnimation(event);
    await sleep(300);
    this.onClicked();
  };
});

RippleButton.prototype.playAnimation = function(event) {
  let rect = this.getBoundingClientRect();

  let diameter = Math.max(rect.width, rect.height);
  let radius = diameter / 2;

  let left = event.clientX - rect.left - radius;
  let top = event.clientY - rect.top - radius;

  var span = this.querySelector('.ripple');
  if (span) {
    span.remove();
  }

  var span = document.createElement('span');
  span.style.width =
  span.style.height = diameter + 'px';
  span.style.left = left + 'px';
  span.style.top = top + 'px';
  span.className = 'ripple';

  this.appendChild(span);

  return new Promise((resolve) => {
    span.onanimationend = () => {
      span.remove();
      resolve();
    };
  });
};

RippleButton.prototype.onClicked = function() {
};

export const Tag = define('app-tag', 'span', html``, function() {
  this.className = 'chip';
  this.onclick = () => this.onClicked();
});

Tag.prototype.onClicked = function() {
};

Tag.prototype.setLabel = function(label) {
   this.textContent = label;
   return this;
};

Tag.prototype.setColor = function(color) {
   this.classList.add(color);
   return this;
};

export const FileList = define('file-list', 'div', html`
<h1>Dokumente</h1>
<form>
  <input type="text" placeholder="Suchen">
</form>
<hr>
<ul></ul>`, function() {
  this.items = new Set();

  let input = this.querySelector('input');
  input.oninput = () => this.onSearchChanged(input.value);
});

FileList.prototype.onSearchChanged = function(query) {
};

FileList.prototype.setTitle = function(title) {
  let h1 = this.querySelector('h1');
  h1.textContent = title;
  return this;
};

FileList.prototype.focusSearch = function() {
  let input = this.querySelector('input');
  input.focus();
};

FileList.prototype.addItem = function() {
  let view = new FileListItem();

  let ul = this.querySelector('ul');
  ul.insertBefore(view, ul.firstChild);

  this.items.add(view);
  return view;
};

FileList.prototype.removeItem = function(view) {
  let ul = this.querySelector('ul');
  ul.removeChild(view);

  this.items.delete(view);
};

export const FileListItem = define('file-list-item', 'li', html`
<h1></h1>
<h2></h2>
<h2></h2>
<hr>`, function() {
  this.tags = new Set();
  this.onclick = () => this.onClicked();
});

FileListItem.prototype.onClicked = function() {
};

FileListItem.prototype.setName = function(name) {
  let h1 = this.querySelector('h1');
  h1.textContent = name;
  return this;
};

FileListItem.prototype.setSize = function(size) {
  let h2 = this.querySelector('h2:first-of-type');
  h2.textContent = size;
  return this;
};

FileListItem.prototype.setDate = function(date) {
  let h2 = this.querySelector('h2:last-of-type');

  var date = DateFormat.format(new Date(date));
  h2.textContent = date;

  return this;
};

FileListItem.prototype.addTag = function() {
  let hr = this.querySelector('hr');

  let view = new Tag();
  this.insertBefore(view, hr);

  this.tags.add(view);
  return view;
};

FileListItem.prototype.removeTag = function(view) {
  this.removeChild(view);
  this.tags.delete(view);
};

export const FileDetails = define('file-details', 'div', html`
<h1></h1>
<form>
  <div>
    <label>Tags</label>
    <input type="text" name="tag">
  </div>
  <hr>
  <div>
    <label>Name</label>
    <input type="text" name="name">
  </div>
  <hr>
  <div>
    <label>Datum</label>
    <input type="date" name="date">
  </div>
  <hr>
</form>`, function() {
  this.tags = new Set();

  let form = this.querySelector('form');
  let inputs = this.querySelectorAll('input');

  form.onsubmit =
  inputs[0].onchange = submitHandler((value) => this.onTagSubmitted(value));
  inputs[1].onchange = ({ target }) => this.onNameChanged(target.value);
  inputs[2].onchange = ({ target }) => this.onDateChanged(target.valueAsDate);
});

FileDetails.prototype.onTagSubmitted = function(tag) {
};

FileDetails.prototype.onNameChanged = function(name) {
};

FileDetails.prototype.onDateChanged = function(date) {
};

FileDetails.prototype.setName = function(name) {
  let h1 = this.querySelector('h1');
  h1.textContent = name;

  let input= this.querySelector('[name=name]');
  input.value = name;
};

FileDetails.prototype.setDate = function(date) {
  let input= this.querySelector('[name=date]');

  var date = new Date(date);
  input.valueAsDate = date;
};

FileDetails.prototype.addTag = function() {
  let input = this.querySelector('input');
  let parent = input.parentNode;

  let view = new Tag();
  parent.insertBefore(view, input);

  this.tags.add(view);
  return view;
};

FileDetails.prototype.removeTag = function(view) {
  let input = this.querySelector('input');
  let parent = input.parentNode;
  parent.removeChild(view);

  this.tags.delete(view);
};

export const PdfFileViewer = define('pdf-file-viewer', 'div', html`
<ul></ul>`);

PdfFileViewer.prototype.loadPdfjs = function() {
  if (window.pdfjsLib) {
    return Promise.resolve(window.pdfjsLib);
  }

  let pdfjsSrc = '/app/pdf.js';
  let workerSrc = '/app/pdf.worker.js';

  let script = document.createElement('script');
  script.src = pdfjsSrc;

  this.appendChild(script);

  return new Promise((resolve) => {
    script.onload = () => {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;
      resolve(window.pdfjsLib);
    };
  });
};

PdfFileViewer.prototype.renderUrl = async function(url) {
  let pdfjsLib = await this.loadPdfjs();
  let task = pdfjsLib.getDocument(url);

  let pdf = await task.promise;
  for (let i = 1; i <= pdf.numPages; i++) {
    let page = await pdf.getPage(i);
    this.addPage(page);
  }
};

PdfFileViewer.prototype.addPage = function(page) {
  let ul = this.querySelector('ul');

  let canvas = document.createElement('canvas');
  let context = canvas.getContext('2d');

  let pixelRatio = window.devicePixelRatio || 1;
  let viewport = page.getViewport({ scale: 1 });
  let transform = [pixelRatio, 0 , 0, pixelRatio, 0, 0];

  canvas.width = viewport.width * pixelRatio;
  canvas.height = viewport.height * pixelRatio;

  page.render({
    canvasContext: context,
    viewport, transform
  });

  let li = document.createElement('li');
  li.appendChild(canvas);
  ul.appendChild(li);
};

export const FileScan = define('file-scan', 'div', html`
<ul></ul>`, function() {
  this.items = new Set();
});

FileScan.prototype.onScanSubmitted = function() {
};

FileScan.prototype.addItem = function() {
  let view = new FileScanItem();

  let ul = this.querySelector('ul');
  ul.appendChild(view);

  this.items.add(view);
  return view;
};

FileScan.prototype.removeItem = function(view) {
  let ul = this.querySelector('ul');
  ul.removeChild(view);

  this.items.delete(view);
};

export const FileScanItem = define('file-scan-item', 'li', html`
<img>`);

FileScanItem.prototype.setImage = function(src) {
  let img = this.querySelector('img');
  img.src = src;
  return this;
};

FileScanItem.prototype.scrollTo = function() {
  let options = { behavior: 'smooth' };
  let scroll = () => this.scrollIntoView(options);
  setTimeout(scroll, 100);
};

export const UploadList = define('upload-list', 'div', html`
<hr hidden>
<ul></ul>`, function() {
  this.items = new Set();
});

UploadList.prototype.addItem = function() {
  let [hr, ul] = this.querySelectorAll('hr, ul');
  hr.hidden = false;

  let view = new UploadListItem();
  ul.appendChild(view);

  this.items.add(view);
  return view;
};

UploadList.prototype.clearItems = function() {
  let [hr, ul] = this.querySelectorAll('hr, ul');
  hr.hidden = true;

  while (ul.firstChild) {
    ul.removeChild(ul.firstChild);
  }

  this.items.clear();
};

UploadList.prototype.pullUp = function() {
  let li = this.querySelector('ul > :last-child');

  if (li) {
    let options = { behavior: 'smooth' };
    let scroll = () => li.scrollIntoView(options);
    setTimeout(scroll, 100);
  }
};

export const UploadListItem = define('upload-list-item', 'li', html`
<h1></h1>
<h2></h2>
<div><span></span></div>
<hr>`);

UploadListItem.prototype.setName = function(name) {
  let h1 = this.querySelector('h1');
  h1.textContent = name;
  return this;
};

UploadListItem.prototype.setProgress = function(percent) {
  var percent = Math.round(percent) + '%';

  let [h2, span] = this.querySelectorAll('h2, span');
  span.style.width = percent;
  h2.textContent = percent;

  return this;
};

export const BottomBar = define('bottom-bar', 'div', html`
<form>
  <input type="file" multiple>
  <button is="ripple-button">
    <svg viewBox="0 0 24 24"><use></use></svg>
  </button>
</form>
<nav></nav>
<template id="action">
  <button is="ripple-button">
    <svg viewBox="0 0 24 24"><use></use></svg>
  </button>
</template>`);

BottomBar.prototype.setFloatingAction = function(icon, handler, files) {
  let [form, input] = this.querySelectorAll('form, [type=file]');

  form.hidden = false;
  input.onchange = () => {
    let files = Array.from(input.files);
    form.reset();
    handler(files);
  };

  let [button, use] = form.querySelectorAll('button, use');
  button.onClicked = () => files ? input.click() : handler();
  use.setAttribute('href', '#' + icon);

  return this;
};

BottomBar.prototype.addAction = function(icon, handler) {
  let template = this.querySelector('#action');
  let nav = this.querySelector('nav');

  let node = template.content.cloneNode(true);

  let [button, use] = node.querySelectorAll('button, use');
  button.onClicked = handler;
  use.setAttribute('href', '#' + icon);

  nav.appendChild(node);

  return this;
};

BottomBar.prototype.clearActions = function() {
  let form = this.querySelector('form');
  form.hidden = true;

  let nodes = this.querySelectorAll('nav > *');
  for (let node of nodes) {
    node.remove();
  }
};

