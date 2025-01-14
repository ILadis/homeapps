
broker.listen(forward);
broker.start(true).then(started => { });

function forward(message) {
  broker.send(message);
}
