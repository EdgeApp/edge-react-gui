#!/bin/sh
# Usage: copy-core [path-to-core-libs]
set -e
path=${1:-..}

# Builds and copies the Airbitz core libraries into `node_modules`.
copy_build () {
  # Build the library:
  (
    cd $path/$1/
    npm run build
  )

  # Prepare a home in node_modules:
  mkdir -p node_modules/$1
  rm -r node_modules/$1/lib/
  rm -r node_modules/$1/src/

  # Copy the library:
  cp $path/$1/package.json node_modules/$1/
  cp -r $path/$1/lib/ node_modules/$1/lib/
  cp -r $path/$1/src/ node_modules/$1/src/
}

copy_build edge-core-js
npm run postinstall
