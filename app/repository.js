
import { Recipe } from './recipe.js';

const whiteList = new RegExp('^([a-z\\-]+)\\.json$');

export function Repository() {
}

Repository.prototype.fetchAll = async function*(fresh = false) {
  let request = new Request('./recipes');
  if (fresh) {
    request.headers.set('cache-control', 'no-cache');
  }

  let response = await fetch(request);
  if (!response.ok) {
    throw new Error('failed to fetch index');
  }

  let index = await response.json();
  for (let { name } of index) {
    let matches = name.match(whiteList);
    if (!matches) {
      continue;
    }

    let alias = matches[1];
    yield this.fetchByAlias(alias, fresh);
  }
};

Repository.prototype.fetchByAlias = async function(alias, fresh) {
  let request = new Request(`./recipes/${alias}.json`);
  if (fresh) {
    request.headers.set('cache-control', 'no-cache');
  }

  let response = await fetch(request);
  if (!response.ok) {
    throw new Error(`failed to fetch recipe '${alias}'`);
  }

  let json = await response.json();
  json.alias = alias;

  return new Recipe(json);
};

