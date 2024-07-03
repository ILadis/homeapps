<?php

set_error_handler(function($severity, $message, $file, $line) {
  throw new ErrorException($message, 0, $severity, $file, $line);
});

require('api/log.php');
require('api/http.php');
require('api/start/inspector.php');
require('api/start/repository.php');
require('api/start/handler.php');

$root = realpath(__DIR__);
$base = getenv('BASE');

$db = new SQLite3('db.sqlite');
$repository = Persistence\Repository::openNew($db);

$rootLogger = Log\ConsoleLogger::for('RootLogger');
$httpLogger = Log\ConsoleLogger::for('HttpLogger');

$request = Http\newRequest();
$response = Http\newResponse();

$router = new Http\Router($base, $httpLogger);
$router->add('GET',    '/', Http\serveRedirect("{$base}/index.html"));
$router->add('POST',   '/api/inspect', new Http\Handler\InspectPage());
$router->add('GET',    '/api/users', new Http\Handler\ListUsers($repository));
$router->add('POST',   '/api/users', new Http\Handler\CreateUser($repository));
$router->add('GET',    '/api/pages', new Http\Handler\ListPages($repository));
$router->add('PUT',    '/api/pages/[-_.~%a-zA-Z0-9]+', new Http\Handler\SavePage($repository));
$router->add('DELETE', '/api/pages/[-_.~%a-zA-Z0-9]+', new Http\Handler\DeletePage($repository));

foreach(array(
  '/index.html' => 'app/start/index.html',
  '/service-worker.js' => 'app/start/service-worker.js',

  '/app/dom.js' => 'app/dom.js',
  '/app/router.js' => 'app/router.js',
  '/app/search.js' => 'app/search.js',
  '/app/page.js' => 'app/start/page.js',
  '/app/accounts.js' => 'app/start/accounts.js',
  '/app/storage.js' => 'app/storage.js',
  '/app/presenter.js' => 'app/start/presenter.js',
  '/app/repository.js' => 'app/start/repository.js',
  '/app/syncmanager.js' => 'app/start/syncmanager.js',
  '/app/views.js' => 'app/start/views.js',

  '/app/styles.css' => 'app/start/styles.css',
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
