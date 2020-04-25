<?php

class ListDocuments implements HttpHandler {
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

class FindDocument implements HttpHandler {
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

class CreateDocument implements HttpHandler {
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

class SaveDocument implements HttpHandler {
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

class DeleteDocument implements HttpHandler {
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

class ServeRedirect implements HttpHandler {
  private $location;

  public function __construct($location) {
    $this->location = $location;
  }

  public function handle($request, $response) {
    $response->setStatus(301);
    $response->setHeader('Location', $this->location);
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
    $file = realpath($this->file);
    if (!file_exists($file)) {
      $response->setStatus(404);
      return false;
    }

    $ext = pathinfo($file, PATHINFO_EXTENSION);
    $mime = self::$types[$ext];

    $body = file_get_contents($file);

    $response->setStatus(200);
    $response->setHeader('Content-Type', $mime);
    $response->setBody($body);
    return true;
  }

}

?>
