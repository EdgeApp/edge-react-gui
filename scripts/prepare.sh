#!/bin/sh

# The Edge application uses WebView components extensively.
# These components need various JS files to operate,
# so this script prepares those.

set -e
cd "$(dirname "$0")/.."

# Assemble the env.json config file:
node -r sucrase/register ./scripts/configure.ts

## Fix broken packages:
npx patch-package

# Fetch prebuilt native artifacts for packages that ship them via postinstall.
# The repo's .npmrc sets `ignore-scripts=true` (from the npm migration), which
# otherwise suppresses those installers. We run them explicitly here so a clean
# `npm ci` followed by `npm run prepare` produces a buildable tree.
#
# Note: this hook only covers the breez SDK today. If more packages with
# binary-fetching postinstalls land in the future, add them here (or generalize
# this into a script that walks `node_modules` for known-needed postinstalls).
breez_native_pkg=node_modules/@breeztech/breez-sdk-spark-react-native
if [ -d "$breez_native_pkg" ] && \
   [ ! -d "$breez_native_pkg/build/RnBreezSdkSpark.xcframework" ]; then
  echo "Fetching @breeztech/breez-sdk-spark-react-native prebuilt artifacts..."
  ( cd "$breez_native_pkg" && sh scripts/postinstall.sh )
fi

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
npm run typechain

# Bundle currency, swap, & rate plugins:
core_assets="./android/app/src/main/assets/edge-core"
if [ -d "$core_assets" ]; then
  rm -r "$core_assets"
fi
mkdir -p "$core_assets"
echo Webpacking plugins...
node ./node_modules/.bin/webpack
