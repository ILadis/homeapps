<?php

class ListRecipes implements HttpHandler {
  private $repository;

  public function __construct($repository) {
    $this->repository = $repository;
  }

  public function handle($request, $response) {
    $list = array();
    $documents = $this->repository->listAll();

    foreach ($documents as $document) {
      $json = $document->get();
      $uri = $request->getPath() . '/' . $document->id();

      $files[] = [
        'name' => $json['name'],
        'uri' => $uri
      ];
    }

    $response->setStatus(200);
    $response->setBodyAsJson($files);

    return true;
  }
}

class FindRecipe implements HttpHandler {
  private $repository;

  public function __construct($repository) {
    $this->repository = $repository;
  }

  public function handle($request, $response) {
    $id = basename($request->getPath());
    $document = $this->repository->findById($id);

    if (!$document) {
      $response->setStatus(404);
      return false;
    }

    $json = $document->get();

    $response->setStatus(200);
    $response->setBodyAsJson($json);

    return true;
  }
}

class CreateRecipe implements HttpHandler {
  private $repository;

  public function __construct($repository) {
    $this->repository = $repository;
  }

  public function handle($request, $response) {
    $json = $request->getBodyAsJson();
    if (!$json) {
      $response->setStatus(415);
      return false;
    }

    $document = $this->repository->createNew();
    $document->put($json);

    $uri = $request->getPath() . '/' . $document->id();

    $response->setStatus(201);
    $response->setHeader('Location', $uri);
    $response->setBodyAsJson($json);

    return true;
  }
}

class UpdateRecipe implements HttpHandler {
  private $repository;

  public function __construct($repository) {
    $this->repository = $repository;
  }

  public function handle($request, $response) {
    $json = $request->getBodyAsJson();
    if (!$json) {
      $response->setStatus(415);
      return false;
    }

    $id = basename($request->getPath());
    $document = $this->repository->findById($id);

    if (!$document) {
      $response->setStatus(404);
      return false;
    }

    $document->put($json);

    $response->setStatus(200);
    $response->setBodyAsJson($json);

    return true;
  }
}

?>
