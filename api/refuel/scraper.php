<?php
namespace Fuel;
use Web;

class WebScraper {
  use Web\Scraper;

  public static function loadWithId($id) {
    return self::load("https://www.clever-tanken.de/tankstelle_details/{$id}");
  }

  public function getPrices() {
    $query = '//div[@id = "prices-container"]';
    $node = $this->queryOne($query);

    if ($node) {
      $names  = $this->queryAll('.//div[@class = "price-type-name"]', $node);
      $prices = $this->queryAll('.//div[@class = "price-field"]', $node);

      for ($i = 0; $i < $names->length; $i++) {
        $name = $this->textOf($names->item($i));
        $price = $this->textOf($prices->item($i));

        yield [
          'name'  => $name,
          'value' => $price,
        ];
      }
    }
  }

  private function textOf($node) {
    return preg_replace('/\s+/', '', $node->textContent);
  }

}

?>