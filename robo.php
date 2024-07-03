<?php

set_error_handler(function($severity, $message, $file, $line) {
  throw new ErrorException($message, 0, $severity, $file, $line);
});

require('api/io.php');
require('api/log.php');
require('api/miio.php');
require('api/http.php');
require('api/robo/vacuum.php');
require('api/robo/handler.php');

$root = realpath(__DIR__);
$base = getenv('BASE');
$token = getenv('TOKEN');
$host = getenv('DEVICE');

$vacuum = new Devices\Vacuum($host, 54321, hex2bin($token));

$rootLogger = Log\ConsoleLogger::for('RootLogger');
$httpLogger = Log\ConsoleLogger::for('HttpLogger');

$request = Http\newRequest();
$response = Http\newResponse();

$router = new Http\Router($base, $httpLogger);
$router->add('GET', '/', Http\serveRedirect("{$base}/index.html"));

$router->add('POST', '/api/vacuum/clean/segment', new Http\Handler\VacuumSegmentClean($vacuum));
$router->add('POST', '/api/vacuum/clean/zone', new Http\Handler\VacuumZoneClean($vacuum));
$router->add('POST', '/api/vacuum/pause', new Http\Handler\VacuumPause($vacuum));
$router->add('POST', '/api/vacuum/resume', new Http\Handler\VacuumResume($vacuum));
$router->add('POST', '/api/vacuum/charge', new Http\Handler\VacuumCharge($vacuum));
$router->add('GET',  '/api/vacuum/status', new Http\Handler\VacuumStatus($vacuum));

foreach(array(
  '/icon.png' => 'app/robo/icon.png',
  '/index.html' => 'app/robo/index.html',
  '/service-worker.js' => 'app/robo/service-worker.js',
  '/manifest.webmanifest' => 'app/robo/manifest.webmanifest',

  '/app/dom.js' => 'app/dom.js',
  '/app/presenter.js' => 'app/robo/presenter.js',
  '/app/client.js' => 'app/robo/client.js',
  '/app/views.js' => 'app/robo/views.js',

  '/app/styles.css' => 'app/robo/styles.css',
) as $path => $file) {
  $router->add('GET', $path, Http\serveFile("{$root}/{$file}"));
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
