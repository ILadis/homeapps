<?php
namespace Http\Handler;
use Http, IO\CSV, Entity\Filters;

class ShowMember implements Http\Handler {
  private $repository;

  public function __construct($repository) {
    $this->repository = $repository;
  }

  public function handle($request, $response) {
    $member = $this->findMember($request);

    if ($member === false) {
      $response->setStatus(404);
      return false;
    }

    $response->setStatus(200);
    $response->setBodyAsJson($members[0]);
    return true;
  }

  protected function findMember($request) {
    $id = basename($request->getUri()->getPath());
    $filter = Filters::byIds([$id]);

    $members = iterator_to_array($this->repository->findMembers($filter));
    return count($members) != 1 ? false : $members[0];
  }
}

class ListMembers implements Http\Handler {
  private $repository;

  public function __construct($repository) {
    $this->repository = $repository;
  }

  public function handle($request, $response) {
    $members = $this->findMembers($request);

    $response->setStatus(200);
    $response->setBodyAsJson($members);
    return true;
  }

  protected function findMembers($request) {
    $search = $request->getUri()->getQueryParam('search', false);
    $filter = $search !== false
        ? Filters::byPattern("/{$search}/i")
        : Filters::includeAll();

    return iterator_to_array($this->repository->findMembers($filter));
  }
}

class ExportMembers extends ListMembers {

  public function handle($request, $response) {
    $template = $this->newTemplate($request);
    $members = $this->findMembers($request);

    $response->setStatus(200);
    $response->setHeader('Content-Type', 'text/xml');

    $template->render($response->getBody(), $members);
    return true;
  }

  private function newTemplate($request) {
    $source = CSV\DataSource::from($request->getBody());

    $headers = $source->read();
    $fields = $source->read();
    $source->close();

    return new CSV\Template($headers, $fields);
  }
}

?>
