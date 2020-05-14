
self.oninstall = (event) => event.waitUntil(refreshAssets());
async function refreshAssets() {
  let cache = await caches.open('app');
  let resources = [
    '/',
    '/icon.png',
    '/index.html',
    '/service-worker.js',
    '/manifest.webmanifest',

    '/app/async.js',
    '/app/dom.js',
    '/app/presenter.js',
    '/app/repository.js',
    '/app/search.js',
    '/app/views.js',

    '/app/styles.css',
  ];

  for (let url of resources) {
    let request = new Request(url);
    let response = await fetch(request);
    await cache.put(request, response);
  }
}

self.onactivate = (event) => clients.claim();

self.onfetch = (event) => {
  if (event.request.method == 'GET') {
    event.respondWith(handleRequest(event));
  }
};

async function handleRequest({ request }) {
  let cache = await caches.open('app');
  let response = await cache.match(request);

  if (!response) {
    response = await fetch(request);
  }

  return response;
}

