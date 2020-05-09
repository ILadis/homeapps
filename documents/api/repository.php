<?php
namespace Persistence;

class Repository {

  public static function openNew($db) {
    $repository = new Repository($db);
    $repository->createTables();
    return $repository;
  }

  private $db;

  private function __construct($db) {
    $this->db = $db;
  }

  private function createTables() {
    $this->db->exec(''
      .'CREATE TABLE IF NOT EXISTS "files" ('
      .'  "id"   TEXT PRIMARY KEY,'
      .'  "name" TEXT NOT NULL,'
      .'  "mime" TEXT NOT NULL,'
      .'  "size" INTEGER NOT NULL,'
      .'  "date" TEXT NOT NULL,'
      .'  "data" BLOB)');

    $this->db->exec(''
      .'CREATE TABLE IF NOT EXISTS "file_tags" ('
      .'  "id"   TEXT NOT NULL,'
      .'  "tag"  TEXT NOT NULL,'
      .'  UNIQUE("id", "tag"),'
      .'  FOREIGN KEY ("id") REFERENCES "files" ("id") ON DELETE CASCADE)');
  }

  public function saveFile($file, $data) {
    $stmt = $this->db->prepare(''
      .'INSERT INTO "files" ("id", "name", "mime", "size", "date", "data") '
      .'VALUES (:id, :name, :mime, :size, :date, zeroblob(:size))');

    $file->id   = bin2hex(random_bytes(16));
    $file->date = date('c');

    $stmt->bindValue(':id',   $file->id,   SQLITE3_TEXT);
    $stmt->bindValue(':name', $file->name, SQLITE3_TEXT);
    $stmt->bindValue(':mime', $file->mime, SQLITE3_TEXT);
    $stmt->bindValue(':size', $file->size, SQLITE3_INTEGER);
    $stmt->bindValue(':date', $file->date, SQLITE3_TEXT);
    $stmt->execute();

    $id = $this->db->lastInsertRowID();
    $blob = $this->db->openBlob('files', 'data', $id, 'main', SQLITE3_OPEN_READWRITE);
    stream_copy_to_stream($data, $blob);
  }

  public function listFiles() {
    $result = $this->db->query(''
      .'SELECT "id", "name", "mime", "size", "date" FROM "files" '
      .'ORDER BY datetime("date") DESC');

    while ($row = $result->fetchArray(SQLITE3_ASSOC)) {
      $file = new File($row);
      $file->tags = $this->fetchTags($file);
      yield $file;
    }
  }

  public function findFileById($id) {
    $stmt = $this->db->prepare(''
      .'SELECT "id", "name", "mime", "size", "date" FROM "files" WHERE "id"=:id');

    $stmt->bindValue(':id', $id, SQLITE3_TEXT);
    $result = $stmt->execute();

    if ($row = $result->fetchArray(SQLITE3_ASSOC)) {
      $file = new File($row);
      $file->tags = $this->fetchTags($file);
      return $file;
    }

    return false;
  }

  public function addTag($file, $tag) {
    $stmt = $this->db->prepare(''
      .'INSERT OR IGNORE INTO "file_tags" ("id", "tag") '
      .'VALUES (:id, :tag)');

    $stmt->bindValue(':id',  $file->id, SQLITE3_TEXT);
    $stmt->bindValue(':tag', $tag,      SQLITE3_TEXT);
    $stmt->execute();
  }

  public function fetchTags($file) {
    $stmt = $this->db->prepare(''
      .'SELECT "tag" FROM "file_tags" WHERE "id"=:id');

    $stmt->bindValue(':id', $file->id, SQLITE3_TEXT);
    $result = $stmt->execute();

    $tags = array();
    while ($row = $result->fetchArray(SQLITE3_ASSOC)) {
      $tags[] = $row['tag'];
    }

    return $tags;
  }

  public function fetchData($file) {
    $stmt = $this->db->prepare(''
      .'SELECT "rowid" FROM "files" WHERE "id"=:id');

    $stmt->bindValue(':id', $file->id, SQLITE3_TEXT);
    $result = $stmt->execute();

    if ($row = $result->fetchArray(SQLITE3_ASSOC)) {
      $id = $row['rowid'];
      $blob = $this->db->openBlob('files', 'data', $id);
      return $blob;
    }

    return false;
  }
}

class File {
  public $id, $name, $mime, $size, $date, $uri, $tags;

  public function __construct($args) {
    $this->id   = $args['id']   ?? null;
    $this->name = $args['name'] ?? null;
    $this->mime = $args['mime'] ?? null;
    $this->size = $args['size'] ?? null;
    $this->date = $args['date'] ?? null;
    $this->uri  = $args['uri']  ?? null;
    $this->tags = $args['tags'] ?? null;
  }
}

?>
