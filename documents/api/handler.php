<?php
namespace Http\Handler;
use Http, Image, Document;

class VacuumClean implements Http\Handler {
  private $vacuum;

  public function __construct($vacuum) {
    $this->vacuum = $vacuum;
  }

  public function handle($request, $response) {
    $segments = $request->getBodyAsJson();
    if (is_array($segments)) {
      $segments = array_map('intval', $segments);
    }

    $this->vacuum->clean($segments);
    $response->setStatus(200);
    return true;
  }
}

class VacuumPause implements Http\Handler {
  private $vacuum;

  public function __construct($vacuum) {
    $this->vacuum = $vacuum;
  }

  public function handle($request, $response) {
    $this->vacuum->pause();
    $response->setStatus(200);
    return true;
  }
}

class VacuumCharge implements Http\Handler {
  private $vacuum;

  public function __construct($vacuum) {
    $this->vacuum = $vacuum;
  }

  public function handle($request, $response) {
    $this->vacuum->charge();
    $response->setStatus(200);
    return true;
  }
}

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

    $file = [
      'name' => rawurldecode($name),
      'mime' => $mime,
      'size' => $size
    ];

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
    $file = $request->getBodyAsJson();
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
    $files = iterator_to_array($this->repository->listFiles());

    $response->setStatus(200);
    $response->setBodyAsJson($files);
    return true;
  }
}

class FindFile implements Http\Handler {
  private $repository;

  public function __construct($repository) {
    $this->repository = $repository;
  }

  public function handle($request, $response) {
    $id = basename($request->getUri()->getPath());
    $file = $this->repository->findFileById($id);

    if (!$file) {
      $response->setStatus(404);
      return false;
    }

    $response->setStatus(200);
    $response->setBodyAsJson($file);
    return true;
  }
}

class RawFile implements Http\Handler {
  private $repository;

  public function __construct($repository) {
    $this->repository = $repository;
  }

  public function handle($request, $response) {
    $id = basename(dirname($request->getUri()->getPath()));
    $file = $this->repository->findFileById($id);

    if (!$file) {
      $response->setStatus(404);
      return false;
    }

    $name = rawurlencode($file['name']);
    $data = $this->repository->fetchData($file);

    $response->setStatus(200);
    $response->setHeader('Content-Type', $file['mime']);
    $response->setHeader('Content-Length', $file['size']);
    $response->setHeader('Content-Disposition', "attachment; filename*=UTF-8''{$name}");
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
    $id = basename($request->getUri()->getPath());
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
    $id = basename(dirname($request->getUri()->getPath()));
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
  private $scanner, $repository;

  public function __construct($scanner, $repository) {
    $this->scanner = $scanner;
    $this->repository = $repository;
  }

  public function handle($request, $response) {
    $this->scan($image);
    $this->enhance($image, $size);

    $file = [
      'name' => 'scan.jpg',
      'mime' => 'image/jpeg',
      'size' => $size
    ];

    $this->repository->uploadFile($file, $image, true);
    // TODO introduce file properties and store image width/height there?

    $response->setStatus(200);
    $response->setBodyAsJson($file);
    return true;
  }

  private function scan(&$image) {
    $image = tmpfile();
    $this->scanner->scan($image);
    fseek($image, 0);
  }

  private function enhance($image, &$size) {
    Image\pipe(
      Image\read($image),
      Image\crop(183188194, 20),
      Image\scale(0.3),
      Image\write($image, true)
    )();

    $size = ftell($image);
    fseek($image, 0);
    ftruncate($image, $size);
  }
}

class ListInbox implements Http\Handler {
  private $repository;

  public function __construct($repository) {
    $this->repository = $repository;
  }

  public function handle($request, $response) {
    $files = iterator_to_array($this->repository->findFilesInInbox());

    $response->setBodyAsJson($files);
    $response->setStatus(200);
    return true;
  }
}

class ConvertInbox implements Http\Handler {
  private $repository;

  public function __construct($repository) {
    $this->repository = $repository;
  }

  public function handle($request, $response) {
    $this->convert($document, $size);

    $file = [
      'name' => 'scan.pdf',
      'mime' => 'application/pdf',
      'size' => $size
    ];

    $this->repository->uploadFile($file, $document);

    $response->setStatus(200);
    $response->setBodyAsJson($file);
    return true;
  }

  private function convert(&$document, &$size) {
    $files = $this->repository->findFilesInInbox();
    $builder = new Document\Builder();

    foreach ($files as $file) {
      if ($file['mime'] != 'image/jpeg') {
        continue;
      }

      $data = $this->repository->fetchData($file);
      // TODO determine actual image width/height
      $image = Document\newImage($data, 2480, 3508);
      $builder->nextPage()->useImage($image);
    }

    $document = tmpfile();

    $writer = new Document\Writer($document);
    $writer->write($builder->build());

    $size = ftell($document);
    fseek($document, 0);
  }
}

class DeleteInbox implements Http\Handler {
  private $repository;

  public function __construct($repository) {
    $this->repository = $repository;
  }

  public function handle($request, $response) {
    $this->repository->deleteFilesInInbox();

    $response->setStatus(204);
    return true;
  }
}

?>
