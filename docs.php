<?php

set_error_handler(function($severity, $message, $file, $line) {
  throw new ErrorException($message, 0, $severity, $file, $line);
});

require('api/io.php');
require('api/log.php');
require('api/http.php');
require('api/docs/image.php');
require('api/docs/document.php');
require('api/docs/scanner.php');
require('api/docs/repository.php');
require('api/docs/handler.php');

$root = realpath(__DIR__);
$base = getenv('BASE');
$host = getenv('DEVICE');

$db = new SQLite3('db.sqlite');
$repository = Persistence\Repository::open($db);
$scanner = new Devices\Scanner($host, 54921);

$rootLogger = Log\ConsoleLogger::for('RootLogger');
$httpLogger = Log\ConsoleLogger::for('HttpLogger');

$request = Http\newRequest();
$response = Http\newResponse();

$router = new Http\Router($base, $httpLogger);
$router->add('GET', '/', Http\serveRedirect("{$base}/index.html"));

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

foreach(array(
  '/app/pdf.js' => ['https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js', '1fc294eefda602e591a06c1d5af361cae23756b5a334fc2421d5f9accce038e5'],
  '/app/pdf.worker.js' => ['https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js', '99732130603cd4980f009a29a38a86373b43ffb9ae22c35ec85440f311ceddfc'],
) as $path => list($url, $hash)) {
  $router->add('GET', $path, Http\serveUrl($url, $hash));
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
