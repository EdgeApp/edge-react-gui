#!/bin/sh

# The Edge application uses WebView components extensively.
# These components need various JS files to operate,
# so this script prepares those.

set -e
cd "$(dirname "$0")/.."

# Assemble the env.json config file:
node -r sucrase/register ./scripts/configure.ts

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
node -r sucrase/register ./scripts/makeNativeHeaders.ts

# Create zcash checkpoints
mkdir -p android/app/src/main/assets/saplingtree/mainnet
cp -R node_modules/edge-currency-accountbased/lib/zcash/zecCheckpoints/ android/app/src/main/assets/saplingtree/mainnet 2>/dev/null || :
cp -R node_modules/edge-currency-accountbased/lib/zcash/zecCheckpoints/ ios/Pods/ZcashLightClientKit/Sources/ZcashLightClientKit/Resources/saplingtree-checkpoints/mainnet 2>/dev/null || :

# Create piratechain checkpoints
mkdir -p android/app/src/main/assets/piratesaplingtree/mainnet
cp -R node_modules/edge-currency-accountbased/lib/zcash/arrrCheckpoints/ android/app/src/main/assets/piratesaplingtree/mainnet 2>/dev/null || :
cp -R node_modules/edge-currency-accountbased/lib/zcash/arrrCheckpoints/ ios/Pods/PirateLightClientKit/Sources/PirateLightClientKit/Resources/piratesaplingtree-checkpoints/mainnet 2>/dev/null || :

# Copy Firebase configs
if [ ! -f "ios/edge/GoogleService-Info.plist" ]; then
  cp ios/edge/GoogleService-Info.sample.plist ios/edge/GoogleService-Info.plist
fi
if [ ! -f "android/app/google-services.json" ]; then
  cp android/app/google-services.sample.json android/app/google-services.json
fi

# Build the EdgeProvider shim code:
node ./node_modules/.bin/rollup -c
node -r sucrase/register ./scripts/stringifyBridge.ts

# Copy pre-built buy/sell plugins:
node -r sucrase/register ./scripts/copy-plugin.ts

# Copy edge-core-js WebView contents:
core_assets="./android/app/src/main/assets/edge-core"
if [ -d "$core_assets" ]; then
  rm -r "$core_assets"
fi
mkdir -p "$core_assets"

# Bundle currency, swap, & rate plugins:
echo Webpacking plugins...
node ./node_modules/.bin/webpack
