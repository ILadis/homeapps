<?php

class ResponseStatus implements HttpHandler {
  private $status;

  public function __construct($status) {
    $this->status = $status;
  }

  public function handle($request, $response) {
    $response->status = $this->status;
  }
}

class ListRecipes implements HttpHandler {

  public function handle($request, $response) {
    $files = array();

    $folder = dirname(__FILE__) . '/../recipes';
    $dir = new DirectoryIterator($folder);

    foreach ($dir as $file) {
      $ext = $file->getExtension();
      $name = $file->getFilename();

      if ($ext != 'json') {
        continue;
      }

      $files[] = [
        'name' => $name
      ];
    }

    $response->headers['Content-Type'] = 'application/json';
    $response->body = json_encode($files);
  }
}

?>
