<?php
namespace Http\Handler;
use Http, TS3;

class ServerInfo implements Http\Handler {
  private $session;

  public function __construct($session) {
    $this->session = $session;
  }

  public function handle($request, $response) {
    $command = new TS3\Command('serverinfo');
    $infos = $this->session->exchange($command);

    foreach ($infos as $info) {
      $info->tryGetParameter('virtualserver_name', $name);
      $info->tryGetParameter('virtualserver_version', $version);
      $info->tryGetParameter('virtualserver_clientsonline', $clients);
      $info->tryGetParameter('virtualserver_uptime', $uptime);
    }

    $info = array(
      'name' => strval($name),
      'version' => strval($version),
      'clients' => intval($clients),
      'uptime' => intval($uptime)
    );

    $response->setStatus(200);
    $response->setBodyAsJson($info);
    return true;
  }
}

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
