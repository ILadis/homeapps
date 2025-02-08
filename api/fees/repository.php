<?php
namespace Persistence;
use Exception, IO\CSV, Entity\Member;

class Repository {

  public static function open($file, $headers) {
    $source = CSV\DataSource::open($file);

    $repository = new Repository($source, ';', '"', '\\');
    $repository->parseHeaders($headers);
    return $repository;
  }

  private $source;
  private $headers = array();
  private $fields = array();

  private function __construct($source) {
    $this->source = $source;
  }

  private function parseHeaders($headers) {
    $fields = array_keys(get_class_vars('Entity\\Member'));

    $headline = $this->source->read();
    foreach ($headline as $index => $header) {
      $key = array_search($header, $headers);
      if ($key === false) {
        throw new Exception("Header '{$header}' not found in source");
      }

      if (!in_array($key, $fields)) {
        throw new Exception("Header '{$header}' should not be mapped");
      }

      $this->fields[$index] =  $key;
      $this->headers[$key] = $header;
    }
  }

  public function listMembers() {
    $this->source->rewind();
    $this->source->read();

    while ($data = $this->source->read()) {
      $member = new Member();

      foreach ($data as $index => $value) {
        $field = $this->fields[$index];
        $member->$field = $value;
      }

      yield $member;
    }
  }

  public function findMembers($filter) {
    $members = $this->listMembers();
    foreach ($members as $member) {
      if ($filter($member)) {
        yield $member;
      }
    }
  }
}

?>
