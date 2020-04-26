<?php

require('http.php');
require('handler.php');
require('repository.php');

$root = realpath(__DIR__ . '/..');
$base = getenv('BASE');

$repository = new Repository("{$root}/recipes");

$request = new HttpRequest();
$response = new HttpResponse();

$router = new HttpRouter($base);

$router->add('GET', '/recipes', new ListDocuments($repository));
$router->add('GET', '/recipes/[a-z0-9-]+', new FindDocument($repository));
$router->add('POST', '/recipes', new CreateDocument($repository));
$router->add('PUT', '/recipes/[a-z0-9-]+', new SaveDocument($repository));
$router->add('DELETE', '/recipes/[a-z0-9-]+', new DeleteDocument($repository));

$router->add('GET', '/', new ServeRedirect("{$base}/index.html"));

foreach(array(
  '/icon.png',
  '/index.html',
  '/service-worker.js',
  '/manifest.webmanifest',

  '/app/presenter.js',
  '/app/recipe.js',
  '/app/repository.js',
  '/app/router.js',
  '/app/search.js',
  '/app/views.js',
  '/app/styles.css',
) as $file) {
  $router->add('GET', $file, new ServeFile("{$root}/{$file}"));
}

if (!$router->apply($request, $response)) {
  $response->setStatus(404);
}

$response->send();

?>
