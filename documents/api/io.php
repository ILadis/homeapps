<?php
namespace IO;
use Exception;

class Stream {

  public static function from($fd) {
    return new Stream($fd);
  }

  private $fd;

  protected function __construct($fd) {
    $this->fd = $fd;
  }

  public function read($length, $exact = true) {
    $data = '';
    do {
      $chunk = fread($this->fd, $length);
      $len = strlen($chunk);

      if ($len == 0) {
        throw new Exception('could not read');
      }

      $data .= $chunk;
      $length -= $len;
    } while ($length > 0 && $exact);

    return $data;
  }

  public function write($data, $exact = true) {
    $length = 0;
    do {
      $len = fwrite($this->fd, $data);
      $length += $len;

      if ($len == 0) {
        throw new Exception('could not write');
      }

      $data = substr($data, $len);
    } while ($data != '' && $exact);

    return $length;
  }

  public function close() {
    fclose($this->fd);
  }
}

class Socket extends Stream {

  public static function connect($host, $port) {
    $fd = stream_socket_client("tcp://{$host}:{$port}");
    if (!$fd) {
      throw new Exception("could not connect to {$host}:{$port}");
    }

    return new Socket($fd);
  }

  private function __construct($fd) {
    parent::__construct($fd);
  }
}

class Datagram extends Stream {

  public static function open($host, $port, $timeout = false) {
    $fd = stream_socket_client("udp://{$host}:{$port}");
    if (!$fd) {
      throw new Exception("could not connect to {$host}:{$port}");
    }

    if ($timeout !== false) {
      stream_set_timeout($fd, $timeout);
    }

    return new Datagram($fd);
  }

  private function __construct($fd) {
    parent::__construct($fd);
  }
}

?>
