
export function Router() {
  this.routes = new Map();
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

Router.prototype.referer = function(...routes) {
  let hashes = history.state || [];
  for (let hash of hashes) {
    for (let route of routes) {
      if (route.matches(hash)) {
        return true;
      }
    }
  }

  return false;
};

Router.prototype.gobackTo = async function(route, values) {
  let hashes = history.state || [];

  let hash = route.compute(values);
  let uri = location.pathname + hash;

  let index = Math.max(0, hashes.indexOf(hash));
  let delta = ++index - hashes.length;

  await historyGoto(delta);

  hashes = hashes.slice(0, index);
  history.replaceState(hashes, '', uri);
};

Router.prototype.navigateTo = function(route, values) {
  let hashes = history.state || [];

  let hash = route.compute(values);
  let uri = location.pathname + hash;

  if (!hashes.length) {
    hashes = [hash];
    history.replaceState(hashes, '', uri);
  }

  else if (!route.equals(location.hash, values)) {
    hashes.push(hash);
    history.pushState(hashes, '', uri);
  }
};

function historyGoto(delta) {
  return new Promise(function(resolve) {
    addEventListener('popstate', resolve, { once: true });
    history.go(delta);
  });
}

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

