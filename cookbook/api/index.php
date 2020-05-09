<?php

set_error_handler(function($severity, $message, $file, $line) {
  throw new ErrorException($message, 0, $severity, $file, $line);
});

require('http.php');
require('handler.php');
require('repository.php');

$root = realpath(__DIR__.'/..');
$base = getenv('BASE');

$repository = new Persistence\Repository("{$root}/recipes");

$request = Http\newRequest();
$response = Http\newResponse();

$router = new Http\Router($base);
$router->add('GET', '/', Http\serveRedirect("{$base}/index.html"));

$router->add('POST', '/recipes', new Http\Handler\CreateDocument($repository));
$router->add('GET', '/recipes', new Http\Handler\ListDocuments($repository));
$router->add('GET', '/recipes/[a-z0-9-]+', new Http\Handler\FindDocument($repository));
$router->add('PUT', '/recipes/[a-z0-9-]+', new Http\Handler\SaveDocument($repository));
$router->add('DELETE', '/recipes/[a-z0-9-]+', new Http\Handler\DeleteDocument($repository));

foreach(array(
  '/icon.png',
  '/index.html',
  '/service-worker.js',
  '/manifest.webmanifest',

  '/app/dom.js',
  '/app/presenter.js',
  '/app/recipe.js',
  '/app/repository.js',
  '/app/router.js',
  '/app/search.js',
  '/app/views.js',

  '/app/styles.css',
) as $file) {
  $router->add('GET', $file, Http\serveFile("{$root}/{$file}"));
}

try {
  if (!$router->apply($request, $response)) {
    $response->setStatus(404);
  }
} catch (Exception $e) {
  $response->setStatus(500);
  $response->setBodyAsText($e->getMessage());
}

?>
