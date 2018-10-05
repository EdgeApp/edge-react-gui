#!/bin/sh
# Usage: copy-core [path-to-core-ui]
set -e
src=${1:-../edge-components}

dest=node_modules/edge-components
mkdir -p $dest

cp    $src/package.json $dest/package.json
cp -r $src/src/ $dest/src/
