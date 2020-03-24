<?php

require('http.php');
require('handler.php');
require('repository.php');

$repository = new Repository(__DIR__ . '/../recipes');

$request = new HttpRequest();
$response = new HttpResponse();

$router = new HttpRouter();

$router->add('GET', '/recipes', new ListRecipes($repository));
$router->add('GET', '/recipes/[a-z0-9-]+', new FindRecipe($repository));
$router->add('POST','/recipes', new CreateRecipe($repository));
$router->add('PUT', '/recipes/[a-z0-9-]+', new UpdateRecipe($repository));

if (!$router->apply($request, $response)) {
  return false;
}

$response->send();

?>
