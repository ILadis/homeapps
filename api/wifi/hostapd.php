<?php
namespace Hostapd;
use IO\UnixDatagram, Exception;

/* To connect to hostapd socket via bsd netcat:
 *   nc -uU /var/run/hostapd/wlan0
 *
 * More information on available hostapd commands can be found here:
 *   https://w1.fi/cgit/hostap/tree/hostapd/ctrl_iface.c#n3323
 */

class Client {

  private $socket;

  public function __construct($socket) {
    $this->socket = $socket;
  }

  public function ping() {
    $result = $this->exchange('PING');
    return $result == "PONG\n";
  }

  public function enable() {
    $result = $this->exchange('ENABLE');
    return $result == "OK\n";
  }

  public function disable() {
    $result = $this->exchange('DISABLE');
    return $result == "OK\n";
  }

  public function status() {
    $result = $this->exchange('STATUS');
    preg_match_all('/^([^=]+)=(.+)$/m', $result, $matches);
    $status = array_combine($matches[1], $matches[2]);
    return $status;
  }

  public function stations() {
    $stations = array();

    $result = $this->exchange('STA-FIRST');
    $address = strtok($result, "\n");

    while ($address != '') {
      $stations[] = $address;

      $result = $this->exchange("STA-NEXT {$address}");
      $address = strtok($result, "\n");
    }

    return $stations;
  }

  private function exchange($command) {
    $socket = UnixDatagram::open($this->socket);

    try {
      $socket->write($command);
      return $socket->read(2048, false);
    } finally {
      $socket->close();
    }
  }
}

?>
