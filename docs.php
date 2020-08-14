<?php

set_error_handler(function($severity, $message, $file, $line) {
  throw new ErrorException($message, 0, $severity, $file, $line);
});

require('api/io.php');
require('api/http.php');
require('api/docs/image.php');
require('api/docs/document.php');
require('api/docs/scanner.php');
require('api/docs/repository.php');
require('api/docs/handler.php');

$root = realpath(__DIR__);
$base = getenv('BASE');

$db = new SQLite3('db.sqlite');
$repository = Persistence\Repository::openNew($db);

$scanner = new Devices\Scanner('192.168.178.11', 54921);

$request = Http\newRequest();
$response = Http\newResponse();

$router = new Http\Router();
$router->add('GET', '/', Http\serveRedirect("{$base}/index.html"));

$router->add('POST',   '/api/inbox/scan', new Http\Handler\ScanToInbox($scanner, $repository));
$router->add('POST',   '/api/inbox/convert', new Http\Handler\ConvertInbox($repository));
$router->add('GET',    '/api/inbox/files', new Http\Handler\ListInbox($repository));
$router->add('DELETE', '/api/inbox/files', new Http\Handler\DeleteInbox($repository));

$router->add('POST',   '/api/files', new Http\Handler\UploadFile($repository));
$router->add('GET',    '/api/files', new Http\Handler\ListFiles($repository));
$router->add('POST',   '/api/files/[a-z0-9-]+', new Http\Handler\SaveFile($repository));
$router->add('GET',    '/api/files/[a-z0-9-]+', new Http\Handler\FindFile($repository));
$router->add('DELETE', '/api/files/[a-z0-9-]+', new Http\Handler\DeleteFile($repository));
$router->add('POST',   '/api/files/[a-z0-9-]+/tags', new Http\Handler\AddTag($repository));
$router->add('GET',    '/api/files/[a-z0-9-]+/raw', new Http\Handler\RawFile($repository));

foreach(array(
  '/icon.png' => 'app/docs/icon.png',
  '/index.html' => 'app/docs/index.html',
  '/service-worker.js' => 'app/docs/service-worker.js',
  '/manifest.webmanifest' => 'app/docs/manifest.webmanifest',

  '/app/async.js' => 'app/async.js',
  '/app/dom.js' => 'app/dom.js',
  '/app/router.js' => 'app/router.js',
  '/app/search.js' => 'app/search.js',
  '/app/presenter.js' => 'app/docs/presenter.js',
  '/app/repository.js' => 'app/docs/repository.js',
  '/app/views.js' => 'app/docs/views.js',

  '/app/styles.css' => 'app/docs/styles.css',
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
