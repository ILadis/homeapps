<?php

set_error_handler(function($severity, $message, $file, $line) {
  throw new ErrorException($message, 0, $severity, $file, $line);
});

require('api/io.php');
require('api/http.php');
require('api/robo/miio.php');
require('api/robo/vacuum.php');
require('api/robo/handler.php');

$root = realpath(__DIR__);
$base = getenv('BASE');
$token = getenv('TOKEN');

$vacuum = new Devices\Vacuum('192.168.178.10', 54321, hex2bin($token));

$request = Http\newRequest();
$response = Http\newResponse();

$router = new Http\Router();
$router->add('GET', '/', Http\serveRedirect("{$base}/index.html"));

$router->add('POST',   '/api/vacuum/clean', new Http\Handler\VacuumClean($vacuum));
$router->add('POST',   '/api/vacuum/pause', new Http\Handler\VacuumPause($vacuum));
$router->add('POST',   '/api/vacuum/charge', new Http\Handler\VacuumCharge($vacuum));
$router->add('GET',    '/api/vacuum/status', new Http\Handler\VacuumStatus($vacuum));
$router->add('GET',    '/api/scanner/scan', new Http\Handler\ScanImage($scanner));

foreach(array(
  '/icon.png' => 'app/robo/icon.png',
  '/index.html' => 'app/robo/index.html',
  '/service-worker.js' => 'app/robo/service-worker.js',
  '/manifest.webmanifest' => 'app/robo/manifest.webmanifest',

  '/app/dom.js' => 'app/dom.js',
  '/app/router.js' => 'app/router.js',
  '/app/presenter.js' => 'app/robo/presenter.js',
  '/app/repository.js' => 'app/robo/client.js',
  '/app/views.js' => 'app/robo/views.js',

  '/app/styles.css' => 'app/robo/styles.css',
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
