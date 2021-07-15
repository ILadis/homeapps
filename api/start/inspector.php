<?php

class Inspector {

  public static function forUrl($url) {
    if (!filter_var($url, FILTER_VALIDATE_URL)) {
      return false;
    }

    $context = stream_context_create([
      "http" => [
        "method" => "GET",
        "header" => "Accept-language: en\r\n" .
                    "Accept: text/html\r\n" .
                    "User-Agent: Mozilla/5.0 (Linux)\r\n"
      ]
    ]);

    $page = file_get_contents($url, false, $context);
    $encoding = mb_detect_encoding($page, ['ASCII', 'UTF-8', 'ISO-8859-1']);

    if (!$page || !$encoding) {
      return false;
    }

    $page = mb_convert_encoding($page, 'UTF-8', $encoding);

    $document = new DOMDocument();
    $document->loadHTML($page, LIBXML_NOWARNING | LIBXML_NOERROR);

    return new Inspector($document);
  }

  private $document;

  private function __construct($document) {
    $this->document = $document;
  }

  public function inspectTitle() {
    $titles = $this->document->getElementsByTagName('title');

    if ($titles->length <= 0) $title = '';
    else $title = $titles->item(0)->textContent;

    return trim($title);
  }

  public function inspectFavicon() {
    $selectors = [
      '/html/head/link[@rel="icon"][@href]',
      '/html/head/link[@rel="apple-touch-icon-precomposed"][@href]',
      '/html/head/link[@rel="apple-touch-icon"][@href]',
      '/html/head/link[@rel="shortcut icon"][@href]',
      '/html/head/link[@rel="icon"][@href]'
    ];

    $xpath = new DOMXpath($this->document);

    foreach ($selectors as $selector) {
      $elements = $xpath->query($selector);
      foreach ($elements as $element) {
        return $element->attributes->getNamedItem('href')->nodeValue;
      }
    }
  }

}

?>
