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
      $field = array_search($header, $headers);
      if ($field === false) {
        throw new Exception("Header '{$header}' not found in source");
      }

      if (!in_array($field, $fields)) {
        throw new Exception("Header '{$header}' should not be mapped");
      }

      $this->fields[$index] = $field;
      $this->headers[$field] = $header;
    }
  }

  private function readMember(&$member) {
    $fields = $this->source->read();
    if ($fields !== false) {
      $member = new Member();

      foreach ($fields as $index => $value) {
        $field = $this->fields[$index];
        $member->$field = $value;
      }

      return true;
    }

    return false;
  }

  private function writeMember($member) {
    $fields = array();
    foreach ($this->fields as $index => $field) {
      $fields[$index] = $member->$field;
    }

    $this->source->write($fields);
  }

  public function saveMember($member) {
    $members = iterator_to_array($this->listMembers());
    $updated = false;

    $this->source->rewind();
    $this->source->write($this->headers);

    foreach ($members as $current) {
      if ($current->id === $member->id) {
        $current = $member;
        $updated = true;
      }

      $this->writeMember($current);
    }

    if (!$updated) {
      $this->writeMember($member);
    }

    return $updated;
  }

  public function listMembers() {
    $this->source->rewind();
    $this->source->read();

    while ($this->readMember($member)) {
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
