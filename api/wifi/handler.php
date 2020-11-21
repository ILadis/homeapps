<?php
namespace Http\Handler;
use Http;

class HostapdEnable implements Http\Handler {
  private $hostapd;

  public function __construct($hostapd) {
    $this->hostapd = $hostapd;
  }

  public function handle($request, $response) {
    $success = $this->hostapd->enable();
    $response->setStatus($success ? 200 : 503);
    return true;
  }
}

class HostapdDisable implements Http\Handler {
  private $hostapd;

  public function __construct($hostapd) {
    $this->hostapd = $hostapd;
  }

  public function handle($request, $response) {
    $success = $this->hostapd->disable();
    $response->setStatus($success ? 200 : 503);
    return true;
  }
}

class HostapdStatus implements Http\Handler {
  private $hostapd;

  public function __construct($hostapd) {
    $this->hostapd = $hostapd;
  }

  public function handle($request, $response) {
    $status = $this->hostapd->status();
    $response->setStatus(200);
    $response->setBodyAsJson($status);
    return true;
  }
}

class HostapdStations implements Http\Handler {
  private $hostapd;

  public function __construct($hostapd) {
    $this->hostapd = $hostapd;
  }

  public function handle($request, $response) {
    $stations = $this->hostapd->stations();
    $response->setStatus(200);
    $response->setBodyAsJson($stations);
    return true;
  }
}

?>
