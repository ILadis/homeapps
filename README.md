# Homeapps
*Homeapps* is a collection of custom web apps I run on my local network through a [Raspberry Pi](https://www.raspberrypi.org/).

<p align="middle">
  <img src="https://user-images.githubusercontent.com/7196536/101411268-f938a180-38e0-11eb-9c88-274496c53a5f.png" width="30%" hspace="1%">
  <img src="https://user-images.githubusercontent.com/7196536/101411288-035aa000-38e1-11eb-9015-121aa6809dd0.png" width="30%" hspace="1%">
  <img src="https://user-images.githubusercontent.com/7196536/101411299-0786bd80-38e1-11eb-8f89-242e232a1636.png" width="30%" hspace="1%">
</p>

All web apps can be deployed independently and only require a recent version of [PHP](https://www.php.net/) to run. [Configuration](#configuration) is done using environment variables.

## Documents
Documents is a simple documents manager where you can upload, tag, search and view your documents. If you own a [Brother DS-940DW](https://www.brother-usa.com/products/ds940dw) document scanner you can scan documents right within the web app and convert them to the Portable Document Format (PDF).

Required PHP extensions:
- `sqlite3`: for document storage
- `sockets`: for accessing TCP stack
- `gd`: for image operations

Example:
```sh
env BASE='/docs' DEVICE='192.168.178.2' php -S localhost:8080 docs.php
```

## Roborock
Roborock is a simple web app that can be used to control a Xiaomi Roborock vacuum cleaner. Only the most basic functionality is currently implemented.

Required PHP extensions:
- `sockets`: for accessing UDP stack
- `openssl`: for encrypting/decrypting UDP packages

Example:
```sh
env BASE='/robo' DEVICE='192.168.178.2' TOKEN='440e2c...' php -S localhost:8080 robo.php
```

## WiFi
WiFi is a simple on/off switch for a `hostapd` controlled access point.

Required PHP extensions:
- `sockets`: for accessing unix UDP sockets

Example:
```sh
env BASE='/wifi' IFACE='/var/run/...' QRCODE='iVBORw0KGgo...' php -S localhost:8080 robo.php
```

## Configuration
The following environment variables must be set to configure the various web apps.

#### Base URI
All web apps must be launched with a base URI. This may be useful when running behind a reverse proxy.

Example:
```sh
env BASE='/docs' php -S localhost:8080 docs.php
```

#### Brother DS-940DW
The IP address of the Brother DS-940DW document scanner on your network.

Example:
```sh
env DEVICE='192.168.178.2' php -S localhost:8080 docs.php
```

#### Xiaomi Roborock S5
The IP address of the Xiaomi Roborock S5 robot vacuum on your network.

Example:
```sh
env DEVICE='192.168.178.2' php -S localhost:8080 robo.php
```

The secret token of the Xiaomi Roborock S5 robot vacuum encoded in HEX.

Example:
```sh
env TOKEN='440e2c...' php -S localhost:8080 robo.php
```

#### Hostapd control interface
The path to the `hostapd` control interface/socket that should be used.

Example:
```sh
env IFACE='/var/run/hostapd/wlan0' php -S localhost:8080 wifi.php
```

#### WiFi QR Code
A Base64 encoded Portable Network Graphic (PNG) containing WiFi credentials.

Example:
```sh
env QRCODE='iVBORw0KGgoAAAANSUh...' php -S localhost:8080 wifi.php
```
