#!/usr/bin/env bash
# Full Edge CLI suite with raw command/response logging only.
# Always uses tester servers (-t). Never production.
# First CLI command auto-spawns the engine; later commands reuse it.
set -u
set -o pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

LOG_DIR="$HOME/.cursor/logs"
mkdir -p "$LOG_DIR"
STAMP=$(date +%Y%m%d-%H%M%S)
LOG="$LOG_DIR/edgeCliFullReviewRaw-${STAMP}.log"
: >"$LOG"
TMP=$(mktemp -d /tmp/edge-cli-review-XXXXXX)
USER="review$(openssl rand -hex 3)"
PASS="Pass$(openssl rand -hex 4)!r1"
PIN="1357"
META="$TMP/meta"
mkdir -p "$META"

# No --no-spawn: first command must auto-start the engine.
CLI=(node -r sucrase/register src/cli/index.ts -t -d "$TMP" --solve-captcha --tcp=9008)

ensure_nl() {
  if [[ ! -s "$LOG" ]]; then return 0; fi
  local last
  last=$(tail -c1 "$LOG" | od -An -tx1 | tr -d ' \n')
  if [[ "$last" != "0a" ]]; then
    printf '\n' >>"$LOG"
  fi
}

run() {
  local line="" a
  ensure_nl
  for a in "$@"; do
    line+=$(printf '%q' "$a")
    line+=' '
  done
  printf '%s\n' "${line% }" >>"$LOG"
  set +e
  "$@" >>"$LOG" 2>&1
  set -e
  ensure_nl
  return 0
}

run_capture() {
  local out="$1"
  shift
  local line="" a
  ensure_nl
  for a in "$@"; do
    line+=$(printf '%q' "$a")
    line+=' '
  done
  printf '%s\n' "${line% }" >>"$LOG"
  set +e
  "$@" >"$out" 2>"$META/run.err"
  local code=$?
  cat "$out" >>"$LOG"
  cat "$META/run.err" >>"$LOG"
  set -e
  ensure_nl
  return 0
}

silent_capture() {
  local out="$1"
  shift
  set +e
  "$@" >"$out" 2>/dev/null
  set -e
  return 0
}

# Ensure no prior engine is running for a clean auto-spawn.
pkill -f "src/cli/engine/index.ts" 2>/dev/null || true
sleep 1

# --- Engine / context (first command auto-spawns) ---
run_capture "$META/status.json" "${CLI[@]}" engine-status
SOCK=$(node -e '
try {
  const j=JSON.parse(require("fs").readFileSync(process.argv[1],"utf8"));
  process.stdout.write(String(j.socketPath||""));
} catch { process.stdout.write(""); }
' "$META/status.json")

run "${CLI[@]}" engine-config
run "${CLI[@]}" username-list
run "${CLI[@]}" challenge-create
run "${CLI[@]}" messages-fetch
if [ -n "$SOCK" ]; then
  run curl -s --unix-socket "$SOCK" http://localhost/v1/currency-configs
fi

# --- Account create + login ---
run "${CLI[@]}" account-create "$USER" "$PASS" "$PIN"
run "${CLI[@]}" account-info
run "${CLI[@]}" account-key
run "${CLI[@]}" session-list
run "${CLI[@]}" session-touch

run "${CLI[@]}" logout
run "${CLI[@]}" password-login "$USER" "$PASS"

run "${CLI[@]}" logout
run "${CLI[@]}" pin-login "$USER" "$PIN"

silent_capture "$META/account-key.json" "${CLI[@]}" account-key
LOGIN_KEY=$(node -e '
const fs=require("fs");
try {
  const j=JSON.parse(fs.readFileSync(process.argv[1],"utf8"));
  process.stdout.write(String(j.loginKey||""));
} catch { process.stdout.write(""); }
' "$META/account-key.json")

run "${CLI[@]}" logout
if [ -n "$LOGIN_KEY" ]; then
  run "${CLI[@]}" key-login "$USER" "$LOGIN_KEY"
else
  run "${CLI[@]}" password-login "$USER" "$PASS"
fi

run "${CLI[@]}" account-available "$USER"
run "${CLI[@]}" account-available "${USER}zz_nope"
run "${CLI[@]}" username-list

run "${CLI[@]}" otp-status
run "${CLI[@]}" otp-enable
run "${CLI[@]}" otp-status
run "${CLI[@]}" otp-disable
run "${CLI[@]}" pin-setup 2468
run "${CLI[@]}" password-setup "${PASS}x"
run "${CLI[@]}" password-setup "$PASS"
run "${CLI[@]}" recovery2-setup "What is your favorite color?" "blue" "What is your pet name?" "fluffy"

# --- Wallets ---
run "${CLI[@]}" wallet-create wallet:bitcoin "Review BTC"
silent_capture "$META/wallet-list.json" "${CLI[@]}" wallet-list
WID=$(node -e '
const fs=require("fs");
try {
  const j=JSON.parse(fs.readFileSync(process.argv[1],"utf8"));
  const w=(j.wallets||j)[0];
  process.stdout.write(String(w.walletId||w.id||""));
} catch { process.stdout.write(""); }
' "$META/wallet-list.json")

run "${CLI[@]}" wallet-list
if [ -n "$WID" ]; then
  run "${CLI[@]}" wallet-info "$WID"
  run "${CLI[@]}" wallet-rename "$WID" "Renamed BTC"
  run "${CLI[@]}" balance "$WID"
  run "${CLI[@]}" address "$WID"
  run "${CLI[@]}" tx-list "$WID"
  run "${CLI[@]}" token-list "$WID"
  run "${CLI[@]}" token-detected "$WID"
  run "${CLI[@]}" export-public "$WID"

  silent_capture "$META/address.json" "${CLI[@]}" address "$WID"
  ADDR=$(node -e '
const fs=require("fs");
try {
  const j=JSON.parse(fs.readFileSync(process.argv[1],"utf8"));
  const walk=v=>{
    if(v==null)return "";
    if(typeof v==="string"&&(v.startsWith("bc1")||v.startsWith("1")||v.startsWith("3")||v.startsWith("bitcoincash:")))return v;
    if(Array.isArray(v)){for(const x of v){const r=walk(x);if(r)return r}}
    if(typeof v==="object"){
      if(typeof v.publicAddress==="string")return v.publicAddress;
      if(typeof v.segwitAddress==="string")return v.segwitAddress;
      for(const x of Object.values(v)){const r=walk(x);if(r)return r}
    }
    return "";
  };
  process.stdout.write(walk(j));
} catch { process.stdout.write(""); }
' "$META/address.json")

  if [ -n "$ADDR" ]; then
    run "${CLI[@]}" max-spendable "$WID" "$ADDR"
    run "${CLI[@]}" spend "$WID" "$ADDR" 1000 --dry-run
    # Staged spend handle path (make → object-get → object-delete)
    run_capture "$META/make-spend.json" "${CLI[@]}" make-spend "$WID" "$ADDR" 1000
    OID=$(node -e '
try {
  const j=JSON.parse(require("fs").readFileSync(process.argv[1],"utf8"));
  process.stdout.write(String(j.objectId||""));
} catch { process.stdout.write(""); }
' "$META/make-spend.json")
    if [ -n "$OID" ]; then
      run "${CLI[@]}" object-get "$OID"
      run "${CLI[@]}" object-delete "$OID"
    fi
    run "${CLI[@]}" spend-max "$WID" "$ADDR" --dry-run
  fi
  run "${CLI[@]}" key-list
  run "${CLI[@]}" key-get "$WID"
  run "${CLI[@]}" wallet-archive "$WID"
  run "${CLI[@]}" wallet-unarchive "$WID"
fi

# --- Data store ---
run "${CLI[@]}" data-store-set reviewStore item1 "hello-cli-review"
run "${CLI[@]}" data-store-list
run "${CLI[@]}" data-store-list reviewStore
run "${CLI[@]}" data-store-get reviewStore item1
run "${CLI[@]}" data-store-delete reviewStore item1

# --- Edge login via REST ---
if [ -n "$SOCK" ]; then
  run_capture "$META/edge-pending.json" curl -s --unix-socket "$SOCK" -X POST http://localhost/v1/login/edge
  PENDING=$(node -e 'const j=JSON.parse(require("fs").readFileSync(process.argv[1],"utf8")); process.stdout.write(String(j.pendingId||j.objectId||""))' "$META/edge-pending.json")
  LOBBY=$(node -e 'const j=JSON.parse(require("fs").readFileSync(process.argv[1],"utf8")); process.stdout.write(String(j.lobbyId||""))' "$META/edge-pending.json")

  if [ -n "$PENDING" ]; then
    run curl -s --unix-socket "$SOCK" "http://localhost/v1/login/edge/$PENDING"
  fi
  if [ -n "$LOBBY" ]; then
    run "${CLI[@]}" lobby-login-fetch "$LOBBY"
    run "${CLI[@]}" lobby-login-approve "$LOBBY"
    sleep 2
    run curl -s --unix-socket "$SOCK" "http://localhost/v1/login/edge/$PENDING"
  fi

  run curl -s --unix-socket "$SOCK" http://localhost/v1/status
fi
run curl -s http://127.0.0.1:9008/v1/status

# --- Help ---
run "${CLI[@]}" help
run "${CLI[@]}" help wallet-create

# --- Stop this review's engine so automated suites can spawn their own ---
run "${CLI[@]}" logout
run "${CLI[@]}" engine-stop
pkill -f "src/cli/engine/index.ts" 2>/dev/null || true
sleep 1

# --- Automated suites (each starts its own engine via auto-spawn / explicit start) ---
run node -r sucrase/register scripts/testCliCaptcha.ts
run node -r sucrase/register scripts/testEdgeLogin.ts
run node -r sucrase/register scripts/testCli.ts

rm -rf "$TMP"
printf '%s\n' "$LOG" >&2
