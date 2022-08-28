#!/usr/bin/env php
<?php

set_error_handler(function($severity, $message, $file, $line) {
  throw new ErrorException($message, 0, $severity, $file, $line);
});

require('api/scraper.php');
require('api/refuel/scraper.php');

function main($argv, $argc) {
  $scraper = Fuel\WebScraper::loadWithId($argv[1]);
 
  $prices = $scraper->getPrices();
  foreach ($prices as $price) {
    echo("{$price['name']}: {$price['value']}\n");
  }
 
  exit(0);
}

main($argv, $argc);

?>