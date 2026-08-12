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

# Assemble the Pirate Chain XCFramework:
# react-native-pirate-wallet ships its iOS slices as separate binary packages and
# stitches them together in its own postinstall, which never runs because this
# repo sets ignore-scripts. Its podspec vendors the assembled framework, so this
# has to happen before `pod install`. The script no-ops off macOS.
node ./node_modules/react-native-pirate-wallet/scripts/assemble-ios-framework.js

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
