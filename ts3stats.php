<?php

set_error_handler(function($severity, $message, $file, $line) {
  throw new ErrorException($message, 0, $severity, $file, $line);
});

require('api/io.php');
require('api/http.php');
require('api/ts3stats/command.php');
require('api/ts3stats/client.php');
require('api/ts3stats/handler.php');

$root = realpath(__DIR__);
$base = getenv('BASE');
$username = getenv('USERNAME');
$password = getenv('PASSWORD');

$client = new TS3\Client('127.0.0.1', 10011);

$session = new TS3\Session($client);
$session->use($username, $password, 1);

$request = Http\newRequest();
$response = Http\newResponse();

$router = new Http\Router($base);
$router->add('GET', '/', Http\serveRedirect("{$base}/index.html"));

$router->add('GET', '/api/ts3/info', new Http\Handler\ServerInfo($session));
$router->add('GET', '/api/ts3/clients', new Http\Handler\ListClients($session));

foreach(array(
  '/index.html' => 'app/ts3stats/index.html',

  '/app/dom.js' => 'app/dom.js',
  '/app/presenter.js' => 'app/ts3stats/presenter.js',
  '/app/client.js' => 'app/ts3stats/client.js',
  '/app/views.js' => 'app/ts3stats/views.js',

  '/app/styles.css' => 'app/ts3stats/styles.css',
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
