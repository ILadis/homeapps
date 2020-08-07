<?php
namespace IO\Miio;

function newCommand($method, $params = array()) {
  $id = rand() + 1;
  $command = ['id' => $id, 'method' => $method, 'params' => $params];
  return json_encode((object) $command);
}

function asResult($response) {
  // removes trailing NULL-byte
  $response = substr($response, 0, -1);
  $response = json_decode($response, true);

  $result = $response['result'] ?? false;
  return $result;
}

class Packet {

  const HELLO = ''
    . "\x21\x31" // magic
    . "\x00\x20" // length
    . "\xFF\xFF\xFF\xFF" // reserved
    . "\xFF\xFF\xFF\xFF" // deviceId
    . "\xFF\xFF\xFF\xFF" // timestamp
    . "\xFF\xFF\xFF\xFF\xFF\xFF\xFF\xFF\xFF\xFF\xFF\xFF\xFF\xFF\xFF\xFF";

  public static function pack($packet) {
    $length = 32 + strlen($packet->payload);

    $header = pack('nnNNN', $packet->magic, $length,
      $packet->reserved, $packet->deviceId, $packet->timestamp);

    $data = $header . $packet->checksum . $packet->payload;
    return $data;
  }

  public static function unpack($data) {
    $size = strlen($data);
    $header = @unpack('nmagic/nlength/Nreserved/NdeviceId/Ntimestamp', $data);
    $length = $header['length'];

    if (!$length || $size < $length) {
      return false;
    }

    $packet = new Packet();
    $packet->magic = $header['magic'];
    $packet->reserved = $header['reserved'];
    $packet->deviceId = $header['deviceId'];
    $packet->timestamp = $header['timestamp'];
    $packet->checksum = substr($data, 16, 16);
    $packet->payload = substr($data, 32, $length - 32);

    return $packet;
  }

  private $magic = 0x2131;
  private $reserved = 0x0;
  private $deviceId, $timestamp, $checksum, $payload;

  public function __construct($from = false) {
    if (is_object($from)) {
      $this->deviceId = $from->deviceId;
      $this->timestamp = $from->timestamp + 1;
    }
  }

  public function setChecksum($token) {
    $this->checksum = $token;

    $pack = Packet::pack($this);
    $sum = md5($pack, true);

    $this->checksum = $sum;
  }

  public function setPayload($payload) {
    $this->payload = $payload;
  }

  public function getPayload() {
    return $this->payload;
  }
}

class Crypto {
  private $key, $iv;

  public function __construct($token) {
    $this->key = Crypto::key($token);
    $this->iv = Crypto::iv($token);
  }

  public function encrypt($data) {
    return openssl_encrypt($data, 'AES-128-CBC', $this->key, OPENSSL_RAW_DATA, $this->iv);
  }

  public function decrypt($data) {
    return openssl_decrypt($data, 'AES-128-CBC', $this->key, OPENSSL_RAW_DATA, $this->iv);
  }

  private static function key($token) {
    return md5($token, true);
  }

  private static function iv($token) {
    return md5(md5($token, true) . $token, true);
  }
}

?>
