<?php

class ListRecipes implements HttpHandler {
  public function handle($request, $response) {
    $files = array();

    $folder = __DIR__ . '/../recipes';
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
