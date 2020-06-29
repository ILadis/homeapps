<?php
namespace Devices;
use IO\Socket;

class Scanner {
  private $host, $port;

  public function __construct($host, $port) {
    $this->host = $host;
    $this->port = $port;
  }

  public function scan($image) {
    $socket = Socket::connect($this->host, $this->port);

    try {
      $hello = $socket->read(9);
      if ($hello != "+OK 200\r\n") {
        return false;
      }

      $head = $this->exchange($socket, 'X', [
        'R' => '300,300',
        'M' => 'CGRAY',
        'C' => 'JPEG',
        'J' => 'MID',
        'B' => '50',
        'N' => '50',
        'A' => '0,0,2480,3508',
        'D' => 'SIN'
      ], 1);

      return $this->receive($socket, $head, $image);
    } finally {
      $socket->close();
    }
  }

  private function exchange($socket, $type, $params, $length) {
    $data  = "\x1b";
    $data .= $type."\n";

    foreach ($params as $key => $value) {
      $data .= "{$key}={$value}\n";
    }

    $data .= "\x80";

    $socket->write($data);
    return $socket->read($length);
  }

  private function receive($socket, $head, $image) {
    if ($head == "\xc2") {
      return false;
    }

    while ($head == "\x64") {
      $head .= $socket->read(11);
      $length = unpack("v", $head, 10)[1];

      $data = $socket->read($length);
      fwrite($image, $data);

      $head = $socket->read(1);
    }

    return true;
  }
}

?>
