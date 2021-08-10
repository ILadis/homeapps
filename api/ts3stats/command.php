<?php
namespace TS3;
use ArrayIterator, Exception;

class Command {
  private $name = '';
  private $parameters = array(), $options = array();

  public function __construct($name = '') {
    $this->name = $name;
  }

  public function setName($name) {
    $this->name = strval($name);
  }

  public function getName() {
    return $this->name;
  }

  public function getParameter($key) {
    return $this->parameters[$key] ?? '';
  }

  public function tryGetParameter($key, &$value) {
    if (array_key_exists($key, $this->parameters)) {
      $value = $this->parameters[$key];
      return true;
    }

    return false;
  }

  public function addParameter($key, $value) {
    $this->parameters[$key] = strval($value);
  }

  public function hasOption($name) {
    return array_key_exists($name, $this->options);
  }

  public function setOption($name) {
    $this->options[$name] = strval($name);
  }

  public static function isSuccessful($commands) {
    foreach ($commands as $command) {
      if ($command->getName() == 'error') {
        $message = $command->getParameter('msg');
        return $message == 'ok';
      }
    }

    return false;
  }

  public function __toString() {
    $command = '';

    if ($this->name != '') {
      $command .= $this->name .' ';
    }

    foreach ($this->parameters as $key => $value) {
      $command .= $key .'='. self::escape($value) .' ';
    }

    foreach ($this->options as $option) {
      $command .= '-'. $option .' ';
    }

    return substr_replace($command, "\n", -1);
  }

  private static function escape($value) {
    $escape = Characters::$NoEscape;
    $cursor = Characters::getIterator($value);

    $value = '';

    foreach ($cursor as $current) {
      if (Characters::isSpecial($current)) {
        $value .= "\\";
        $escape = Characters::$Escape;
      }

      $value .= $escape($current);
      $escape = Characters::$NoEscape;
    }

    return $value;
  }
}

class Parser {

  public function parse($line) {
    $cursor = Characters::getIterator($line);
    $command = new Command();

    while ($this->nextToken($cursor, $token, false)) {
      $current = $cursor->current();

      if (Characters::isSeparator($current)) {
        $this->nextValue($cursor, $value);
        $command->addParameter($token, $value);
      }

      else if (Characters::isDash($current)) {
        $this->nextToken($cursor, $value);
        $command->setOption($value);
      }

      else if (Characters::isTerminator($current)) {
        $command->setName($token);
      }

      else throw new Exception("unexpected character {$current}");

      $current = $cursor->current();

      if (Characters::isSplitterator($current)) {
        yield $command;
        $command = new Command();
      }

      $cursor->next();
    }

    yield $command;
  }

  private function nextToken($cursor, &$value, $next = true) {
    $value = '';

    if ($next) $cursor->next();
    while ($cursor->valid()) {
      $current = $cursor->current();

      if (!Characters::isToken($current)) {
        return true;
      }
  
      $value .= $current;
      $cursor->next();
    }

    return false;
  }

  private function nextValue($cursor, &$value, $next = true) {
    $value = '';
    $escape = Characters::$NoEscape;

    if ($next) $cursor->next();
    while ($cursor->valid()) {
      $current = $cursor->current();

      if (Characters::isEscape($current)) {
        $escape = Characters::$Unescape;
        $cursor->next();
        continue;
      }

      if (Characters::isTerminator($current)) {
        return true;
      }

      $value .= $escape($current);
      $escape = Characters::$NoEscape;
      $cursor->next();
    }

    return false;
  }
}

class Characters {

  public static $NoEscape;
  public static $Unescape;
  public static $Escape;

  public static function getIterator($value) {
    $value = preg_split('//u', $value, -1, PREG_SPLIT_NO_EMPTY);
    return new ArrayIterator($value);
  }

  public static function isTerminator($value) {
    return $value == ' ' || $value == '|' || $value == "\n";
  }

  public static function isSeparator($value) {
    return $value == '=';
  }

  public static function isSplitterator($value) {
    return $value == '|';
  }

  public static function isToken($value) {
    return ($value >= '0' && $value <= '9') || ($value >= 'a' && $value <= 'z') || $value == '_';
  }

  public static function isEscape($value) {
    return $value == "\\";
  }

  public static function isDash($value) {
    return $value == '-';
  }

  public static function isSpecial($value) {
    switch ($value) {
      case  ' ':
      case  '|':
      case '\a':
      case '\b':
      case '\f':
      case '\n':
      case '\r':
      case '\t':
      case '\v': return true;
      default:   return false;
    }
  }

  public static function unescape($value) {
    switch ($value) {
      case 's': return  ' ';
      case 'p': return  '|';
      case 'a': return "\a";
      case 'b': return "\b";
      case 'f': return "\f";
      case 'n': return "\n";
      case 'r': return "\r";
      case 't': return "\t";
      case 'v': return "\v";
      default: return $value;
    }
  }

  public static function escape($value) {
    switch ($value) {
      case  ' ': return 's';
      case  '|': return 'p';
      case "\a": return 'a';
      case "\b": return 'b';
      case "\f": return 'f';
      case "\n": return 'n';
      case "\r": return 'r';
      case "\t": return 't';
      case "\v": return 'v';
      default: return $value;
    }
  }
}

Characters::$NoEscape = fn($value) => $value;
Characters::$Unescape = fn($value) => Characters::unescape($value);
Characters::$Escape   = fn($value) => Characters::escape($value);

?>
