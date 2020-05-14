<?php
namespace Http\Handler;
use Http, Persistence;

class UploadFile implements Http\Handler {
  private $repository;

  public function __construct($repository) {
    $this->repository = $repository;
  }

  public function handle($request, $response) {
    $name = $request->getHeader('X-Filename');
    $mime = $request->getHeader('Content-Type', 'application/octet-stream');
    $size = $request->getHeader('Content-Length');
    $data = $request->getBody();

    $file = new Persistence\File([
      'name' => rawurldecode($name),
      'mime' => $mime,
      'size' => $size
    ]);

    $this->repository->uploadFile($file, $data);

    $response->setStatus(200);
    $response->setBodyAsJson($file);
    return true;
  }
}

class SaveFile implements Http\Handler {
  private $repository;

  public function __construct($repository) {
    $this->repository = $repository;
  }

  public function handle($request, $response) {
    $data = $request->getBodyAsJson();
    $file = new Persistence\File((array) $data);

    $saved = $this->repository->saveFile($file);
    if (!$saved) {
      $response->setStatus(404);
      return false;
    }

    $response->setStatus(200);
    $response->setBodyAsJson($file);
    return true;
  }
}

class ListFiles implements Http\Handler {
  private $repository;

  public function __construct($repository) {
    $this->repository = $repository;
  }

  public function handle($request, $response) {
    $list = array();
    $files = $this->repository->listFiles();

    foreach ($files as $file) {
      $list[] = $file;
    }

    $response->setStatus(200);
    $response->setBodyAsJson($list);
    return true;
  }
}

class RawFile implements Http\Handler {
  private $repository;

  public function __construct($repository) {
    $this->repository = $repository;
  }

  public function handle($request, $response) {
    $id = basename(dirname($request->getPath()));
    $file = $this->repository->findFileById($id);

    if (!$file) {
      $response->setStatus(404);
      return false;
    }

    $data = $this->repository->fetchData($file);

    $response->setStatus(200);
    $response->setHeader('Content-Type', $file->mime);
    $response->setHeader('Content-Length', $file->size);
    $response->setHeader('Content-Disposition', 'attachment; filename="'.$file->name.'"');
    stream_copy_to_stream($data, $response->getBody());
    return true;
  }
}

class DeleteFile implements Http\Handler {
  private $repository;

  public function __construct($repository) {
    $this->repository = $repository;
  }

  public function handle($request, $response) {
    $id = basename($request->getPath());
    $deleted = $this->repository->deleteFileById($id);

    if (!$deleted) {
      $response->setStatus(404);
      return false;
    }

    $response->setStatus(204);
    return true;
  }
}

class AddTag implements Http\Handler {
  private $repository;

  public function __construct($repository) {
    $this->repository = $repository;
  }

  public function handle($request, $response) {
    $id = basename(dirname($request->getPath()));
    $file = $this->repository->findFileById($id);

    if (!$file) {
      $response->setStatus(404);
      return false;
    }

    $tag = $request->getBodyAsText();
    $this->repository->addTag($file, $tag);

    $response->setStatus(200);
    return true;
  }
}

class ScanImage implements Http\Handler {
  private $scanner;

  public function __construct($scanner) {
    $this->scanner = $scanner;
  }

  public function handle($request, $response) {
    $response->setHeader('Content-Type', 'image/jpeg');
    $response->setStatus(200);

    $body = $response->getBody();
    $this->scanner->scan($body);

    return true;
  }
}

?>
