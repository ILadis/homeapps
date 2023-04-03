<?php
namespace Log;

class LogLevel {
  const ERROR     = 'error';
  const WARN      = 'warn';
  const INFO      = 'info';
  const DEBUG     = 'debug';
}

class ConsoleLogger {

  public static function for($name) {
    return new ConsoleLogger($name);
  }

  private $name = null;

  private function __construct($name) {
    $this->name = strval($name);
  }

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

  private function log($level, $message, $context = array()) {
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
    return strtr($message, $replace);
  }

  private function currentTimestamp(): string {
    $now = new \DateTime();
    $date = $now->format('Y-m-d H:i:s:v');
    return $date;
  }
}

?>
