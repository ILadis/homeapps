<?php

set_error_handler(function($severity, $message, $file, $line) {
  throw new ErrorException($message, 0, $severity, $file, $line);
});

require('api/http.php');
require('api/cookb/repository.php');
require('api/cookb/handler.php');

$root = realpath(__DIR__);
$base = getenv('BASE');

$repository = new Persistence\Repository("recipes");

$request = Http\newRequest();
$response = Http\newResponse();

$router = new Http\Router($base);
$router->add('GET', '/', Http\serveRedirect("{$base}/index.html"));

$router->add('POST',   '/recipes', new Http\Handler\CreateDocument($repository));
$router->add('GET',    '/recipes', new Http\Handler\ListDocuments($repository));
$router->add('GET',    '/recipes/[a-z0-9-]+', new Http\Handler\FindDocument($repository));
$router->add('PUT',    '/recipes/[a-z0-9-]+', new Http\Handler\SaveDocument($repository));
$router->add('DELETE', '/recipes/[a-z0-9-]+', new Http\Handler\DeleteDocument($repository));

foreach(array(
  '/icon.png' => 'app/cookb/icon.png',
  '/index.html' => 'app/cookb/index.html',
  '/service-worker.js' => 'app/cookb/service-worker.js',
  '/manifest.webmanifest' => 'app/cookb/manifest.webmanifest',

  '/app/dom.js' => 'app/dom.js',
  '/app/router.js' => 'app/router.js',
  '/app/search.js' => 'app/search.js',
  '/app/presenter.js' => 'app/cookb/presenter.js',
  '/app/repository.js' => 'app/cookb/repository.js',
  '/app/views.js' => 'app/cookb/views.js',
  '/app/recipe.js' => 'app/cookb/recipe.js',

  '/app/styles.css' => 'app/cookb/styles.css',
) as $path => $file) {
  $router->add('GET', $path, Http\serveFile("{$root}/{$file}"));
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
