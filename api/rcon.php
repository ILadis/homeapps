<?php
namespace IO\Rcon;
use IO\Socket;

// https://wiki.vg/RCON

class Session {

  private $client;
  private $password;

  public function __construct($client) {
    $this->client = $client;
  }

  public function use($password) {
    $this->password = $password;
  }

  public function run($commands) {
    $this->client->connect();
    if (!$this->client->login($this->password)) {
      return false;
    }

    foreach ($commands as $command) {
      yield $this->client->command($command);
    }

    $this->client->disconnect();
    return true;
  }
}

class Client {

  private $socket;
  private $host, $port;
  private $nextId;

  public function __construct($host, $port = 25575) {
    $this->host = $host;
    $this->port = $port;
    $this->nextId = 0;
  }

  public function connect() {
    $this->socket = Socket::connect($this->host, $this->port);
  }

  public function disconnect() {
    $this->socket->close();
  }

  public function login($password) {
    $packet = $this->newPacket(PacketType::Login);
    $packet->setPayload($password);

    $packet = $this->exchange($packet);

    $id = $packet->getId();
    $success = $id != -1;

    return $success;
  }

  public function command($command) {
    $packet = $this->newPacket(PacketType::Command);
    $packet->setPayload($command);

    $packet = $this->exchange($packet);
    $payload = $packet->getPayload();

    return $payload;
  }

  private function newPacket($type) {
    return new Packet(++$this->nextId, $type);
  }

  private function exchange($packet) {
    $data = Packet::pack($packet);
    $this->socket->write($data);

    $data = $this->socket->read(2048, false);
    $packet = Packet::unpack($data);

    return $packet;
  }
}

enum PacketType {
  case Login;
  case Command;
  case MultiPacketResponse;
}

class Packet {

  public static function pack($packet) {
    $header = pack('VV', $packet->id, $packet->type);
    $data = $header . $packet->payload . chr(0) . chr(0);

    $length = strlen($data);
    $data = pack('V', $length) . $data;

    return $data;
  }

  public static function unpack($data) {
    $size = strlen($data);
    $fields = @unpack('Vlength/Vid/Vtype/Z*payload', $data);
    $length = $fields['length'];

    if (!$length || $size < $length) {
      return false;
    }

    $packet = new Packet();
    $packet->id = $fields['id'];
    $packet->type = $fields['type'];
    $packet->payload = $fields['payload'];

    return $packet;
  }

  private $id, $type;
  private $payload;

  public function __construct($id = 0, $type = PacketType::Command) {
    $this->id = $id;
    $this->type = match($type){
      PacketType::Login => 3,
      PacketType::Command => 2,
      PacketType::MultiPacketResponse => 0,
    };
  }

  public function getId() {
    return $this->id;
  }

  public function setPayload($payload) {
    $this->payload = $payload;
  }

  public function getPayload() {
    return $this->payload;
  }
}

?>