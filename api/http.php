<?php
namespace Http;
use Closure, Exception;

class Request {
  protected $method, $uri, $headers, $body;

  public function __construct(&$method, &$uri, &$headers, &$body) {
    $this->method =& $method;
    $this->uri =& $uri;
    $this->headers =& $headers;
    $this->body =& $body;
  }

  public function getMethod() {
    return $this->method;
  }

  public function getUri() {
    return $this->uri;
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
  $uri = Uri::parse($_SERVER['REQUEST_URI']);
  $headers = getallheaders();
  $body = fopen('php://input', 'r');

  return new class($method, $uri, $headers, $body)
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

function serveUrl($url) {
  return function($request, $response) use ($url) {
    $contents = file_get_contents($url);
    $size = strlen($contents);
    $mime = MediaType::fromFileExt($url);

    $response->setStatus(200);
    $response->setHeader('Content-Type', $mime);
    $response->setHeader('Content-Length', $size);
    fwrite($response->getBody(), $contents);
  };
}

function serveBase64Encoded($data, $mime) {
  return function($request, $response) use ($data, $mime) {
    $body = base64_decode($data);
    $size = strlen($body);

    $response->setStatus(200);
    $response->setHeader('Content-Type', $mime);
    $response->setHeader('Content-Length', $size);
    fwrite($response->getBody(), $body);
  };
}

class Uri {
  public static function parse($uri) {
    $parts = parse_url($uri);
    if (!$parts) {
      throw new Exception('could not parse malformed uri');
    }

    $path = $parts['path'] ?? '';
    $query = $parts['query'] ?? '';
    parse_str($query, $params);

    return new Uri($path, $params);
  }

  private $path, $query;

  public function __construct($path, $query) {
    $this->path = $path;
    $this->query = $query;
  }

  public function getPath() {
    return $this->path;
  }

  public function getQueryParam($name, $default = null) {
    return $this->query[$name] ?? $default;
  }
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
      && preg_match("|^{$base}{$this->path}$|i", $request->getUri()->getPath());
  }

  public function activate($request, $response) {
    $handler = $this->handler;
    $handler($request, $response);
  }
}

?>
