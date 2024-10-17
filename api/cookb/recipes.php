<?php
namespace Recipes;

class Recipe extends \stdClass {

  public function __construct() {
    $this->name = '';
    $this->steps = array();
    $this->ingredients = array();
    $this->setServings(null, 'Portionen');
  }

  public function setName($name) {
    $this->name = $name;
  }

  public function setServings($quantity, $unit) {
    $this->servings = (object) [
      'quantity' => $quantity,
      'unit' => $unit
    ];
  }

  public function addStep($step) {
    $steps = &$this->steps;

    array_push($steps, (object) [
      'step' => $step,
      'ingredients' => [],
    ]);
  }

  public function addIngredient($ingredient, $quantity, $unit) {
    $ingredients = &$this->ingredients;
    $ref = count($ingredients);

    array_push($ingredients, (object) [
      'ingredient' => $ingredient,
      'quantity' => $quantity,
      'unit' => $unit,
    ]);

    $step = end($this->steps);
    $ingredients = &$step->ingredients;

    array_push($ingredients, (object) [
      'quantity' => $quantity,
      'ref' => $ref,
    ]);
  }

}

class Chefkoch {

  const URL_PATTERN = '|^https://www.chefkoch.de/rezepte/(\\d+)/.+$|i';
  const URL_BASE = 'https://api.chefkoch.de/v2/recipes/';

  public static function byUrl($url) {
    $result = preg_match(self::URL_PATTERN, $url, $matches);

    if (!$result) {
      return false;
    }

    $id = $matches[1];
    return self::byId($id);
  }

  public static function byId($id) {
    $url = self::URL_BASE.$id;

    $content = file_get_contents($url);
    if (!is_string($content)) {
      return false;
    }

    $json = json_decode($content, true);
    if (!is_array($json)) {
      return false;
    }

    return self::fromJSON($json);
  }

  private static function fromJSON($json) {
    $recipe = new Recipe();

    $title = self::valueOf($json, ['title'], '');
    $recipe->setName($title);

    $servings = self::valueOf($json, ['servings'], 0);
    $recipe->setServings($servings, 'Portionen');

    $ingredients = self::valueOf($json, ['ingredientGroups', 0, 'ingredients'], []);

    $recipe->addStep('');
    foreach ($ingredients as $ingredient) {
      $name = self::valueOf($ingredient, ['name'], '');
      $amount = self::valueOf($ingredient, ['amount']);
      $unit = self::valueOf($ingredient, ['unit']);

      if (strlen($name) > 0) {
        $recipe->addIngredient($name, $amount, $unit);
      }
    }

    $instructions = self::valueOf($json, ['instructions'], '');
    $steps = explode("\n\n", $instructions);

    foreach ($steps as $step) {
      $recipe->addStep($step);
    }

    return $recipe;
  }

  private static function valueOf($array, $path, $default = null) {
    $value = $array;

    foreach ($path as $key) {
      if (!array_key_exists($key, $value)) {
        return $default;
      }

      $value = $value[$key];
    }

    return $value;
  }
}

?>
