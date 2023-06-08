<?php
namespace Persistence;
use DirectoryIterator, JsonSerializable;

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

class Document implements JsonSerializable {

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
    $value = json_decode($value, true);
    $value['id'] = $this->id();
    return $value;
  }

  public function put($value) {
    $value['id'] = $this->id();
    $value = json_encode($value);
    file_put_contents($this->file, $value);
  }

  public function delete() {
    unlink($this->file);
  }

  public function jsonSerialize(): mixed {
    return $this->get();
  }
}

?>
