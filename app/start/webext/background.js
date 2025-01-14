
broker.listen(handleMessage);
broker.start().then(started => { });

browser.tabs.onRemoved.addListener(id => updateHandler(id, true));
browser.tabs.onUpdated.addListener(id => updateHandler(id));
browser.tabs.onCreated.addListener(id => updateHandler(id, false));
browser.tabs.onMoved.addListener(id => updateHandler(id));

function handleMessage(message) {
  if ('ping' in message) {
    broker.send({ 'pong': true });
    window.setTimeout(updateHandler, 100);
  }
}

async function updateHandler(id, removed) {
  const tabs = await browser.tabs.query({});
  const pages = [];

  tabs.sort((tab, other) => tab.index - other.index);

  for (const tab of tabs) {
    if (removed && tab.id === id) {
      // removed events fire too early, see:
      // https://bugzilla.mozilla.org/show_bug.cgi?id=1396758
      continue;
    }

    pages.push({
      id: tab.id,
      title: tab.title,
      url: tab.url,
    });
  }

  broker.send({ pages });
}
