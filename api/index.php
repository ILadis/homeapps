<?php

set_error_handler(function($severity, $message, $file, $line) {
  throw new ErrorException($message, 0, $severity, $file, $line);
});

require('io.php');
require('miio.php');
require('image.php');
require('http.php');
require('handler.php');
require('vacuum.php');
require('scanner.php');
require('document.php');
require('repository.php');

$root = realpath(__DIR__.'/..');
$base = getenv('BASE');
$token = getenv('TOKEN');

$db = new SQLite3('./db.sqlite');
$repository = Persistence\Repository::openNew($db);

$vacuum = new Devices\Vacuum('192.168.178.10', 54321, hex2bin($token));
$scanner = new Devices\Scanner('192.168.178.11', 54921);

$request = Http\newRequest();
$response = Http\newResponse();

$router = new Http\Router();
$router->add('GET', '/', Http\serveRedirect("{$base}/index.html"));

$router->add('POST',   '/api/vacuum/clean', new Http\Handler\VacuumClean($vacuum));
$router->add('POST',   '/api/vacuum/pause', new Http\Handler\VacuumPause($vacuum));
$router->add('POST',   '/api/vacuum/charge', new Http\Handler\VacuumCharge($vacuum));
$router->add('GET',    '/api/vacuum/status', new Http\Handler\VacuumStatus($vacuum));
$router->add('GET',    '/api/scanner/scan', new Http\Handler\ScanImage($scanner));

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
  '/icon.png',
  '/index.html',
  '/service-worker.js',
  '/manifest.webmanifest',

  '/app/async.js',
  '/app/dom.js',
  '/app/presenter.js',
  '/app/repository.js',
  '/app/router.js',
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
