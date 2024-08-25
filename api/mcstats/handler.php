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
      'name' => $this->text($query['description']),
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

  // parse variable as text component, see:
  // https://wiki.vg/Text_formatting#Text_components
  private function text($component) {
    if (is_string($component)) {
      return $component;
    } else if (array_key_exists($component, 'text')) {
      return strval($component['text']);
    } else {
      return '';
    }
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

    $players = $this->extract($list);

    $response->setStatus(200);
    $response->setBodyAsJson($players);
    return true;
  }

  private function extract($list) {
    $parts = explode(': ', $list, 2);
    $items = explode(', ', $parts[1] ?? '');
    return count($items) == 1 && trim($items[0]) == '' ? array() : $items;
  }
}

?>
