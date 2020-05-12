<?php

set_error_handler(function($severity, $message, $file, $line) {
  throw new ErrorException($message, 0, $severity, $file, $line);
});

require('http.php');
require('handler.php');
require('repository.php');
require('devices.php');

$root = realpath(__DIR__.'/..');
$base = getenv('BASE');

$db = new SQLite3('./db.sqlite');
$repository = Persistence\Repository::openNew($db);

$scanner = new Devices\Scanner('192.168.178.11', '54921');

$request = Http\newRequest();
$response = Http\newResponse();

$router = new Http\Router();
$router->add('GET', '/', Http\serveRedirect("{$base}/index.html"));

$router->add('POST', '/api/files', new Http\Handler\UploadFile($repository));
$router->add('GET',  '/api/files', new Http\Handler\ListFiles($repository));
$router->add('POST', '/api/files/[a-z0-9-]+', new Http\Handler\SaveFile($repository));
$router->add('DELETE', '/api/files/[a-z0-9-]+', new Http\Handler\DeleteFile($repository));
$router->add('POST', '/api/files/[a-z0-9-]+/tags', new Http\Handler\AddTag($repository));
$router->add('GET',  '/api/files/[a-z0-9-]+/raw', new Http\Handler\RawFile($repository));

$router->add('POST', '/api/scan', new Http\Handler\ScanImage($scanner, $repository));

foreach(array(
  '/index.html',

  '/app/async.js',
  '/app/dom.js',
  '/app/presenter.js',
  '/app/repository.js',
  '/app/search.js',
  '/app/views.js',

  '/app/styles.css',
) as $file) {
  $router->add('GET', $file, Http\serveFile("{$root}/{$file}"));
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
