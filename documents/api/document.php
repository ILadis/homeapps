<?php
namespace Document;
use ArrayIterator, Exception, IO\Stream;

class Builder {
  private $root, $pages, $current;

  public function __construct() {
    $this->pages = newObject([
      '/Type' => '/Pages',
      '/Count' => 0,
      '/Kids' => []
    ]);

    $this->root = newObject([
      '/Type' => '/Catalog',
      '/Pages' => $this->pages
    ]);
  }

  public function nextPage() {
    $pages =& $this->pages->value;

    $page = newObject([
      '/Type' => '/Page',
      '/Parent' => $this->pages
    ]);

    $pages['/Count']++;
    $pages['/Kids'][] = $page;

    $this->current = $page;
    return $this;
  }

  public function useImage($image, $scale = 1) {
    $page =& $this->current->value;
    $pages =& $this->pages->value;

    $name = '/Im'. ($pages['/Count'] + 1);
    $width = $image->value['/Width'] * $scale;
    $height = $image->value['/Height'] * $scale;

    $contents = newObject([],
      "q\n{$width} 0 0 {$height} 0 0 cm\n{$name} Do\nQ");

    $image->value['/Name'] = $name;

    $page['/Resources'] = ['/XObject' => [$name => $image]];
    $page['/MediaBox'] = [0, 0, $width, $height];
    $page['/Contents'] = $contents;

    $this->current = $image;
    return $this;
  }

  public function build() {
    return $this->root;
  }
}

function newObject($value, $stream = null) {
  return (object) ['value' => $value, 'stream' => $stream];
}

function newImage($stream, $width, $height) {
  return newObject([
    '/Type' => '/XObject',
    '/Subtype' => '/Image',
    '/Filter' => ['/DCTDecode'],
    // TODO add /Length entry
    '/Width' => $width,
    '/Height' => $height,
    '/ColorSpace' => '/DeviceRGB',
    '/BitsPerComponent' => 8
  ], $stream);
}

class Writer extends Stream {
  private $offset = 0, $objects = array(), $xref = array();

  public function __construct($fd) {
    parent::__construct($fd);
  }

  private function lookupIndex($object, &$refs = false) {
    $index = array_search($object, $this->objects, true);

    if ($index === false) {
      $index = count($this->objects);
      $this->objects[] = $object;
      if (is_array($refs)) $refs[] = $object;
    }

    return $index;
  }

  private function registerXref($object) {
    $index = $this->lookupIndex($object);
    $this->xref[$index] = $this->offset;
  }

  public function read($length, $exact = true) {
    throw new Exception('unsupported operation');
  }

  public function write($object, $exact = true) {
    $this->writeHeader();
    $this->writeValue($object);
    $this->writeTrailer();
  }

  private function writeValue($value, &$refs = false) {
    $type = ucfirst(gettype($value));
    $this->{"write{$type}"}($value, $refs);
  }

  private function writeData($data) {
    $length = parent::write($data);
    $this->offset += $length;
    return $length;
  }

  private function writeBoolean($boolean) {
    $this->writeData(strval($boolean));
  }

  private function writeString($string) {
    $this->writeData($string);
  }

  private function writeInteger($integer) {
    $this->writeData(strval($integer));
  }

  private function writeDouble($double) {
    $this->writeData(strval($double));
  }

  private function writeResource($resource) {
    while ($data = fread($resource, 1024)) {
      $this->writeData($data);
    }
  }

  private function writeArray($array, &$refs = true) {
    $iterator = new ArrayIterator($array);

    $assoc = true;
    $head = "<<\n";
    $tail = "\n>>";

    if ($iterator->key() === 0) {
      $assoc = false;
      $head = '[';
      $tail = ']';
    }

    $this->writeData($head);

    while ($iterator->valid()) {
      $key = $iterator->key();
      $value = $iterator->current();

      if ($assoc) {
        $this->writeData($key);
        $this->writeData(' ');
      }

      $this->writeValue($value, $refs);

      $iterator->next();
      if ($iterator->valid()) {
        $this->writeData($assoc ? "\n" : ' ');
      }
    }

    $this->writeData($tail);
  }

  private function writeObject($object, &$refs = false) {
    $index = $this->lookupIndex($object, $refs);
    $id = $index + 1;

    $this->writeData($id);
    $this->writeData(' 0 ');

    if ($refs !== false) {
      $this->writeData('R');
    }

    else {
      $refs = array();

      $this->registerXref($object);

      $this->writeData("obj\n");
      $this->writeValue($object->value, $refs);
      if ($object->stream) {
        $this->writeData("\nstream\n");
        $this->writeValue($object->stream);
        $this->writeData("\nendstream");
      }
      $this->writeData("\nendobj\n");

      foreach ($refs as $object) {
        $this->writeValue($object);
      }
    }
  }

  private function writeHeader() {
    $this->writeData("%PDF-1.3\n");
  }

  private function writeTrailer() {
    $start = $this->offset;
    $root = $this->objects[0];
    $size = count($this->objects);
    $trailer = ['/Size' => $size, '/Root' => $root];

    $this->writeData("xref\n");
    $this->writeData("0 {$size}\n");
    $this->writeData("0000000000 65535 f\n");

    foreach ($this->xref as $offset) {
      $offset = sprintf('%010d', $offset);
      $this->writeData("{$offset} 00000 n\n");
    }

    $this->writeData("trailer\n");
    $this->writeArray($trailer);

    $this->writeData("\nstartxref\n");
    $this->writeData("{$start}\n");
    $this->writeData('%%EOF');
  }
}

?>
