
export function Principal(storage) {
  this.storage = storage;
  this.token = storage.getItem('token');
}

Principal.prototype.authenticated = function() {
  return this.token != null;
};

Principal.prototype.authenticate = function(request) {
  if (!this.token) return;
  request.headers.set('Authorization', 'Bearer ' + this.token);
};

Principal.prototype.login = async function(password) {
  let token = btoa(password);

  let request = new Request('./login', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + token
    }
  });

  let response = await fetch(request);
  if (response.ok) {
    this.token = token;
    this.storage.setItem('token', token);
    return true;
  }

  return false;
};

