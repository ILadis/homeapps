<?php
namespace TS3;
use IO\Socket;

class Session {

  private $client;
  private $username, $password, $serverId;

  public function __construct($client) {
    $this->client = $client;
  }

  public function use($username, $password, $serverId) {
    $this->username = $username;
    $this->password = $password;
    $this->serverId = $serverId;
  }

  public function exchange($command) {
    $this->client->connect();
    $this->client->skipWelcome();

    $login = new Command('login');
    $login->addParameter('client_login_name', $this->username);
    $login->addParameter('client_login_password', $this->password);

    $this->client->send($login);
    $this->client->receive();

    $use = new Command('use');
    $use->addParameter('sid', $this->serverId);

    $this->client->send($use);
    $this->client->receive();

    $this->client->send($command);
    $commands = $this->client->receive();

    $quit = new Command('quit');
    $this->client->send($quit);
    $this->client->disconnect();

    return $commands;
  }
}

class Client {
  private $socket;
  private $host, $port;

  public function __construct($host, $port) {
    $this->host = $host;
    $this->port = $port;
  }

  public function connect() {
    $this->socket = Socket::connect($this->host, $this->port);
  }

  public function skipWelcome() {
    $welcomes = 2;

    while ($welcomes > 0) {
      $line = trim($this->socket->readLine());

      if (strncmp('TS3', $line, 3) === 0) $welcomes--;
      if (strncmp('Welcome', $line, 7) === 0) $welcomes--;
    }
  }

  public function send($command) {
    $this->socket->writeLine(strval($command));
  }

  public function receive() {
    $parser = new Parser();

    while (true) {
      $line = trim($this->socket->readLine());
      if ($line == '') continue;

      $commands = $parser->parse($line ."\n");
      return iterator_to_array($commands);
    }
  }

  public function disconnect() {
    $this->socket->close();
  }
}

?>
