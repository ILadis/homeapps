<?php
namespace Log;

class LogLevel {
  const ERROR     = 'error';
  const WARN      = 'warn';
  const INFO      = 'info';
  const DEBUG     = 'debug';
}

interface Logger {
  public function error($message, $context = array());
  public function warn($message, $context = array());
  public function info($message, $context = array());
  public function debug($message, $context = array());
}

abstract class BaseLogger implements Logger {
  public function error($message, $context = array()) {
    $this->log(LogLevel::ERROR, $message, $context);
  }

  public function warn($message, $context = array()) {
    $this->log(LogLevel::WARN, $message, $context);
  }

  public function info($message, $context = array()) {
    $this->log(LogLevel::INFO, $message, $context);
  }

  public function debug($message, $context = array()) {
    $this->log(LogLevel::DEBUG, $message, $context);
  }

  abstract protected function log($level, $message, $context = array());
}

class ConsoleLogger extends BaseLogger {

  public static function for($name) {
    return new ConsoleLogger($name);
  }

  private $name = null;

  private function __construct($name) {
    $this->name = strval($name);
  }

  protected function log($level, $message, $context = array()) {
    $date = $this->currentTimestamp();
    $message = $this->interpolateMessage($message, $context);
    $log = sprintf("%s [%9s] --- %s: %s\n", $date, $level, $this->name, $message);
    file_put_contents('php://stdout', $log);
  }

  private function interpolateMessage($message, $context = array()) {
    $replace = array();
    foreach ($context as $key => $val) {
      $replace['{' . $key . '}'] = strval($val);
    }
    return strtr(strval($message), $replace);
  }

  private function currentTimestamp(): string {
    $now = new \DateTime();
    $date = $now->format('Y-m-d H:i:s:v');
    return $date;
  }
}

class NoopLogger extends BaseLogger {

  protected function log($level, $message, $context = array()) {
    // do nothing
  }

}

?>
