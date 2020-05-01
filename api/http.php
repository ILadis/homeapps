<?php
namespace Http;
use Closure;

class Request {
  protected $method, $path, $headers, $body;

  public function __construct(&$method, &$path, &$headers, &$body) {
    $this->method =& $method;
    $this->path =& $path;
    $this->headers =& $headers;
    $this->body =& $body;
  }

  public function getMethod() {
    return $this->method;
  }

  public function getPath() {
    return $this->path;
  }

  public function getHeader($name) {
    return $this->headers[$name];
  }

  public function getBody() {
    return $this->body;
  }
}

class Response {
  protected $status, $headers, $body;

  public function __construct(&$status, &$headers, &$body) {
    $this->status =& $status;
    $this->headers =& $headers;
    $this->body =& $body;
  }

  public function setStatus($status) {
    $this->status = $status;
  }

  public function getStatus() {
    return $this->status;
  }

  public function setHeader($name, $value) {
    $this->headers[$name] = $value;
  }

  public function getHeader($name) {
    return $this->headers[$name];
  }

  public function getBody() {
    return $this->body;
  }
}

function newRequest() {
  $method = $_SERVER['REQUEST_METHOD'];
  $path = $_SERVER['REQUEST_URI'];
  $headers = getallheaders();
  $body = fopen('php://input', 'r');

  return new class($method, $path, $headers, $body)
    extends Request { use JsonBody; };
}

function newResponse() {
  $status = 200;
  $headers = array();
  $body = fopen('php://output', 'wb');

  header_register_callback(function() use (&$status, &$headers) {
    http_response_code($status);
    foreach ($headers as $name => $value) {
      header("{$name}: {$value}");
    }
  });

  return new class($status, $headers, $body)
    extends Response { use JsonBody; };
}

trait JsonBody {
  public function setBodyAsJson($body) {
    $this->headers['Content-Type'] = 'application/json';
    fwrite($this->body, json_encode($body));
  }

  public function getBodyAsJson() {
    $body = stream_get_contents($this->body);
    $json = json_decode($body, true);
    return (object) $json;
  }
}

interface Handler {
  public function handle($request, $response);
}

class Router {
  private $routes, $base;

  public function __construct($base = '') {
    $this->routes = array();
    $this->base = $base;
  }

  public function add($method, $uri, $handler) {
    if ($handler instanceof Handler) {
      $handler = Closure::fromCallable([$handler, 'handle']);
    }
    $route = new Route($method, $uri, $handler);
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

class Route {
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
