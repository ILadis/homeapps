<?php
namespace Persistence;

class Repository {

  public static function openNew($db) {
    $repository = new Repository($db);
    $repository->createTables();
    $repository->createDefaultUser();
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
      .'  "user"  INTEGER NOT NULL,'
      .'  UNIQUE("url", "user"),'
      .'  FOREIGN KEY ("user") REFERENCES "page_users" ("id") ON DELETE CASCADE)');

    $this->db->exec(''
      .'CREATE TABLE IF NOT EXISTS "page_tags" ('
      .'  "id"    INTEGER NOT NULL,'
      .'  "tag"   TEXT NOT NULL,'
      .'  UNIQUE("id", "tag"),'
      .'  FOREIGN KEY ("id") REFERENCES "pages" ("id") ON DELETE CASCADE)');

    $this->db->exec(''
      .'CREATE TABLE IF NOT EXISTS "page_users" ('
      .'  "id"    INTEGER PRIMARY KEY AUTOINCREMENT,'
      .'  "token" TEXT NOT NULL,'
      .'  "name"  TEXT NOT NULL,'
      .'  UNIQUE("token"),'
      .'  UNIQUE("name"),'
      .'  CHECK(LENGTH(name) > 0))');
  }

  private function newUserToken() {
    return bin2hex(random_bytes(16));
  }

  private function lookupUserId($token) {
    $stmt = $this->db->prepare(''
      .'SELECT "id" FROM "page_users" '
      .'WHERE "token"=:token');

    $stmt->bindValue(':token', $token, SQLITE3_TEXT);
    $result = $stmt->execute();

    while ($user = $result->fetchArray(SQLITE3_ASSOC)) {
      return intval($user['id']);
    }

    return false;
  }

  private function createDefaultUser() {
    $stmt = $this->db->prepare(''
      .'INSERT INTO  "page_users" ("id", "token", "name") '
      .'VALUES (1, :token, :name) '
      .'ON CONFLICT DO NOTHING');

    $token = $this->newUserToken();
    $name = 'Default';

    $stmt->bindValue(':token', $token, SQLITE3_TEXT);
    $stmt->bindValue(':name',  $name,  SQLITE3_TEXT);
    $stmt->execute();
  }

  public function createUser($name) {
    $stmt = $this->db->prepare(''
      .'INSERT INTO "page_users" ("token", "name") '
      .'VALUES (:token, :name)');

    $token = $this->newUserToken();

    $stmt->bindValue(':token', $token, SQLITE3_TEXT);
    $stmt->bindValue(':name',  $name,  SQLITE3_TEXT);
    $result = $stmt->execute();

    $user = array('token' => $token, 'name' => $name);

    return $result ? $user : false;
  }

  public function listUsers() {
    $stmt = $this->db->prepare(''
      .'SELECT "name", "token" FROM "page_users"');

    $result = $stmt->execute();
    while ($user = $result->fetchArray(SQLITE3_ASSOC)) {
      yield $user;
    }
  }

  public function savePage(&$page, $token) {
    $user = $this->lookupUserId($token);
    if (!$user) return false;

    $stmt = $this->db->prepare(''
      .'INSERT INTO "pages" ("title", "url", "user") '
      .'VALUES (:title, :url, :user) '
      .'ON CONFLICT ("url", "user") DO UPDATE SET title=:title '
      .'RETURNING "id"');

    $stmt->bindValue(':user', $user, SQLITE3_INTEGER);
    $stmt->bindValue(':title', $page['title'], SQLITE3_TEXT);
    $stmt->bindValue(':url',   $page['url'],   SQLITE3_TEXT);
    $result = $stmt->execute();

    $id = $result->fetchArray(SQLITE3_NUM)[0];
    $tags = $page['tags'] ?? array();

    $this->saveTags($id, $tags);
    $this->purifyPage($page, $tags);
  }

  public function listPages($token) {
    $user = $this->lookupUserId($token);
    if (!$user) return false;

    $stmt = $this->db->prepare(''
      .'SELECT "id", "title", "url" FROM "pages" '
      .'WHERE "user"=:user');

    $stmt->bindValue(':user', $user, SQLITE3_INTEGER);
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
