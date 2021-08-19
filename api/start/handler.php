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

class CreateUser implements Http\Handler {
  private $repository;

  public function __construct($repository) {
    $this->repository = $repository;
  }

  public function handle($request, $response) {
    $name = $request->getBodyAsText();

    $user = $this->repository->createUser($name);
    if (!$user) {
      $response->setStatus(400);
      return false;
    }

    $response->setStatus(200);
    $response->setBodyAsJson($user);
    return true;
  }
}

class ListUsers implements Http\Handler {
  private $repository;

  public function __construct($repository) {
    $this->repository = $repository;
  }

  public function handle($request, $response) {
    $users = iterator_to_array($this->repository->listUsers());

    $response->setStatus(200);
    $response->setBodyAsJson($users);
    return true;
  }
}

class SavePage implements Http\Handler {
  private $repository;

  public function __construct($repository) {
    $this->repository = $repository;
  }

  public function handle($request, $response) {
    $auth = $request->getHeader('Authorization');
    $token = preg_replace('/Bearer\s+/i', '', strval($auth));

    if (!$auth || !$token) {
      $response->setStatus(400);
      return false;
    }

    $url = basename($request->getUri()->getPath());
    $url = rawurldecode($url);

    $page = $request->getBodyAsJson();
    $page['url'] = $url;

    $saved = $this->repository->savePage($page, $token);
    if ($saved === false) {
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
    $auth = $request->getHeader('Authorization');
    $token = preg_replace('/Bearer\s+/i', '', strval($auth));

    if (!$auth || !$token) {
      $response->setStatus(403);
      return false;
    }

    $pages = iterator_to_array($this->repository->listPages($token));
    if ($pages === false) {
      $response->setStatus(403);
      return false;
    }

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
