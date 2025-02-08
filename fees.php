<?php

set_error_handler(function($severity, $message, $file, $line) {
  throw new ErrorException($message, 0, $severity, $file, $line);
});

require('api/log.php');
require('api/http.php');
require('api/csv.php');
require('api/fees/entity.php');
require('api/fees/repository.php');
require('api/fees/handler.php');

$root = realpath(__DIR__);
$base = getenv('BASE');

$repository = Persistence\Repository::open('data.csv', array(
  'id' => 'Nr',
  'surname'     => 'Name',
  'firstname'   => 'Vorname',
  'dateOfBirth' => 'Geburtstag',
  'memberSince' => 'Eintritt',
  'memberUntil' => 'Austritt',
  'street'  => 'Straße',
  'zipCode' => 'PLZ',
  'city'    => 'Stadt',
  'phone'  => 'Telefon',
  'mobile' => 'Mobil',
  'email'  => 'E-Mail',
  'tariff' => 'Beitrag',
  'accountIban'   => 'IBAN',
  'accountHolder' => 'Kontoinhaber'));

$rootLogger = Log\ConsoleLogger::for('RootLogger');
$httpLogger = Log\ConsoleLogger::for('HttpLogger');

$request = Http\newRequest();
$response = Http\newResponse();

$router = new Http\Router($base, $httpLogger);
$router->add('GET',  '/api/members', new Http\Handler\ListMembers($repository));
$router->add('GET',  '/api/members/[A-Za-z0-9-]+', new Http\Handler\ShowMember($repository));
$router->add('POST', '/api/members/export', new Http\Handler\ExportMembers($repository));

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
