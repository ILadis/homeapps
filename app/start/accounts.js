
export function AccountsManager(storage) {
  this.storage = storage;
}

AccountsManager.tokenKey = 'user_token';
AccountsManager.nameKey = 'user_name';

AccountsManager.prototype.currentUser = function() {
  let token = this.storage.getItem(AccountsManager.tokenKey);
  let name = this.storage.getItem(AccountsManager.nameKey);

  if (!token || !name) {
    return false;
  }

  return { user, name };
}

AccountsManager.prototype.switchUser = function(user) {
  this.storage.setItem(AccountsManager.tokenKey, String(user.token));
  this.storage.setItem(AccountsManager.nameKey, String(user.name));
};

AccountsManager.prototype.listUsers = async function() {
  let self = this.currentUser();

  let request = new Request('/api/users', {
    method: 'GET'
  });

  let response = await fetch(request).catch(() => { ok: false });
  if (!response.ok) {
    return [self];
  }

  let users = await response.json();
  for (let user of users) {
    // check if current user exists?
  }

  return users;
};
