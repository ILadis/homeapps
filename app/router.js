
export function Router() {
  this.routes = new Map();
  this.init = false;
}

Router.prototype.register = function(segment, params, action) {
  let route = new Route(segment, params);
  this.routes.set(route, action);
  return route;
};

Router.prototype.apply = function(hash) {
  let iterator = this.routes.entries();

  for (let [route, action] of iterator) {
    let params = route.matches(hash);
    if (params !== false) {
      action(params);
      return route;
    }
  }
};

Router.prototype.navigateTo = function(route, values) {
  if (!route.equals(location.hash, values)) {
    let hash = route.compute(values);
    let uri = location.pathname + hash;

    if (!this.init) {
      history.replaceState(null, '', uri);
    } else {
      history.pushState(null, '', uri);
    }
  }

  this.init = true;
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

Route.prototype.equals = function(hash, values) {
  let match = this.matches(hash);
  if (!match) {
    return false;
  }

  let iterator = this.params.values();
  for (let name of iterator) {
    if(values[name] != match[name]) {
      return false;
    }
  }

  return true;
};

