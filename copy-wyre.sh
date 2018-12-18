#!/bin/sh
# Usage: copy-wyre [path-to-core-ui]
set -e
src=${1:-../edge-plugin-skeleton/target}

dest=ios//plugins/co.edgesecure.wyre
mkdir -p $dest

cp -r $src/ $dest/
