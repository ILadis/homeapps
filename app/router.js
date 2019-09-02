
export function Router() {
  this.active = false;
  this.routes = new Map();
}

Router.prototype.register = function(segment, params, action) {
  let route = new Route(segment, params);
  this.routes.set(route, action);
  return route;
};

Router.prototype.apply = function(url) {
  let iterator = this.routes.entries();
  this.active = null;

  for (let [route, action] of iterator) {
    let params = route.matches(url.hash);
    if (params !== false) {
      this.active = route;
      action(params);
      break;
    }
  }

  return this.active;
};

export function Route(segment, params) {
  this.segment = segment;
  this.params = params;
}

Route.prototype.matches = function(hash) {
  let params = new URLSearchParams(hash.substr(1));
  if (!params.has(this.segment)) {
    return false;
  }

  let iterator = this.params.values();

  let values = new Object();
  for (let name of iterator) {
    if (!params.has(name)) {
      return false;
    }
    values[name] = params.get(name);
  }

  return values;
};

Route.prototype.compute = function(values) {
  let iterator = this.params.values();
  let params = new URLSearchParams();

  let query = false;
  for (let name of iterator) {
    let value = values[name];
    params.set(name, value);
    query = true;
  }

  let hash = '#' + this.segment;
  if (query) {
    hash += '&' + params;
  }

  return hash;
};

