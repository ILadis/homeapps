<?php

set_error_handler(function($severity, $message, $file, $line) {
  throw new ErrorException($message, 0, $severity, $file, $line);
});

require('api/log.php');
require('api/http.php');
require('api/cookb/repository.php');
require('api/cookb/handler.php');
require('api/cookb/recipes.php');

$root = realpath(__DIR__);
$base = getenv('BASE');
$password = getenv('PASSWORD');

$repository = new Persistence\Repository('recipes');

$rootLogger = Log\ConsoleLogger::for('RootLogger');
$httpLogger = Log\ConsoleLogger::for('HttpLogger');

$request = Http\newRequest();
$response = Http\newResponse();

$router = new Http\Router($base, $httpLogger);
$router->add('GET', '/', Http\serveRedirect("{$base}/index.html"));

$router->add('POST',   '/login', $login = new Http\Handler\Login($password));
$router->add('POST',   '/recipes/retrieve', new Http\Handler\Retriever());
$router->add('POST',   '/recipes', $login->guard(new Http\Handler\CreateDocument($repository)));
$router->add('GET',    '/recipes', new Http\Handler\ListDocuments($repository));
$router->add('GET',    '/recipes/[a-z0-9-]+', new Http\Handler\FindDocument($repository));
$router->add('PUT',    '/recipes/[a-z0-9-]+', $login->guard(new Http\Handler\SaveDocument($repository)));
$router->add('DELETE', '/recipes/[a-z0-9-]+', $login->guard(new Http\Handler\DeleteDocument($repository)));

foreach(array(
  '/icon.png' => 'app/cookb/icon.png',
  '/index.html' => 'app/cookb/index.html',
  '/service-worker.js' => 'app/cookb/service-worker.js',
  '/manifest.webmanifest' => 'app/cookb/manifest.webmanifest',

  '/app/dom.js' => 'app/dom.js',
  '/app/router.js' => 'app/router.js',
  '/app/search.js' => 'app/search.js',
  '/app/storage.js' => 'app/storage.js',
  '/app/presenter.js' => 'app/cookb/presenter.js',
  '/app/principal.js' => 'app/cookb/principal.js',
  '/app/repository.js' => 'app/cookb/repository.js',
  '/app/views.js' => 'app/cookb/views.js',
  '/app/recipe.js' => 'app/cookb/recipe.js',

  '/app/styles.css' => 'app/cookb/styles.css',
) as $path => $file) {
  $router->add('GET', $path, Http\serveFile("{$root}/{$file}"));
}

foreach(array(
  '/app/custom-elements.js' => ['https://unpkg.com/@ungap/custom-elements@1.3.0/min.js', 'cc14433db77c53e92706d93a0c8e3df870d9826c6c334044c9fe976c2726cb22'],
) as $path => list($url, $hash)) {
  $router->add('GET', $path, Http\serveUrl($url, $hash));
}

try {
  if (!$router->apply($request, $response)) {
    $response->setStatus(404);
  }
} catch (Throwable $e) {
  $rootLogger->error('uncaught {exception}', ['exception' => $e]);
  $response->setStatus(500);
  $response->setBodyAsText($e->getMessage());
}

?>
