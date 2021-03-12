<?php
namespace Devices;
use IO\Datagram, IO\Miio;

class Vacuum {
  private $host, $port, $token;

  public function __construct($host, $port, $token) {
    $this->host = $host;
    $this->port = $port;
    $this->token = $token;
  }

  public function segmentClean($segments) {
    $command = Miio\newCommand('app_segment_clean', $segments);
    $this->send($command);
  }

  public function zoneClean($zones) {
    $command = Miio\newCommand('app_zoned_clean', $zones);
    $this->send($command);
  }

  public function pause() {
    $command = Miio\newCommand('app_pause');
    $this->send($command);
  }

  public function resume() {
    $command = Miio\newCommand('resume_segment_clean');
    $this->send($command);
  }

  public function charge() {
    $command = Miio\newCommand('app_charge');
    $this->send($command);
  }

  public function status() {
    $command = Miio\newCommand('get_status');
    $status = current($this->send($command));

    $command = Miio\newCommand('get_clean_summary');
    $summary = $this->send($command);

    $record = current($summary[3]);
    if ($record) {
      $command = Miio\newCommand('get_clean_record', [$record]);
      $summary = $this->send($command);

      $lastClean = current($summary);
      $status['last_clean'] = $lastClean;
    }

    return $status;
  }

  private function send($command) {
    $socket = Datagram::open($this->host, $this->port, 3);
    $crypto = new Miio\Crypto($this->token);

    try {
      $packet = Miio\Packet::unpack(Miio\Packet::HELLO);
      $packet = $this->exchange($socket, $packet);

      $data = $crypto->encrypt($command);

      $packet = new Miio\Packet($packet);
      $packet->setPayload($data);
      $packet->setChecksum($this->token);

      $packet = $this->exchange($socket, $packet);

      $data = $packet->getPayload();
      $data = $crypto->decrypt($data);

      return Miio\asResult($data);
    } finally {
      $socket->close();
    }
  }

  private function exchange($socket, $packet) {
    $data = Miio\Packet::pack($packet);
    $socket->write($data);

    $data = $socket->read(2048, false);
    $packet = Miio\Packet::unpack($data);

    return $packet;
  }
}

?>
