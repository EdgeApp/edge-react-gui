#!/usr/bin/env bash
# Generate secret shards from edgeCliKey.json and build the Node N-API Edge
# API HMAC signer. The addon is what `publish:cli --with-signer` ships, so it
# takes the CLI's own key pair and never the app's edgeKey.json. Requires a
# real apiSecret — refuses to link a stub addon.
set -euo pipefail
cd "$(dirname "$0")/.."

if [ ! -f edgeCliKey.json ]; then
  echo "error: edgeCliKey.json required to build the Node API signer (the CLI's own key pair, never the app's edgeKey.json)" >&2
  exit 1
fi

node -r sucrase/register ./scripts/makeApiSigner.ts --cli

NODE_DIR=native/edge-api-signer/node
if [ ! -f "$NODE_DIR/edge_api_secret.c" ]; then
  echo "error: $NODE_DIR/edge_api_secret.c missing (edgeCliKey.json apiSecret required)" >&2
  exit 1
fi

(
  cd "$NODE_DIR"
  node ../../../node_modules/node-gyp/bin/node-gyp.js configure
  node ../../../node_modules/node-gyp/bin/node-gyp.js build
)

echo "built $NODE_DIR/build/Release/edge_api_signer.node"
