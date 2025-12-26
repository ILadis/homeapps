<?php

set_error_handler(function($severity, $message, $file, $line) {
  throw new ErrorException($message, 0, $severity, $file, $line);
});

require('api/log.php');
require('api/http.php');

$root = realpath(__DIR__);
$base = getenv('BASE');

$rootLogger = Log\ConsoleLogger::for('RootLogger');
$httpLogger = Log\ConsoleLogger::for('HttpLogger');

$request = Http\newRequest();
$response = Http\newResponse();

$router = new Http\Router($base, $httpLogger);
$router->add('GET', '/', Http\serveRedirect("{$base}/index.html"));

foreach(array(
  '/index.html' => 'app/charts/index.html',
  '/app/styles.css' => 'app/charts/styles.css',

  '/app/dom.js' => 'app/dom.js',
  '/app/chart.js' => 'app/charts/chart.js',
) as $path => $file) {
  $router->add('GET', $path, Http\serveFile("{$root}/{$file}"));
}

$date = new DateTime();
$date->modify('-1 week');
$date->setTime(0, 0);
$after = $date->format('Y-m-d\TH:i:s');

foreach(array(
  '/api/metrics/1' => ["http://raspberry.home/zigpied/metrics?metric=temperature.measured_value&address=54:ef:44:10:00:ee:16:c6&after={$after}", false],
  '/api/metrics/2' => ["http://raspberry.home/zigpied/metrics?metric=temperature.measured_value&address=54:ef:44:10:00:ed:fd:04&after={$after}", false],

  '/api/metrics/3' => ["http://raspberry.home/zigpied/metrics?metric=humidity.measured_value&address=54:ef:44:10:00:ee:16:c6&after={$after}", false],
  '/api/metrics/4' => ["http://raspberry.home/zigpied/metrics?metric=humidity.measured_value&address=54:ef:44:10:00:ed:fd:04&after={$after}", false],

  '/app/vendor/chart.js'  => ['https://unpkg.com/chart.js@4.5.1/dist/chart.umd.min.js', '48444a82d4edcb5bec0f1965faacdde18d9c17db3063d042abada2f705c9f54a'],
  '/app/vendor/moment.js' => ['https://unpkg.com/moment@2.30.1/min/moment.min.js', '845c524969edd5b3af9aa6d8718d29fe92e8dbe25b955214a8e064a05a9a5027'],
  '/app/vendor/hammer.js' => ['https://unpkg.com/hammerjs@2.0.8/hammer.min.js', '7953631f0e54794d2352a3cfa591c0914d73e14f90141058e3cf16bee7939bcf'],
  '/app/vendor/chartjs-adapter-moment.js' => ['https://unpkg.com/chartjs-adapter-moment@1.0.1/dist/chartjs-adapter-moment.min.js', '4ca6ddbc16c438c7decc60f16fbee9639d37277af609390f7794eb2729addb55'],
  '/app/vendor/chartjs-plugin-zoom.js'    => ['https://unpkg.com/chartjs-plugin-zoom@2.2.0/dist/chartjs-plugin-zoom.min.js', 'e4a088e5bab93be6ee47c939eeb9ebaa80e0b39156d4bdfd1af9c844be81b6c4'],
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
