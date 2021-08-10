<?php
namespace Http\Handler;
use Http, TS3;

class ListClients implements Http\Handler {
  private $session;

  public function __construct($session) {
    $this->session = $session;
  }

  public function handle($request, $response) {
    $command = new TS3\Command('clientlist');
    $clients = $this->session->exchange($command);

    $nicknames = array();
    foreach ($clients as $client) {
      if ($client->tryGetParameter('client_nickname', $nickname)) {
        if ($client->getParameter('client_type') == '0') {
          array_push($nicknames, $nickname);
        }
      }
    }

    $response->setStatus(200);
    $response->setBodyAsJson($nicknames);
    return true;
  }
}

?>
