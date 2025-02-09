<?php
namespace IO\CSV;

class DataSource {

  public static function open($file, $separator = ';', $enclosure = '"', $escape = '\\') {
    $stream = fopen($file, 'c+');
    return DataSource::from($stream, $separator, $enclosure, $escape);
  }

  public static function wrap($buffer, $separator = ';', $enclosure = '"', $escape = '\\') {
    $stream = fopen('data://text/plain,'. $buffer, 'r+');
    return DataSource::from($stream, $separator, $enclosure, $escape);
  }

  public static function from($stream, $separator = ';', $enclosure = '"', $escape = '\\') {
    return new DataSource($stream, $separator, $enclosure, $escape);
  }

  private $stream;
  private $separator, $enclosure, $escape;

  private function __construct($stream, $separator, $enclosure, $escape) {
    $this->stream = $stream;
    $this->separator = $separator;
    $this->enclosure = $enclosure;
    $this->escape = $escape;
  }

  public function rewind() {
    return rewind($this->stream);
  }

  public function read() {
    return fgetcsv($this->stream, 0, $this->separator, $this->enclosure, $this->escape);
  }

  public function write($fields) {
    return fputcsv($this->stream, $fields, $this->separator, $this->enclosure, $this->escape);
  }

  public function close() {
    return fclose($this->stream);
  }
}

class Template {

  private $headers;
  private $fields;

  public function __construct($headers, $fields) {
    $this->headers = $headers;
    $this->fields = $fields;
  }

  private function apply($entry) {
    $replacer = function($match) use ($entry) {
      $key = substr($match[1], 1, -1);
      $value = $entry->$key ?? $match[1];
      return $value;
    };

    $mapper = function($field) use ($replacer) {
      return preg_replace_callback('/(\{.+\})/', $replacer, $field);
    };

    return array_map($mapper, $this->fields);
  }

  public function render($stream, $entries, $separator = ';', $enclosure = '"', $escape = '\\') {
    $target = DataSource::from($stream, $separator, $enclosure, $escape);
    $target->write($this->headers);

    foreach ($entries as $entry) {
      $fields = $this->apply($entry);
      $target->write($fields);
    }
  }
}

?>
