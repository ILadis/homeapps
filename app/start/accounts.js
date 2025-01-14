
export function AccountsManager(storage) {
  this.storage = storage;
  this.users = undefined;
}

AccountsManager.tokenKey = 'user_token';
AccountsManager.nameKey = 'user_name';

AccountsManager.prototype.createUser = async function(name) {
  let request = new Request('./api/users', {
    method: 'POST', body: name
  });

  let response = await fetch(request);
  if (!response.ok) {
    throw response;
  }

  let user = await response.json();

  let users = await this.listUsers();
  users.push(user);

  return user;
};

AccountsManager.prototype.currentUser = function() {
  let token = this.storage.getItem(AccountsManager.tokenKey);
  let name = this.storage.getItem(AccountsManager.nameKey);

  if (!token || !name) {
    return false;
  }

  return { token, name };
};

AccountsManager.prototype.findUser = async function(token) {
  let users = await this.listUsers();
  return users.find(user => user.token == token);
};

AccountsManager.prototype.switchUser = function(user) {
  this.storage.setItem(AccountsManager.tokenKey, String(user.token));
  this.storage.setItem(AccountsManager.nameKey, String(user.name));
};

AccountsManager.prototype.listUsers = async function() {
  if (this.users) return this.users;
  this.users = new Array();

  let self = this.currentUser();
  if (self) this.users.push(self);

  let request = new Request('./api/users', {
    method: 'GET'
  });

  let response = await fetch(request).catch(() => { ok: false });
  if (!response.ok) {
    return this.users;
  }

  let users = await response.json();
  for (let user of users) {
    if (self?.token != user?.token) {
      this.users.push(user);
    }
  }

  return this.users;
};
