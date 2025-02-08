<?php
namespace Entity;

class Member {
  public $id;
  public $surname;
  public $firstname;
  public $dateOfBirth;
  public $memberSince;
  public $memberUntil;
  public $street;
  public $zipCode;
  public $city;
  public $phone;
  public $mobile;
  public $email;
  public $tariff;
  public $accountIban;
  public $accountHolder;
}

// TODO add stuff for normalization and validation

class Filters {

  public static function includeAll() {
    return fn($member) => true;
  }

  public static function byIds($ids) {
    return fn($member) => in_array($member->id, $ids);
  }

  public static function byPattern($pattern) {
    return fn($member) => false
      || preg_match($pattern, $member->id) > 0
      || preg_match($pattern, $member->surname) > 0
      || preg_match($pattern, $member->firstname) > 0
      || preg_match($pattern, $member->street) > 0
      || preg_match($pattern, $member->zipCode) > 0
      || preg_match($pattern, $member->city) > 0
      || preg_match($pattern, $member->accountIban) > 0
      || preg_match($pattern, $member->accountHolder) > 0;
  }

}

?>
