<?php
namespace Minecraft;
use IO\Socket;

// https://wiki.vg/Server_List_Ping

// TODO add packet class

class Ping {

  private $socket;
  private $host, $port;

  public function __construct($host, $port = 25565) {
    $this->host = $host;
    $this->port = $port;
  }

  public function connect() {
    $this->socket = Socket::connect($this->host, $this->port);
    $this->handshake();
  }

  private function handshake() {
    $data  = "\x00"; // packet id
    $data .= "\x04"; // protocol version
    $data .= pack('c', strlen($this->host)) . $this->host;
    $data .= pack('n', $this->port);
    $data .= "\x01"; // next state: query status

    // prepend length of packet data
    $length = strlen($data);
    $data = pack('c', $length) . $data;

    $this->socket->write($data);
  }

  public function query() {
    $data  = "\x01"; // packet id
    $data .= "\x00"; // status ping

    $this->socket->write($data);

    $length = $this->socket->readVarint();
    if ($length < 10) {
      return false;
    }

    $type = $this->socket->readVarint();
    $length = $this->socket->readVarint();

    $data = $this->socket->read($length);
    return json_decode($data, true);
  }
}

?>
