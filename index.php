<?php

require('api/http.php');
require('api/handler.php');

$request = new HttpRequest();
$response = new HttpResponse();

$router = new HttpRouter();
$router->add('GET', '/recipes', new ListRecipes());
$router->add('.*', '/api/.*', new ResponseStatus(403));

if (!$router->apply($request, $response)) {
  return false;
}

$response->send();

?>
