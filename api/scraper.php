<?php
namespace Web;
use DOMDocument, DOMXPath;

trait Scraper {

  public static function load($filename) {
    $html = file_get_contents($filename);

    $document = new DOMDocument();
    $document->loadHTML($html, LIBXML_NOERROR);

    $xpath = new DOMXPath($document);

    return new self($document, $xpath);
  }

  private $document, $xpath;

  protected function __construct($document, $xpath) {
    $this->document = $document;
    $this->xpath = $xpath;
  }

  protected function queryAll($path, $node = null) {
    return $this->xpath->query($path, $node);
  }

  protected function queryOne($path, $node = null) {
    $nodes = $this->xpath->query($path, $node);
    if ($nodes) {
      return $nodes->item(0);
    }
  }

}

?>