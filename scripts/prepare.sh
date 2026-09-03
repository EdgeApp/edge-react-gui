#!/bin/sh

# The Edge application uses WebView components extensively.
# These components need various JS files to operate,
# so this script prepares those.

set -e
cd "$(dirname "$0")/.."

# Assemble the config.json config file:
node -r sucrase/register ./scripts/configure.ts

## Fix broken packages:
npx patch-package

# Fix Android dependency import statments:
# Old native Android dependencies use outdated package names for their imports
# that were later renamed by Google.
npx jetify

# Generate XOR-split API secret C sources for native HMAC signing, then copy
# the public apiKey into EdgeApiKey.swift/java. Order matters: makeApiSigner
# may force a stub placeholder when apiSecret is missing, and makeNativeHeaders
# must write the same public key EdgeApiSigner will advertise.
# Stub allowed here so `npm ci` / prepare can run before secretFiles lands edgeKey.json;
# Android/iOS generate tasks re-run without this flag once the real secret is present.
EDGE_API_SIGNER_ALLOW_STUB=1 node -r sucrase/register ./scripts/makeApiSigner.ts
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

# Regenerate the API reference and the CLI's command table and help text
# from the route declarations. All are committed, so a fresh clone works
# without this; the writes are skipped when nothing changed, so prepare never
# dirties git.
npm run docs:api

# Create contract type definitions:
npm run typechain
