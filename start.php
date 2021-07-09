<?php

set_error_handler(function($severity, $message, $file, $line) {
  throw new ErrorException($message, 0, $severity, $file, $line);
});

require('api/http.php');

$root = realpath(__DIR__);
$base = getenv('BASE');

$request = Http\newRequest();
$response = Http\newResponse();

$router = new Http\Router($base);
$router->add('GET', '/', Http\serveRedirect("{$base}/index.html"));

foreach(array(
  '/index.html' => 'app/start/index.html',
  '/service-worker.js' => 'app/start/service-worker.js',

  '/app/dom.js' => 'app/dom.js',
  '/app/router.js' => 'app/router.js',
  '/app/search.js' => 'app/search.js',
  '/app/storage.js' => 'app/storage.js',
  '/app/presenter.js' => 'app/start/presenter.js',
  '/app/repository.js' => 'app/start/repository.js',
  '/app/views.js' => 'app/start/views.js',

  '/app/styles.css' => 'app/start/styles.css',
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
