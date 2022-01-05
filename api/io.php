<?php
namespace IO;
use Exception;

class Stream {

  public static function from($fd) {
    return new Stream($fd);
  }

  protected $fd;

  protected function __construct($fd) {
    $this->fd = $fd;
  }

  protected function recv($length) {
    return fread($this->fd, $length);
  }

  public function read($length, $exact = true) {
    $data = '';
    do {
      $chunk = $this->recv($length);
      $len = strlen($chunk);

      if ($len == 0) {
        throw new Exception('could not read');
      }

      $data .= $chunk;
      $length -= $len;
    } while ($length > 0 && $exact);

    return $data;
  }

  public function readLine() {
    $data = '';

    while (true) {
      $chunk = $this->recv(1);
      $len = strlen($chunk);

      if ($len != 1) throw new Exception('could not read');
      if ($chunk == "\n") break;

      $data .= $chunk;
    }

    return $data;
  }

  protected function send($data) {
    return fwrite($this->fd, $data);
  }

  public function write($data, $exact = true) {
    $length = 0;
    do {
      $len = $this->send($data);
      $length += $len;

      if ($len == 0) {
        throw new Exception('could not write');
      }

      $data = substr($data, $len);
    } while ($data != '' && $exact);

    return $length;
  }

  public function writeLine($data) {
    $this->write($data);
    $this->write("\n");
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

class UnixDatagram extends Stream {

  public static function connect($file) {
    $fd = socket_create(AF_UNIX, SOCK_DGRAM, 0);
    if (!socket_connect($fd, $file)) {
      throw new Exception("could not open {$file}");
    }

    $file = tempnam(sys_get_temp_dir(), 'socket.');
    unlink($file);

    if (!socket_bind($fd, $file)) {
      throw new Exception("could not open {$file}");
    }

    return new UnixDatagram($fd, $file);
  }

  private $file;

  private function __construct($fd, $file) {
    parent::__construct($fd);
    $this->file = $file;
  }

  protected function recv($length) {
    return socket_read($this->fd, $length);
  }

  protected function send($data) {
    return socket_write($this->fd, $data);
  }

  public function close() {
    socket_close($this->fd);
    unlink($this->file);
  }
}

class UnixSocket extends Stream {

  public static function listen($file) {
    $fd = socket_create(AF_UNIX, SOCK_STREAM, 0);
    @unlink($file);

    if (!socket_bind($fd, $file)) {
      throw new Exception("could not open {$file}");
    }

    if (!socket_listen($fd)) {
      throw new Exception("could not open {$file}");
    }

    return new UnixSocket($fd, $file);
  }

  public static function connect($file) {
    $fd = socket_create(AF_UNIX, SOCK_STREAM, 0);
    if (!socket_connect($fd, $file)) {
      throw new Exception("could not open {$file}");
    }

    $file = tempnam(sys_get_temp_dir(), 'socket.');
    unlink($file);

    if (!socket_bind($fd, $file)) {
      throw new Exception("could not open {$file}");
    }

    return new UnixSocket($fd, $file);
  }

  private $file;

  private function __construct($fd, $file) {
    parent::__construct($fd);
    $this->file = $file;
  }

  public function accept() {
    $fd = socket_accept($this->fd);
    return new UnixSocket($fd, false);
  }

  protected function recv($length) {
    return socket_read($this->fd, $length);
  }

  protected function send($data) {
    return socket_write($this->fd, $data);
  }

  public function close() {
    socket_close($this->fd);
    unlink($this->file);
  }
}

?>
