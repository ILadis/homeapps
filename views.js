(function(exports) {

  function html(source) {
    let template = document.createElement('template');
    template.innerHTML = source[0];
    return template.content;
  }

  function importNode(template) {
    let node = document.importNode(template, true);
    return node.firstElementChild;
  }

  function Recipe() {
    this.node = importNode(Recipe.template);
  }

  Recipe.template = html`
  <header>
    <h1><!-- name --></h1>
    <h2>
      <button>-</button>
      <span><!-- servings --></span>
      <button>+</button>
    </h2>
    <ul><!-- (quantity unit) ingredient --></ul>
  </header>
  `;

  Recipe.prototype.setName = function(name) {
    let h1 = this.node.querySelector('h1');
    h1.textContent = name;
  };

  Recipe.prototype.setServings = function({ quantity, unit }) {
    let span = this.node.querySelector('span');
    span.textContent = `Zutaten für ${quantity} ${unit}`;
  };

  // TODO consider returning view here
  Recipe.prototype.addIngredient = function({ ingredient, quantity, unit }) {
    let ul = this.node.querySelector('ul');
    let li = document.createElement('li');
    li.textContent = `${quantity || ''} ${unit || ''} ${ingredient}`;
    ul.appendChild(li);
  };

  Recipe.prototype.appendTo = function(node) {
    node.appendChild(this.node);
  };

  function Steps() {
    this.node = importNode(Steps.template);
  }

  Steps.template = html`
  <section>
    <h2><!-- steps --></h2>
    <ol>
      <template>
        <li>
          <h3><!-- ingredients --></h3>
          <ul><!-- (quantity unit) ingredient--></ul>
          <span><!-- step --></span>
        </li>
      </template>
    </ol>
  </section>
  `;

  // TODO consider returning view here
  Steps.prototype.addStep = function({ step, ingredients }) {
    let h2 = this.node.querySelector('h2');
    h2.textContent = 'Zubereitung';

    let template = this.node.querySelector('template');
    let node = document.importNode(template.content, true);

    let ul = node.querySelector('ul');
    let h3 = node.querySelector('h3');
    h3.textContent = 'Zutaten';

    if (!ingredients) {
      h3.remove();
    } else for (let { ingredient, quantity, unit } of ingredients) {
      let li = document.createElement('li');
      li.textContent = `${quantity || ''} ${unit || ''} ${ingredient}`;
      ul.appendChild(li);
    }

    let span = node.querySelector('span');
    span.textContent = step;

    let ol = this.node.querySelector('ol');
    ol.appendChild(node);
  };

  Steps.prototype.appendTo = function(node) {
    node.appendChild(this.node);
  };

  function clearAll(node) {
    while (node.firstChild) {
      node.firstChild.remove();
    }
  }

  exports.Views = { Recipe, Steps, clearAll };

})(this);

