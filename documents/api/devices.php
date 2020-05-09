<?php
namespace Devices;
use Exception;

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

      $this->sendAndReceive($socket, 'Q', [], 75);
      $this->sendAndReceive($socket, 'I', [
        'R=300,300',
        'M=CGRAY',
        'D=SIN'
      ], 27);

      $head = $this->sendAndReceive($socket, 'X', [
        'R=300,300',
        'M=CGRAY',
        'C=JPEG',
        'J=MID',
        'B=50',
        'N=50',
        'A=0,0,2480,3508',
        'D=SIN'
      ], 1);

      if ($head == "\xc2") {
        return false;
      }

      while (true) {
        $head = $socket->read(2, $head);
        if ($head != "\x64\x07") {
          return true;
        }

        $head = $socket->read(12, $head);
        $length = unpack("v", $head, 10)[1];

        $data = $socket->read($length);
        fwrite($image, $data);

        $head = "";
      }
    } finally {
      $socket->close();
    }
  }

  private function sendAndReceive($socket, $type, $params, $length) {
    $data  = "\x1b";
    $data .= $type."\n";

    foreach ($params as $param) {
      $data .= $param."\n";
    }

    $data .= "\x80";

    $socket->write($data);
    return $socket->read($length);
  }
}

class Socket {

  public static function connect($host, $port) {
    $fd = stream_socket_client("tcp://{$host}:{$port}");
    if (!$fd) {
      throw new IOException("could not connect to {$host}:{$port}");
    }

    return new Socket($fd);
  }

  private $fd;

  private function __construct($fd) {
    $this->fd = $fd;
  }

  public function read($length, $data = "") {
    $len = strlen($data);
    $length -= $len;

    while ($length > 0) {
      $chunk = fread($this->fd, $length);
      $len = strlen($chunk);

      $data .= $chunk;
      $length -= $len;

      if ($len == 0) {
        throw new IOException("could not read, returned 0");
      }
    }

    return $data;
  }

  public function write($data) {
    $length = strlen($data);

    while ($length > 0) {
      $len = fwrite($this->fd, $data);
      $length -= $len;

      if ($len == 0) {
        throw new IOException("could not write, returned 0");
      }
    }
  }

  public function close() {
    fclose($this->fd);
  }
}

class IOException extends Exception {
  public function __construct($message, $code = 0, Exception $previous = null) {
    parent::__construct($message, $code, $previous);
  }
}

?>
