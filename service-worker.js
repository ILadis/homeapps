
self.oninstall = (event) => event.waitUntil(refreshAssets());
async function refreshAssets() {
  let cache = await caches.open('cookbook');
  let resources = [
    './',
    './index.html',
    './assets/favicon.ico',
    './assets/styles.css',
    './assets/refresh.svg',
    './assets/manifest.webmanifest',
    './app/presenter.js',
    './app/repository.js',
    './app/views.js'
  ];

  for (let url of resources) {
    let request = new Request(url);
    let response = await fetch(request);
    await cache.put(request, response);
  }
}

self.onactivate = (event) => clients.claim();

self.onfetch = (event) => event.respondWith(handleRequest(event));
async function handleRequest({ request }) {
  let cache = await caches.open('cookbook');
  let response = await cache.match(request);

  let headers = request.headers;
  if (!response || headers.get('cache-control') == 'no-cache') {
    response = await fetch(request);
    cache.put(request, response.clone());
  }

  return response;
};

