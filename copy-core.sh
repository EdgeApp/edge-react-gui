#!/bin/sh
# Usage: copy-core [path-to-core-libs]
set -e
path=${1:-..}

# Builds and copies the Airbitz core libraries into `node_modules`.
copy_build () {
  (
    cd $path/$1/
    npm run build
  )
  mkdir -p node_modules/$1
  cp $path/$1/package.json node_modules/$1/
  cp -r $path/$1/lib/ node_modules/$1/lib/
}

copy_build airbitz-core-js
copy_build airbitz-currency-shitcoin

