<?php

set_error_handler(function($severity, $message, $file, $line) {
  throw new ErrorException($message, 0, $severity, $file, $line);
});

require('api/io.php');
require('api/log.php');
require('api/rcon.php');
require('api/http.php');
require('api/mcstats/ping.php');
require('api/mcstats/handler.php');

$root = realpath(__DIR__);
$base = getenv('BASE');
$password = getenv('PASSWORD');

$client = new IO\Rcon\Client('127.0.0.1');
$ping = new Minecraft\Ping('127.0.0.1');

$session = new IO\Rcon\Session($client);
$session->use($password);

$rootLogger = Log\ConsoleLogger::for('RootLogger');
$httpLogger = Log\ConsoleLogger::for('HttpLogger');

$request = Http\newRequest();
$response = Http\newResponse();

$router = new Http\Router($base, $httpLogger );
$router->add('GET', '/', Http\serveRedirect("{$base}/index.html"));

$router->add('GET', '/api/mc/info', new Http\Handler\ServerInfo($session, $ping));
$router->add('GET', '/api/mc/players', new Http\Handler\ListPlayers($session));

foreach(array(
  '/index.html' => 'app/mcstats/index.html',

  '/app/dom.js' => 'app/dom.js',
  '/app/presenter.js' => 'app/mcstats/presenter.js',
  '/app/client.js' => 'app/mcstats/client.js',
  '/app/views.js' => 'app/mcstats/views.js',

  '/app/styles.css' => 'app/mcstats/styles.css',

  '/app/border.png' => 'app/mcstats/border.png',
  '/app/dirt.png' => 'app/mcstats/dirt.png',
  '/app/grass.png' => 'app/mcstats/grass.png',
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
