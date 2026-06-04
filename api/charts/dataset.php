<?php
namespace Persistence;
use SQLite3, SimpleXMLElement;
use DirectoryIterator;

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

class GpxDataset implements Dataset {
  private $folder, $fields;

  public function __construct($folder, $fields) {
    $this->folder = $folder;
    $this->fields = $fields;
  }

  public function load() {
    $iterator = new DirectoryIterator($this->folder);

    foreach ($iterator as $file) {
      if ($file->getExtension() == 'gpx') {
        yield $this->parse($file);
      }
    }
  }

  private function parse($file) {
    $parser = xml_parser_create();
    xml_set_element_handler($parser, $this->push($path), $this->pop($path));
    xml_set_character_data_handler($parser, $this->handler($path, $result));

    $handle = fopen($file->getRealPath(), 'r');
    while ($line = fgets($handle)) {
      if (xml_parse($parser, $line) == 0) break;
      if (count($result) == count($this->fields)) break;
    }

    return $result;
  }

  private function handler(&$path, &$result) {
    $result = array();
    $fields = $this->fields;

    return function($parser, $data) use (&$path, &$result, &$fields) {
      $xpath = strtolower('/'.implode('/', $path));
      $field = $fields[$xpath] ?? false;

      if ($field) {
        list($name, $type) = $field;
        $result[$name] = $type($data);
      }
    };
  }

  private function push(&$path) {
    $path = array();
    return function($parser, $name, $attrs) use (&$path) {
      array_push($path, $name);
    };
  }

  private function pop(&$path) {
    return function($parser, $name) use (&$path) {
      array_pop($path);
    };
  }
}

?>
