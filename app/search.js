
export function Search(objects, contents) {
  this.objects = objects;
  this.contents = stringify(contents);
}

Search.prototype.execute = function(query) {
  let { objects, contents } = this;

  let terms = termify(query);
  let results = new Map();

  for (let term of terms) {
    let idf = inverseFrequency(term, objects, contents);
    for (let object of objects) {
      let tf = termFrequency(term, object, contents);

      let score = results.get(object) || 0;
      score += tf * idf;

      results.set(object, score);
    }
  }

  if (!terms.length) {
    return false;
  }

  return resultSet(results);
};

function* resultSet(results) {
  while (results.size > 0) {
    let highest = -Infinity, next;

    for (let [object, score] of results) {
      if (score > highest) {
        highest = score;
        next = object;
      }
    }

    if (highest <= 0) break;

    results.delete(next);
    yield next;
  }
}

function inverseFrequency(term, objects, contents) {
  let count = 1, frequency = 0;

  for (let object of objects) {
    count++;
    for (let content of contents(object)) {
      term.lastIndex = 0;
      if (term.test(content)) {
        frequency++;
        break;
      }
    }
  }

  return !frequency ? 0 : Math.log(count / frequency);
}

function termFrequency(term, object, contents) {
  let frequency = 0;

  for (let content of contents(object)) {
    term.lastIndex = 0;
    while (term.test(content)) {
      frequency++;
    }
  }

  return frequency;
}

const words = new RegExp('\\S+', 'g');
const mask = new RegExp('[.*+\-?^${}()|[\]\\]', 'g');

function termify(query) {
  let terms = query.match(words) || [];

  let toRegExp = (term, i) => {
    term = term.replace(mask, '\\$&');
    term = new RegExp(term, 'gi');
    terms[i] = term;
  };

  terms.forEach(toRegExp);
  return terms;
}

const types = ['string', 'number'];

function stringify(contents) {
  return function*(object) {
    for (let content of contents(object)) {
      if (types.includes(typeof content)) {
        yield content.toString();
      }
      yield '';
    }
  }
}

