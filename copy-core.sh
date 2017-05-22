#!/bin/sh
set -e

# Builds and copies the Airbitz core libraries into `node_modules`.
copy_build () {
  (
    cd ../$1/
    npm run build
  )
  cp ../$1/package.json node_modules/$1/
  cp -r ../$1/lib/ node_modules/$1/lib/
}

copy_build airbitz-core-js
copy_build airbitz-txlib-shitcoin