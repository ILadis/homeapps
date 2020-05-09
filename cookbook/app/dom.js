
export function html(source) {
  let template = document.createElement('template');
  template.innerHTML = source[0];

  let content = document.importNode(template.content, true);
  return content;
}

export function define(tag, base, template, init) {
  let proto = document.createElement(base).constructor;
  let options = { extends: base };

  let element = (class extends proto {
    constructor() {
      super();
      this.appendChild(template.cloneNode(true));
      this.setAttribute('is', tag);
      normalize(this);
      if (init) init.call(this);
    }
  });

  customElements.define(tag, element, options);
  return element;
}

export function normalize(node) {
  let childs = node.childNodes;
  for (let child of childs) {
    let text = child.textContent;
    let type = child.nodeType;

    switch (type) {
    case Node.TEXT_NODE:
      child.textContent = text.trim();
      break;
    case Node.COMMENT_NODE:
      child.remove();
      break;
    }
    normalize(child);
  }
  return node;
}

export function resizeHandler() {
  return (event) => {
    let target = event.target;
    if (target && target.scrollHeight) {
      target.style.height = 'auto';
      target.style.height = (target.scrollHeight) + 'px';
    }
  };
}

export function submitHandler(delegate) {
  return (event) => {
    event.preventDefault();
    let target = event.target;
    if (target && target.value) {
      delegate(target.value);
      target.value = '';
    }
  };
}

