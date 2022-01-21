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
node ./node_modules/edge-currency-accountbased/bin/zecCheckpoints.js || true

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
cp ./node_modules/edge-core-js/lib/react-native/edge-core.js "$core_assets"

# Write out an edge-core-js index.html file:
cat >"$core_assets/index.html" <<HTML
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
  </head>
  <body>
    <script src="edge-core.js"></script>
    <script>
      function load() {
        var script = document.createElement('script')
        script.charset = 'utf-8'
        script.async = true
        script.addEventListener('error', window.lockEdgeCorePlugins)
        script.addEventListener('load', window.lockEdgeCorePlugins)
        script.src = 'plugin-bundle.js'
        document.head.appendChild(script)
      }
      setTimeout(load, 200)
    </script>
  </body>
</html>
HTML

# Bundle currency, swap, & rate plugins:
echo Webpacking plugins...
node ./node_modules/.bin/webpack
