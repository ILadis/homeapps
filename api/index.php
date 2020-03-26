<?php

require('http.php');
require('handler.php');
require('repository.php');

$dir = dirname(__FILE__);
$base = getenv('BASE');

$repository = new Repository("{$dir}/../recipes");

$request = new HttpRequest();
$response = new HttpResponse();

$router = new HttpRouter($base);

$router->add('GET', '/recipes', new ListRecipes($repository));
$router->add('GET', '/recipes/[a-z0-9-]+', new FindRecipe($repository));
$router->add('POST', '/recipes', new CreateRecipe($repository));
$router->add('PUT', '/recipes/[a-z0-9-]+', new SaveRecipe($repository));
$router->add('DELETE', '/recipes/[a-z0-9-]+', new DeleteRecipe($repository));

foreach(array(
  '/' => '/index.html',
  '/index.html',
  '/service-worker.js',

  '/app/presenter.js',
  '/app/recipe.js',
  '/app/repository.js',
  '/app/router.js',
  '/app/search.js',
  '/app/views.js',

  '/assets/create.svg',
  '/assets/delete.svg',
  '/assets/done.svg',
  '/assets/edit.svg',
  '/assets/export.svg',
  '/assets/icon.png',
  '/assets/manifest.webmanifest',
  '/assets/refresh.svg',
  '/assets/styles.css',
) as $path => $file) {
  $path = is_string($path) ? $path : $file;
  $router->add('GET', $path, new ServeFile("{$dir}/..{$file}"));
}

if (!$router->apply($request, $response)) {
  $response->setStatus(404);
}

$response->send();

?>
