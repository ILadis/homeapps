<?php
namespace Image;
use Exception;

function pipe(...$ops) {
  return function($image = null) use (&$ops) {
    foreach ($ops as $op) {
      $image = $op($image);
      if (!$image) {
        throw new Exception('failed image operation');
      }
    }

    return $image;
  };
}

function read($fd) {
  return function() use ($fd) {
    $data = '';
    while ($chunk = fread($fd, 1024)) {
      $data .= $chunk;
    }
    return imagecreatefromstring($data);
  };
}

function scale($value = 1) {
  return function($image) use ($value) {
    $width = round(imagesx($image) * $value);
    $height = round(imagesy($image) * $value);
    $scaled = imagescale($image, $width, $height, IMG_NEAREST_NEIGHBOUR);
    imagedestroy($image);
    return $scaled;
  };
}

function dimensions(&$width, &$height) {
  return function($image) use (&$width, &$height) {
    $width = imagesx($image);
    $height = imagesy($image);
    return $image;
  };
}

function crop($color = 255255255, $threshold = 1) {
  return function($image) use ($color, $threshold) {
    $croped = imagecropauto($image , IMG_CROP_THRESHOLD, $threshold, $color);
    imagedestroy($image);
    return $croped;
  };
}

function write($fd, $reset = false) {
  return function($image) use ($fd, $reset) {
    if ($reset) fseek($fd, 0);
    imagejpeg($image, $fd, 100);
    return $image;
  };
}

?>
