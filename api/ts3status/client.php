<?php
namespace TS3;
use IO\Socket;

class Client {
  private $socket, $welcome;
  private $host, $port;

  public function __construct($host, $port) {
    $this->socket = false;
    $this->welcome = false;
    $this->host = $host;
    $this->port = $port;
  }

  public function exchange($command) {
    $this->connect();
    $this->skipWelcome();

    $this->send($command);
    return $this->receive();
  }

  private function connect() {
    if ($this->socket !== false) return;
    $this->socket = Socket::connect($this->host, $this->port);
  }

  private function skipWelcome() {
    if ($this->welcome !== false) return;
    $this->welcome = true;

    $welcomes = 2;

    while ($welcomes > 0) {
      $line = trim($this->socket->readLine());

      if (strncmp('TS3', $line, 3) === 0) $welcomes--;
      if (strncmp('Welcome', $line, 7) === 0) $welcomes--;
    }
  }

  private function send($command) {
    $this->socket->writeLine(strval($command));
  }

  private function receive() {
    $parser = new Parser();

    while (true) {
      $line = trim($this->socket->readLine());
      if ($line == '') continue;

      $commands = $parser->parse($line ."\n");
      return iterator_to_array($commands);
    }
  }
}

?>
