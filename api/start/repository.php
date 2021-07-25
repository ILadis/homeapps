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
      .'CREATE TABLE IF NOT EXISTS "pages" ('
      .'  "id"    INTEGER PRIMARY KEY AUTOINCREMENT,'
      .'  "title" TEXT,'
      .'  "url"   TEXT NOT NULL,'
      .'  UNIQUE("url"))');

    $this->db->exec(''
      .'CREATE TABLE IF NOT EXISTS "page_tags" ('
      .'  "id"    INTEGER NOT NULL,'
      .'  "tag"   TEXT NOT NULL,'
      .'  UNIQUE("id", "tag"),'
      .'  FOREIGN KEY ("id") REFERENCES "pages" ("id") ON DELETE CASCADE)');
  }

  public function savePage(&$page) {
    $stmt = $this->db->prepare(''
      .'INSERT INTO "pages" ("title", "url") '
      .'VALUES (:title, :url) '
      .'ON CONFLICT (url) DO UPDATE SET title=:title '
      .'RETURNING id');

    $stmt->bindValue(':title', $page['title'], SQLITE3_TEXT);
    $stmt->bindValue(':url',   $page['url'],   SQLITE3_TEXT);
    $result = $stmt->execute();

    $id = $result->fetchArray(SQLITE3_NUM)[0];
    $tags = $page['tags'] ?? array();

    $this->saveTags($id, $tags);
    $this->purifyPage($page, $tags);

    return true;
  }

  public function listPages() {
    $stmt = $this->db->prepare(''
      .'SELECT "id", "title", "url" FROM "pages"');

    $result = $stmt->execute();

    while ($page = $result->fetchArray(SQLITE3_ASSOC)) {
      $id = $page['id'];
      $tags = $this->fetchTags($id);
      yield $this->purifyPage($page, $tags);
    }
  }

  public function deletePageByUrl($url) {
    $stmt = $this->db->prepare(''
      .'DELETE FROM "pages" WHERE "url"=:url');

    $stmt->bindValue(':url', $url, SQLITE3_TEXT);
    $stmt->execute();

    $changes = $this->db->changes();
    return boolval($changes);
  }

  private function purifyPage(&$page, $tags) {
    unset($page['id']);
    $page['tags'] = $tags;
    return $page;
  }

  private function saveTags($id, $tags) {
    $stmt = $this->db->prepare(''
      .'DELETE FROM "page_tags" WHERE "id"=:id');

    $stmt->bindValue(':id', $id, SQLITE3_TEXT);
    $stmt->execute();

    $stmt = $this->db->prepare(''
      .'INSERT INTO "page_tags" ("id", "tag") '
      .'VALUES (:id, :tag)');

    foreach ($tags as $tag) {
      $stmt->bindValue(':id',  $id,  SQLITE3_TEXT);
      $stmt->bindValue(':tag', $tag, SQLITE3_TEXT);
      $stmt->execute()->finalize();
    }
  }

  private function fetchTags($id) {
    $stmt = $this->db->prepare(''
      .'SELECT "tag" FROM "page_tags" WHERE "id"=:id');

    $stmt->bindValue(':id', $id, SQLITE3_TEXT);
    $result = $stmt->execute();

    $tags = array();
    while ($row = $result->fetchArray(SQLITE3_ASSOC)) {
      $tags[] = $row['tag'];
    }

    return $tags;
  }
}

?>
