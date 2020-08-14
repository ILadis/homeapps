
export function Client() {
}

Client.prototype.charge = async function() {
  let request = new Request(`./api/vacuum/charge`, {
    method: 'POST'
  });

  let response = await fetch(request);
  if (!response.ok) {
    throw new Error('failed to send charge command');
  }
};

