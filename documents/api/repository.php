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
    $this->db->exec('PRAGMA foreign_keys = ON');

    $this->db->exec(''
      .'CREATE TABLE IF NOT EXISTS "files" ('
      .'  "id"    TEXT PRIMARY KEY,'
      .'  "name"  TEXT NOT NULL,'
      .'  "mime"  TEXT NOT NULL,'
      .'  "size"  INTEGER NOT NULL,'
      .'  "date"  TEXT NOT NULL,'
      .'  "inbox" INTEGER NOT NULL,'
      .'  "data"  BLOB)');

    $this->db->exec(''
      .'CREATE TABLE IF NOT EXISTS "file_tags" ('
      .'  "id"    TEXT NOT NULL,'
      .'  "tag"   TEXT NOT NULL,'
      .'  UNIQUE("id", "tag"),'
      .'  FOREIGN KEY ("id") REFERENCES "files" ("id") ON DELETE CASCADE)');

    $this->db->exec(''
      .'CREATE TABLE IF NOT EXISTS "file_props" ('
      .'  "id"    TEXT NOT NULL,'
      .'  "key"   TEXT NOT NULL,'
      .'  "value" TEXT NOT NULL,'
      .'  UNIQUE("id", "key"),'
      .'  FOREIGN KEY ("id") REFERENCES "files" ("id") ON DELETE CASCADE)');
  }

  public function uploadFile(&$file, $data, $inbox = false) {
    $stmt = $this->db->prepare(''
      .'INSERT INTO "files" ("id", "name", "mime", "size", "date", "inbox", "data") '
      .'VALUES (:id, :name, :mime, :size, :date, :inbox, zeroblob(:size))');

    $file['id']   = bin2hex(random_bytes(16));
    $file['date'] = date('c');
    $file['tags'] = array();

    $stmt->bindValue(':id',    $file['id'],    SQLITE3_TEXT);
    $stmt->bindValue(':name',  $file['name'],  SQLITE3_TEXT);
    $stmt->bindValue(':mime',  $file['mime'],  SQLITE3_TEXT);
    $stmt->bindValue(':size',  $file['size'],  SQLITE3_INTEGER);
    $stmt->bindValue(':date',  $file['date'],  SQLITE3_TEXT);
    $stmt->bindValue(':inbox', $inbox ? 1 : 0, SQLITE3_INTEGER);
    $stmt->execute();

    $id = $this->db->lastInsertRowID();
    $blob = $this->db->openBlob('files', 'data', $id, 'main', SQLITE3_OPEN_READWRITE);
    stream_copy_to_stream($data, $blob);
  }

  public function saveFile(&$file) {
    $stmt = $this->db->prepare(''
      .'UPDATE "files" SET "name"=:name, "date"=:date WHERE "id"=:id');

    $stmt->bindValue(':id',   $file['id'],   SQLITE3_TEXT);
    $stmt->bindValue(':name', $file['name'], SQLITE3_TEXT);
    $stmt->bindValue(':date', $file['date'], SQLITE3_TEXT);
    $stmt->execute();

    $changes = $this->db->changes();
    if (!$changes) {
      return false;
    }

    $tags = (array) $file['tags'];
    $this->replaceTags($file, $tags);

    return true;
  }

  public function listFiles($inbox = false) {
    $stmt = $this->db->prepare(''
      .'SELECT "id", "name", "mime", "size", "date" FROM "files" '
      .'WHERE "inbox" = :inbox '
      .'ORDER BY datetime("date") ASC');

    $stmt->bindValue(':inbox', $inbox ? 1 : 0, SQLITE3_INTEGER);
    $result = $stmt->execute();

    while ($file = $result->fetchArray(SQLITE3_ASSOC)) {
      $file['tags'] = $this->fetchTags($file);
      yield $file;
    }
  }

  public function findFileById($id) {
    $stmt = $this->db->prepare(''
      .'SELECT "id", "name", "mime", "size", "date" FROM "files" WHERE "id"=:id');

    $stmt->bindValue(':id', $id, SQLITE3_TEXT);
    $result = $stmt->execute();

    if ($file = $result->fetchArray(SQLITE3_ASSOC)) {
      $file['tags'] = $this->fetchTags($file);
      return $file;
    }

    return false;
  }

  public function findFilesInInbox() {
    $result = $this->db->query(''
      .'SELECT "id", "name", "mime", "size", "date" FROM "files" WHERE "inbox"=1');

    while ($file = $result->fetchArray(SQLITE3_ASSOC)) {
      yield $file;
    }
  }

  public function deleteFileById($id) {
    $stmt = $this->db->prepare(''
      .'DELETE FROM "files" WHERE "id"=:id');

    $stmt->bindValue(':id', $id, SQLITE3_TEXT);
    $stmt->execute();

    $changes = $this->db->changes();
    return boolval($changes);
  }

    public function deleteFilesInInbox() {
    $this->db->exec(''
      .'DELETE FROM "files" WHERE "inbox"=1');

    $changes = $this->db->changes();
    return boolval($changes);
  }

  public function addTag(&$file, $tag) {
    $stmt = $this->db->prepare(''
      .'INSERT OR IGNORE INTO "file_tags" ("id", "tag") '
      .'VALUES (:id, :tag)');

    $stmt->bindValue(':id',  $file['id'], SQLITE3_TEXT);
    $stmt->bindValue(':tag', $tag,        SQLITE3_TEXT);
    $stmt->execute();
  }

  public function fetchTags(&$file) {
    $stmt = $this->db->prepare(''
      .'SELECT "tag" FROM "file_tags" WHERE "id"=:id');

    $stmt->bindValue(':id', $file['id'], SQLITE3_TEXT);
    $result = $stmt->execute();

    $tags = array();
    while ($row = $result->fetchArray(SQLITE3_ASSOC)) {
      $tags[] = $row['tag'];
    }

    return $tags;
  }

  public function replaceTags(&$file, $tags) {
    $stmt = $this->db->prepare(''
      .'DELETE FROM "file_tags" WHERE "id"=:id');

    $stmt->bindValue(':id',  $file['id'], SQLITE3_TEXT);
    $stmt->execute();

    foreach ($tags as $tag) {
      $this->addTag($file, $tag);
    }
  }

  public function setProperty(&$file, $key, $value) {
    $stmt = $this->db->prepare(''
      .'INSERT OR REPLACE INTO "file_props" ("id", "key", "value") '
      .'VALUES (:id, :key, :value)');

    $stmt->bindValue(':id',    $file['id'], SQLITE3_TEXT);
    $stmt->bindValue(':key',   $key,        SQLITE3_TEXT);
    $stmt->bindValue(':value', $value,      SQLITE3_TEXT);
    $stmt->execute();
  }

  public function getProperty(&$file, ...$keys) {
    $params = implode(', ', array_fill(0, count($keys), '?'));
    $stmt = $this->db->prepare(''
      .'SELECT "key", "value" FROM "file_props" '
      .'WHERE "id"=? AND "key" IN ('. $params .')');

    $stmt->bindValue($index = 1, $file['id'], SQLITE3_TEXT);
    foreach ($keys as $key) {
      $stmt->bindValue(++$index, $key, SQLITE3_TEXT);
    }

    $result = $stmt->execute();
    $props = array();

    while ($row = $result->fetchArray(SQLITE3_ASSOC)) {
      $key = $row['key'];
      $value = $row['value'];
      $props[$key] = $value;
    }

    return $props;
  }

  public function fetchData(&$file) {
    $stmt = $this->db->prepare(''
      .'SELECT "rowid" FROM "files" WHERE "id"=:id');

    $stmt->bindValue(':id', $file['id'], SQLITE3_TEXT);
    $result = $stmt->execute();

    if ($row = $result->fetchArray(SQLITE3_ASSOC)) {
      $id = $row['rowid'];
      $blob = $this->db->openBlob('files', 'data', $id);
      return $blob;
    }

    return false;
  }
}

?>
