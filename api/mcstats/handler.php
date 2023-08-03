<?php
namespace Http\Handler;
use Http;

class ServerInfo implements Http\Handler {
  private $session;
  private $ping;

  public function __construct($session, $ping) {
    $this->session = $session;
    $this->ping = $ping;
  }

  public function handle($request, $response) {
    $responses = $this->session->run(['/time query day']);

    $time = $responses->current();
    $days = $this->extract('/The time is (\d+)/', $time, 0);

    $this->ping->connect();
    $query = $this->ping->query();

    $info = array(
      'name' => strval($query['description']['text']),
      'version' => strval($query['version']['name']),
      'players' => intval($query['players']['online']),
      'days' => intval($days)
    );

    $response->setStatus(200);
    $response->setBodyAsJson($info);
    return true;
  }

  private function extract($pattern, $subject, $fallback) {
    return preg_match($pattern, $subject, $matches) ? $matches[1] : $fallback;
  }
}

class ListPlayers implements Http\Handler {
  private $session;

  public function __construct($session) {
    $this->session = $session;
  }

  public function handle($request, $response) {
    $responses = $this->session->run(['/list']);
    $list = $responses->current();

    $parts = explode(': ', $list, 2);
    $players = explode(', ', $parts[1] ?? '');

    $response->setStatus(200);
    $response->setBodyAsJson($players);
    return true;
  }
}

?>
