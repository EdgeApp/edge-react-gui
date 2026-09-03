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
run "${CLI[@]}" local-users
run "${CLI[@]}" fetch-challenge
run "${CLI[@]}" fetch-login-messages
if [ -n "$SOCK" ]; then
  run curl -s --unix-socket "$SOCK" http://localhost/currency-configs
fi

# --- Account create + login ---
run "${CLI[@]}" create-account "$USER" --password="$PASS" --pin="$PIN"
run "${CLI[@]}" account-info
run "${CLI[@]}" get-login-key
run "${CLI[@]}" engine-sessions
run "${CLI[@]}" touch

run "${CLI[@]}" logout
run "${CLI[@]}" login-with-password "$USER" --password="$PASS"

run "${CLI[@]}" logout
run "${CLI[@]}" login-with-pin "$USER" --pin="$PIN"

silent_capture "$META/account-key.json" "${CLI[@]}" get-login-key
LOGIN_KEY=$(node -e '
const fs=require("fs");
try {
  const j=JSON.parse(fs.readFileSync(process.argv[1],"utf8"));
  process.stdout.write(String(j.loginKey||""));
} catch { process.stdout.write(""); }
' "$META/account-key.json")

run "${CLI[@]}" logout
if [ -n "$LOGIN_KEY" ]; then
  run "${CLI[@]}" login-with-key "$USER" --login-key="$LOGIN_KEY"
else
  run "${CLI[@]}" login-with-password "$USER" --password="$PASS"
fi

run "${CLI[@]}" username-available "$USER"
run "${CLI[@]}" username-available "${USER}zz_nope"
run "${CLI[@]}" local-users

run "${CLI[@]}" otp-key
run "${CLI[@]}" enable-otp
run "${CLI[@]}" otp-key
run "${CLI[@]}" disable-otp
run "${CLI[@]}" change-pin --pin=2468
run "${CLI[@]}" change-password --password="${PASS}x"
run "${CLI[@]}" change-password --password="$PASS"
run "${CLI[@]}" change-recovery --question="What is your favorite color?" --answer=blue --question="What is your pet name?" --answer=fluffy

# --- Wallets ---
run "${CLI[@]}" create-currency-wallet wallet:bitcoin --name="Review BTC"
silent_capture "$META/wallet-list.json" "${CLI[@]}" currency-wallets
WID=$(node -e '
const fs=require("fs");
try {
  const j=JSON.parse(fs.readFileSync(process.argv[1],"utf8"));
  const w=(j.wallets||j)[0];
  process.stdout.write(String(w.walletId||w.id||""));
} catch { process.stdout.write(""); }
' "$META/wallet-list.json")

run "${CLI[@]}" currency-wallets
if [ -n "$WID" ]; then
  run "${CLI[@]}" wallet-info "$WID"
  run "${CLI[@]}" rename-wallet "$WID" --name="Renamed BTC"
  run "${CLI[@]}" balance-map "$WID"
  run "${CLI[@]}" get-addresses "$WID"
  run "${CLI[@]}" get-transactions "$WID"
  run "${CLI[@]}" wallet-tokens "$WID"
  run "${CLI[@]}" wallet-tokens "$WID"
  run "${CLI[@]}" get-display-public-key "$WID"

  silent_capture "$META/address.json" "${CLI[@]}" get-addresses "$WID"
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
    run "${CLI[@]}" get-max-spendable "$WID" --to="$ADDR"
    run "${CLI[@]}" spend "$WID" --to="$ADDR" --native-amount=1000 --dry-run
    # Staged spend handle path (make → object-get → object-delete)
    run_capture "$META/make-spend.json" "${CLI[@]}" make-spend "$WID" --to="$ADDR" --native-amount=1000
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
    run "${CLI[@]}" spend-max "$WID" --to="$ADDR" --dry-run
  fi
  run "${CLI[@]}" all-keys
  run "${CLI[@]}" get-raw-private-key "$WID"
  run "${CLI[@]}" change-wallet-states "$WID" --archived=true
  run "${CLI[@]}" change-wallet-states "$WID" --archived=false
fi

# --- Data store ---
run "${CLI[@]}" set-item reviewStore --item-id=item1 --value="hello-cli-review"
run "${CLI[@]}" list-store-ids
run "${CLI[@]}" list-store-ids reviewStore
run "${CLI[@]}" get-item reviewStore --item-id=item1
run "${CLI[@]}" delete-item reviewStore --item-id=item1

# --- Edge login via REST ---
if [ -n "$SOCK" ]; then
  run_capture "$META/edge-pending.json" curl -s --unix-socket "$SOCK" -X POST http://localhost/request-edge-login
  PENDING=$(node -e 'const j=JSON.parse(require("fs").readFileSync(process.argv[1],"utf8")); process.stdout.write(String(j.pendingId||j.objectId||""))' "$META/edge-pending.json")
  LOBBY=$(node -e 'const j=JSON.parse(require("fs").readFileSync(process.argv[1],"utf8")); process.stdout.write(String(j.lobbyId||""))' "$META/edge-pending.json")

  if [ -n "$PENDING" ]; then
    run curl -s --unix-socket "$SOCK" "http://localhost/request-edge-login/$PENDING"
  fi
  if [ -n "$LOBBY" ]; then
    run "${CLI[@]}" fetch-lobby "$LOBBY"
    run "${CLI[@]}" approve-login-request "$LOBBY"
    sleep 2
    run curl -s --unix-socket "$SOCK" "http://localhost/request-edge-login/$PENDING"
  fi

  run curl -s --unix-socket "$SOCK" http://localhost/engine/status
fi
run curl -s http://127.0.0.1:9008/engine/status

# --- Help ---
run "${CLI[@]}" help
run "${CLI[@]}" help create-currency-wallet

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
