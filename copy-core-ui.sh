#!/bin/sh
# Usage: copy-core [path-to-core-ui]
set -e
src=${1:-../airbitz-core-js-ui}

dest=node_modules/airbitz-core-js-ui
mkdir -p $dest

cp    $src/package.json $dest/package.json
cp -r $src/assets/ $dest/assets/
cp -r $src/lib/ $dest/lib/
cp -r $src/src/ $dest/src/
