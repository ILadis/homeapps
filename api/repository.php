<?php

class Repository {
  private $dir;

  public function __construct($dir) {
    $this->dir = $dir;
  }

  public function listAll() {
    $dir = new DirectoryIterator($this->dir);

    foreach ($dir as $file) {
      if ($file->isFile()) {
        $pathname = $file->getPathname();
        yield Document::from($pathname);
      }
    }
  }

  public function findById($id) {
    $documents = $this->listAll();

    foreach ($documents as $document) {
      if ($document->id() === $id) {
        return $document;
      }
    }

    return false;
  }

  public function createNew($id = null) {
    return Document::create($this->dir, $id);
  }
}

class Document {

  public static function from($file) {
    return new Document($file);
  }

  public static function create($dir, $id = null) {
    do {
      $id = $id ?: bin2hex(random_bytes(16));
      $file = "{$dir}/{$id}.json";
    } while (file_exists($file));
    return new Document($file);
  }

  private $file;

  private function __construct($file) {
    $this->file = $file;
  }

  public function id() {
    return basename($this->file, '.json');
  }

  public function get() {
    $value = file_get_contents($this->file);
    $value = (object) json_decode($value, true);
    $value->id = $this->id();
    return $value;
  }

  public function put($value) {
    $value->id = $this->id();
    $value = json_encode($value);
    file_put_contents($this->file, $value);
  }

  public function delete() {
    unlink($this->file);
  }
}

namespace Http\Handler;
use Http\Handler as HttpHandler;

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

?>
