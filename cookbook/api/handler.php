<?php
namespace Http\Handler;
use Http, Persistence;

class CreateDocument implements Http\Handler {
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

    $uri = $request->getPath() .'/'. $document->id();

    $response->setStatus(201);
    $response->setBodyAsJson($document);

    return true;
  }
}

class ListDocuments implements Http\Handler {
  private $repository;

  public function __construct($repository) {
    $this->repository = $repository;
  }

  public function handle($request, $response) {
    $json = array();
    $documents = $this->repository->listAll();

    foreach ($documents as $document) {
      $json[] = ['id' => $document->id()];
    }

    $response->setStatus(200);
    $response->setBodyAsJson($json);

    return true;
  }
}

class FindDocument implements Http\Handler {
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

    $response->setStatus(200);
    $response->setBodyAsJson($document);

    return true;
  }
}

class SaveDocument implements Http\Handler {
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
      $document = $this->repository->createNew($id);
    }

    $document->put($json);

    $response->setStatus(200);
    $response->setBodyAsJson($document);

    return true;
  }
}

class DeleteDocument implements Http\Handler {
  private $repository;

  public function __construct($repository) {
    $this->repository = $repository;
  }

  public function handle($request, $response) {
    $id = basename($request->getPath());
    $document = $this->repository->findById($id);

    if ($document) {
      $document->delete();
    }

    $response->setStatus(204);
    return true;
  }
}

?>
