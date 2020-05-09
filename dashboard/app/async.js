
export function AsyncGenerator() {
  this.resolve = null;
}

AsyncGenerator.prototype.next = function() {
  return new Promise((resolve) => {
    this.resolve = resolve;
  });
};

AsyncGenerator.prototype.advance = function(value, done) {
  this.resolve({ value, done });
};

AsyncGenerator.prototype.asIterable = function() {
  return { [Symbol.asyncIterator]: () => this };
};

export function AsyncMulticast(source) {
  this.source = source;
  this.generators = new Array();
}

AsyncMulticast.prototype.start = async function() {
  for await (var value of this.source) {
    this.notify(value, false);
  }
  this.notify(value, true);
};

AsyncMulticast.prototype.notify = function(value, done) {
  for (const generator of this.generators) {
    generator.advance(value, done);
  }
};

AsyncMulticast.prototype.listen = function() {
  const generator = new AsyncGenerator();
  this.generators.push(generator);
  return generator.asIterable();
};
