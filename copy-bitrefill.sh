#!/bin/sh
# Usage: copy-core [path-to-core-ui]
set -e
src=${1:-../edge-plugin-bitrefill}

dest=node_modules/edge-plugin-bitrefill
mkdir -p $dest

cp    $src/package.json $dest/package.json
cp    $src/manifest.json $dest/manifest.json
cp -r $src/src/ $dest/src/
cp -r $src/target/ $dest/target/
node copy-plugin.js
