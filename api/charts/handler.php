<?php
namespace Http\Handler;
use Http;

class Dataset implements Http\Handler {
  private $dataset;

  public function __construct($dataset) {
    $this->dataset = $dataset;
  }

  public function handle($request, $response) {
    $data = $this->dataset->load();
    $data = iterator_to_array($data);

    $response->setStatus(200);
    $response->setBodyAsJson($data);
    return true;
  }

}

?>
