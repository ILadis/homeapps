<?php

trait HttpMessage {
  public function setHeader($name, $value) {
    $this->headers[$name] = $value;
  }

  public function getHeader($name) {
    return $this->headers[$name];
  }

  public function setBody($body) {
    $this->body = $body;
  }

  public function setBodyAsJson($body) {
    $this->headers['Content-Type'] = 'application/json';
    $this->body = json_encode($body);
  }

  public function getBody() {
    return $this->body;
  }

  public function getBodyAsJson() {
    $body = json_decode($this->body, true);
    if (!is_array($body)) {
      return false;
    }

    return (object) $body;
  }
}

class HttpRequest {
  use HttpMessage;
  private $method, $path, $headers, $body;

  public function __construct() {
    $this->method = $_SERVER['REQUEST_METHOD'];
    $this->path = $_SERVER['REQUEST_URI'];
    $this->headers = getallheaders();
    $this->body = file_get_contents('php://input');
  }

  public function getMethod() {
    return $this->method;
  }

  public function getPath() {
    return $this->path;
  }
}

class HttpResponse {
  use HttpMessage;
  private $status, $headers, $body;

  public function __construct() {
    $this->status = 200;
    $this->headers = array();
    $this->body = null;
  }

  public function setStatus($status) {
    $this->status = $status;
  }

  public function send() {
    http_response_code($this->status);
    foreach ($this->headers as $name => $value) {
      header("{$name}: {$value}");
    }
    echo($this->body);
  }
}

interface HttpHandler {
  public function handle($request, $response);
}

class HttpRouter {
  private $routes, $base;

  public function __construct($base = '') {
    $this->routes = array();
    $this->base = $base;
  }

  public function add($method, $uri, $handler) {
    $handler = Closure::fromCallable([$handler, 'handle']);
    $route = new HttpRoute($method, $uri, $handler);
    $this->routes[] = $route;
    return $route;
  }

  public function apply($request, $response) {
    foreach ($this->routes as $route) {
      if ($route->matches($this->base, $request)) {
        $route->activate($request, $response);
        return $route;
      }
    }

    return false;
  }
}

class HttpRoute {
  private $method, $path, $handler;

  public function __construct($method, $path, $handler) {
    $this->method = $method;
    $this->path = $path;
    $this->handler = $handler;
  }

  public function matches($base, $request) {
    return preg_match("|^{$this->method}$|i", $request->getMethod())
      && preg_match("|^{$base}{$this->path}$|i", $request->getPath());
  }

  public function activate($request, $response) {
    $handler = $this->handler;
    $handler($request, $response);
  }
}

?>
