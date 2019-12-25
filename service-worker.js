
self.oninstall = (event) => event.waitUntil(refreshAssets());
async function refreshAssets() {
  let cache = await caches.open('cookbook');
  let resources = [
    './',
    './index.html',

    './app/client.js',
    './app/presenter.js',
    './app/recipe.js',
    './app/repository.js',
    './app/router.js',
    './app/search.js',
    './app/views.js',

    './assets/create.svg',
    './assets/done.svg',
    './assets/favicon.ico',
    './assets/icon.png',
    './assets/manifest.webmanifest',
    './assets/refresh.svg',
    './assets/styles.css'
  ];

  for (let url of resources) {
    let request = new Request(url);
    request.headers.set('cache-control', 'no-cache');

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

