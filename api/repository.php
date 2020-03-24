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

  public function createNew() {
    return Document::create($this->dir);
  }
}

class Document {

  public static function from($file) {
    return new Document($file);
  }

  public static function create($dir) {
    do {
      $file = $dir .'/' . uniqid() . '.json';
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
    return json_decode(file_get_contents($this->file), true);
  }

  public function put($value) {
    file_put_contents($this->file, json_encode($value));
  }
}
