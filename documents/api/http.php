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

  public function getHeader($name, $default = null) {
    return $this->headers[$name] ?? $default;
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
    extends Request { use TextBody, JsonBody; };
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
    extends Response { use TextBody, JsonBody; };
}

trait TextBody {
  public function setBodyAsText($body) {
    $this->headers['Content-Type'] = 'text/plain';
    $this->headers['Content-Length'] = strlen($body);
    fwrite($this->body, $body);
  }

  public function getBodyAsText() {
    return stream_get_contents($this->body);
  }
}

trait JsonBody {
  public function setBodyAsJson($body) {
    $json = json_encode($body);
    $this->headers['Content-Type'] = 'application/json';
    $this->headers['Content-Length'] = strlen($json);
    fwrite($this->body, $json);
  }

  public function getBodyAsJson() {
    $body = stream_get_contents($this->body);
    $json = json_decode($body, true);
    return $json;
  }
}

interface Handler {
  public function handle($request, $response);
}

class MediaType {
  private static $fallback = 'application/octet-stream';
  private static $exts = array(
    'html' => 'text/html',
    'css'  => 'text/css',
    'js'   => 'text/javascript',
    'svg'  => 'image/svg+xml',
    'png'  => 'image/png',
    'json' => 'application/json',
    'webmanifest' => 'application/manifest+json',
  );

  public static function fromFileExt($file) {
    $ext = pathinfo($file, PATHINFO_EXTENSION);
    if (array_key_exists($ext, MediaType::$exts)) {
      return MediaType::$exts[$ext];
    }

    return MediaType::$fallback;
  }
}

function serveRedirect($location) {
  return function($request, $response) use ($location) {
    $response->setStatus(301);
    $response->setHeader('Location', $location);
  };
}

function serveFile($file) {
  return function($request, $response) use ($file) {
    $fd = fopen($file, 'rb');
    $size = filesize($file);
    $mime = MediaType::fromFileExt($file);

    $response->setStatus(200);
    $response->setHeader('Content-Type', $mime);
    $response->setHeader('Content-Length', $size);
    stream_copy_to_stream($fd, $response->getBody());
  };
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
