<?php

set_error_handler(function($severity, $message, $file, $line) {
  throw new ErrorException($message, 0, $severity, $file, $line);
});

require('api/io.php');
require('api/log.php');
require('api/http.php');
require('api/wifi/hostapd.php');
require('api/wifi/handler.php');

$root = realpath(__DIR__);
$base = getenv('BASE');
$qrcode = getenv('QRCODE');
$iface = getenv('IFACE');

$hostapd = new Hostapd\Client($iface);

$rootLogger = Log\ConsoleLogger::for('RootLogger');
$httpLogger = Log\ConsoleLogger::for('HttpLogger');

$request = Http\newRequest();
$response = Http\newResponse();

$router = new Http\Router($base, $httpLogger);
$router->add('GET', '/', Http\serveRedirect("{$base}/index.html"));

$router->add('POST', '/api/wifi/enable', new Http\Handler\HostapdEnable($hostapd));
$router->add('POST', '/api/wifi/disable', new Http\Handler\HostapdDisable($hostapd));
$router->add('GET',  '/api/wifi/status', new Http\Handler\HostapdStatus($hostapd));
$router->add('GET',  '/api/wifi/stations', new Http\Handler\HostapdStations($hostapd));
$router->add('GET',  '/app/qrcode.png', Http\serveBase64Encoded($qrcode, 'image/png'));

foreach(array(
  '/index.html' => 'app/wifi/index.html',

  '/app/dom.js' => 'app/dom.js',
  '/app/presenter.js' => 'app/wifi/presenter.js',
  '/app/client.js' => 'app/wifi/client.js',
  '/app/views.js' => 'app/wifi/views.js',

  '/app/styles.css' => 'app/wifi/styles.css',
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
