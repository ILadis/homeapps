<?php

require('http.php');
require('handler.php');

$request = new HttpRequest();
$response = new HttpResponse();

$router = new HttpRouter();
$router->add('GET', '/recipes', new ListRecipes());

if (!$router->apply($request, $response)) {
  return false;
}

$response->send();

?>
