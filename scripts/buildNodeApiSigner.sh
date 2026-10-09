#!/usr/bin/env bash
# Generate secret shards from edgeKey.json and build the Node N-API Edge API
# HMAC signer. Requires a real apiSecret — refuses to link a stub addon.
set -euo pipefail
cd "$(dirname "$0")/.."

if [ ! -f edgeKey.json ]; then
  echo "error: edgeKey.json required to build the Node API signer" >&2
  exit 1
fi

node -r sucrase/register ./scripts/makeApiSigner.ts

NODE_DIR=native/edge-api-signer/node
if [ ! -f "$NODE_DIR/edge_api_secret.c" ]; then
  echo "error: $NODE_DIR/edge_api_secret.c missing (edgeKey.json apiSecret required)" >&2
  exit 1
fi

(
  cd "$NODE_DIR"
  node ../../../node_modules/node-gyp/bin/node-gyp.js configure
  node ../../../node_modules/node-gyp/bin/node-gyp.js build
)

echo "built $NODE_DIR/build/Release/edge_api_signer.node"
