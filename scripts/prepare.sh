#!/bin/sh

# The Edge application uses WebView components extensively.
# These components need various JS files to operate,
# so this script prepares those.

set -e
cd "$(dirname "$0")/.."

## Fix broken packages:
yarn patch-package

# The `usb` and 'node-hid' modules doesn't properly install on some boxes:
mkdir -p node_modules/usb
touch node_modules/usb/index.js
mkdir -p node_modules/node-hid
touch node_modules/node-hid/index.js

# Fix Android dependencies:
npx jetify

# Copy the API key to native code:
node ./scripts/makeNativeHeaders.js

# Create zcash checkpoints
mkdir -p android/app/build/intermediates/merged_assets/debug/out/saplingtree/mainnet
cp -R node_modules/edge-currency-accountbased/lib/zcash/zecCheckpoints android/app/build/intermediates/merged_assets/debug/out/saplingtree/mainnet 2>/dev/null || :

# Build the EdgeProvider shim code:
node ./node_modules/.bin/rollup -c
node ./scripts/stringifyBridge.js

# Copy pre-built buy/sell plugins:
node ./copy-plugin.js

# Copy edge-core-js WebView contents:
core_assets="./android/app/src/main/assets/edge-core"
if [ -d "$core_assets" ]; then
  rm -r "$core_assets"
fi
mkdir -p "$core_assets"

# Bundle currency, swap, & rate plugins:
echo Webpacking plugins...
node ./node_modules/.bin/webpack
