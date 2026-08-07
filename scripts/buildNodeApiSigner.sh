#!/usr/bin/env bash
# Generate secret shards (if edgeKey.json present) and build the Node N-API
# Edge API HMAC signer. Safe to run when secrets are missing (stub secret).
set -euo pipefail
cd "$(dirname "$0")/.."

node -r sucrase/register ./scripts/makeApiSigner.ts

NODE_DIR=native/edge-api-signer/node
if [ ! -f "$NODE_DIR/edge_api_secret.c" ]; then
  echo "error: $NODE_DIR/edge_api_secret.c missing after makeApiSigner" >&2
  exit 1
fi

(
  cd "$NODE_DIR"
  node ../../../node_modules/node-gyp/bin/node-gyp.js configure
  node ../../../node_modules/node-gyp/bin/node-gyp.js build
)

echo "built $NODE_DIR/build/Release/edge_api_signer.node"
