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

class SavePage implements Http\Handler {
  private $repository;

  public function __construct($repository) {
    $this->repository = $repository;
  }

  public function handle($request, $response) {
    $url = basename($request->getUri()->getPath());
    $url = rawurldecode($url);

    $page = $request->getBodyAsJson();
    $page['url'] = $url;

    $saved = $this->repository->savePage($page);

    if (!$saved) {
      $response->setStatus(400);
      return false;
    }

    $response->setStatus(200);
    $response->setBodyAsJson($page);
    return true;
  }
}

class ListPages implements Http\Handler {
  private $repository;

  public function __construct($repository) {
    $this->repository = $repository;
  }

  public function handle($request, $response) {
    $pages = iterator_to_array($this->repository->listPages());

    $response->setStatus(200);
    $response->setBodyAsJson($pages);
    return true;
  }
}

class DeletePage implements Http\Handler {
  private $repository;

  public function __construct($repository) {
    $this->repository = $repository;
  }

  public function handle($request, $response) {
    $url = basename($request->getUri()->getPath());
    $url = rawurldecode($url);

    $deleted = $this->repository->deletePageByUrl($url);

    if (!$deleted) {
      $response->setStatus(404);
      return false;
    }

    $response->setStatus(204);
    return true;
  }
}

?>
