<?php
namespace Http\Handler;
use Http;

class InspectPage implements Http\Handler {

  public function handle($request, $response) {
    $url = $request->getBodyAsText();

    $inspector = \Inspector::forUrl($url);
    if (!$inspector) {
      $response->setStatus(500);
      return true;
    }

    $title = $inspector->inspectTitle();
    $favicon = $inspector->inspectFavicon();

    $page = [
      'title' => $title,
      'favicon' => $favicon,
      'url' => $url
    ];

    $response->setStatus(200);
    $response->setBodyAsJson($page);
    return true;
  }
}

?>
