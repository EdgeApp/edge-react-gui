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

# Fix Android dependency import statments:
# Old native Android dependencies use outdated package names for their imports
# that were later renamed by Google.
npx jetify

# Copy the API key to native code:
node -r sucrase/register ./scripts/makeNativeHeaders.ts

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

# Create contract type definitions:
yarn typechain

# Bundle currency, swap, & rate plugins:
core_assets="./android/app/src/main/assets/edge-core"
if [ -d "$core_assets" ]; then
  rm -r "$core_assets"
fi
mkdir -p "$core_assets"
echo Webpacking plugins...
node ./node_modules/.bin/webpack
