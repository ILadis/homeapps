<?php

class HttpRequest {
  public $method, $uri, $headers, $body;

  public function __construct() {
    $this->method = $_SERVER['REQUEST_METHOD'];
    $this->uri = $_SERVER['REQUEST_URI'];
    $this->headers = getallheaders();
    $this->body = file_get_contents('php://input');
  }
}

class HttpResponse {
  public $status, $headers, $body;

  public function __construct() {
    $this->status = 200;
    $this->headers = array();
    $this->body = null;
  }

  public function send() {
    http_response_code($this->status);
    foreach ($this->headers as $name => $value) {
      header("{$name}: {$value}");
    }
    echo $this->body;
  }
}

interface HttpHandler {
  public function handle($request, $response);
}

class HttpRouter {
  private $routes;

  public function __construct() {
    $this->routes = array();
  }

  public function add($method, $uri, $handler) {
    $handler = Closure::fromCallable([$handler, 'handle']);
    $route = new HttpRoute($method, $uri, $handler);
    $this->routes[] = $route;
    return $route;
  }

  public function apply($request, $response) {
    foreach ($this->routes as $route) {
      if ($route->matches($request)) {
        $route->activate($request, $response);
        return $route;
      }
    }

    return false;
  }
}

class HttpRoute {
  private $method, $uri, $handler;

  public function __construct($method, $uri, $handler) {
    $this->method = $method;
    $this->uri = $uri;
    $this->handler = $handler;
  }

  public function matches($request) {
    return preg_match("|^{$this->method}$|i", $request->method)
      && preg_match("|^{$this->uri}$|i", $request->uri);
  }

  public function activate($request, $response) {
    $handler = $this->handler;
    $handler($request, $response);
  }
}

?>
