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
      $files[] = ['id' => $document->id()];
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
    $response->setBodyAsJson($json);

    return true;
  }
}

class SaveRecipe implements HttpHandler {
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
    $response->setBodyAsJson($json);

    return true;
  }
}

class DeleteRecipe implements HttpHandler {
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

class ServeFile implements HttpHandler {
  private $file;
  private static $types = array(
    'html' => 'text/html',
    'css'  => 'text/css',
    'js'   => 'text/javascript',
    'svg'  => 'image/svg+xml',
    'png'  => 'image/png',
    'json' => 'application/json',
    'webmanifest' => 'application/manifest+json',
  );

  public function __construct($file) {
    $this->file = $file;
  }

  public function handle($request, $response) {
    if (!file_exists($this->file)) {
      $response->setStatus(404);
      return false;
    }

    $ext = pathinfo($this->file, PATHINFO_EXTENSION);
    $mime = self::$types[$ext];

    $body = file_get_contents($this->file);

    $response->setStatus(200);
    $response->setHeader('Content-Type', $mime);
    $response->setBody($body);
    return true;
  }

}

?>
