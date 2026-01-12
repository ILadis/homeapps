<?php
namespace Persistence;
use SQLite3;

interface Dataset {
  public function load();
}

class SQLiteDataset implements Dataset {
  private $db, $query;

  public function __construct($db, $query) {
    $this->db = $db;
    $this->query = $query;
  }

  public function load() {
    $db = new SQLite3($this->db);
    $stmt = $db->prepare($this->query);

    $result = $stmt->execute();
    while ($row = $result->fetchArray(SQLITE3_ASSOC)) {
      yield $row;
    }

    $db->close();
  }
}

class LogfileDataset implements Dataset {
  private $file, $pattern;

  public function __construct($file, $pattern) {
    $this->file = $file;
    $this->pattern = $pattern;
  }

  public function load() {
    $handle = fopen($this->file, 'r');

    while ($line = fgets($handle)) {
      preg_match($this->pattern, $line, $matches);
      if ($matches) {
        $result = array_filter($matches, 'is_string', ARRAY_FILTER_USE_KEY);
        yield $result;
      }
    }

    fclose($handle);
  }
}

?>
