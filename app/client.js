
import { Recipe } from './recipe.js';

const whiteList = new RegExp('^([a-z\\-]+)\\.json$');

export function Client() {
}

Client.prototype.fetchAll = async function*(fresh = false) {
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
}

Client.prototype.fetchByAlias = async function(alias, fresh) {
  let name = `${alias}.json`;
  let matches = name.match(whiteList);
  if (!matches) {
    throw new Error(`failed to fetch recipe '${alias}'`);
  }

  let request = new Request(`./recipes/${name}`);
  if (fresh) {
    request.headers.set('cache-control', 'no-cache');
  }

  let response = await fetch(request);
  if (!response.ok) {
    throw new Error(`failed to fetch recipe '${alias}'`);
  }

  let json = await response.json();
  return Recipe.fromJSON(json);
};
