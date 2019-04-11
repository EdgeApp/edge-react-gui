#!/bin/sh
# Usage: copy-bitcoin
set -e
src=$(pwd)/../edge-currency-bitcoin/packages/edge-currency-bitcoin/lib/react-native
dest=$(pwd)/node_modules/edge-currency-bitcoin/lib/react-native

mkdir -p $dest

cp -r $src/ $dest/

src=$(pwd)/../edge-currency-bitcoin/packages/nidavellir/lib
dest=$(pwd)/node_modules/nidavellir/lib

mkdir -p $dest

cp -r $src/ $dest/

src=$(pwd)/../edge-currency-bitcoin/packages/nidavellir-networks-unsafe/lib
dest=$(pwd)/node_modules/@nidavellir/networks-unsafe/lib

mkdir -p $dest

cp -r $src/ $dest/

sh postinstall.sh