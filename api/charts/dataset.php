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
  private $folder;

  public function __construct($folder) {
    $this->folder = $folder;
  }

  public function load() {
    $iterator = new DirectoryIterator($this->folder);

    foreach ($iterator as $file) {
      if ($file->getExtension() == 'gpx') {
        yield $this->read($file);
      }
    }
  }

  private function read($file) {
    $file = $file->openFile();
    $data = $file->fread($file->getSize());

    $document = new SimpleXMLElement($data, LIBXML_NONET);
    $document->registerXPathNamespace('x', 'http://www.topografix.com/GPX/1/1');

    $name = $this->xpath($document, '/x:gpx/x:trk/x:name');
    $type = $this->xpath($document, '/x:gpx/x:trk/x:type');
    $timestamp = $this->xpath($document, '/x:gpx/x:trk/x:trkseg[1]/x:trkpt[1]/x:time');

    $distance   = $this->xpath($document, '//gpxtrkx:Distance', 'floatval');
    $maxSpeed   = $this->xpath($document, '//gpxtrkx:MaxSpeed', 'floatval');
    $totalTime  = $this->xpath($document, '//gpxtrkx:TimerTime', 'intval');
    $movingTime = $this->xpath($document, '//gpxtrkx:MovingTime', 'intval');

    return [
      'name' => $name,
      'type' => $type,
      'timestamp' => $timestamp,
      'distance'    => $distance,
      'max_speed'   => $maxSpeed,
      'total_time'  => $totalTime,
      'moving_time' => $movingTime,
    ];
  }

  private function xpath($document, $query, $type = 'strval') {
    $result = $document->xpath($query);
    return is_array($result) && count($result) > 0 ? $type("{$result[0]}") : '';
  }
}

?>
