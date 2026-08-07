#!/usr/bin/env bash
# Raw CLI suite: BTC→ETH swap quotes (~$90) for all enabled exchange plugins.
# Source wallet must be the funded persistent BTC wallet.
set -u
set -o pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

LOG_DIR="$HOME/.cursor/logs"
mkdir -p "$LOG_DIR"
STAMP=$(date +%Y%m%d-%H%M%S)
LOG="$LOG_DIR/edgeCliSwapQuotesRaw-${STAMP}.log"
: >"$LOG"

PERSIST="$HOME/.edge-cli/persistent-test"
ACCT="$PERSIST/ACCOUNT.md"
USER=$(awk -F'[`]' '/Username/{print $2; exit}' "$ACCT")
PASS=$(awk -F'[`]' '/Password/{print $2; exit}' "$ACCT")
CLI=(node -r sucrase/register src/cli/index.ts -t -d "$PERSIST" --solve-captcha)

ensure_nl() {
  if [[ ! -s "$LOG" ]]; then return 0; fi
  local last
  last=$(tail -c1 "$LOG" | od -An -tx1 | tr -d ' \n')
  if [[ "$last" != "0a" ]]; then printf '\n' >>"$LOG"; fi
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
  "$@" >"$out" 2>"$out.err"
  cat "$out" >>"$LOG"
  cat "$out.err" >>"$LOG"
  set -e
  ensure_nl
  return 0
}

pkill -f "src/cli/engine/index.ts" 2>/dev/null || true
sleep 1

META=$(mktemp -d /tmp/edge-cli-swap-XXXXXX)

run_capture "$META/login.json" "${CLI[@]}" password-login "$USER" --password="$PASS"
run_capture "$META/wallets.json" "${CLI[@]}" wallet-list

BTC_ID=$(node -e '
const j=JSON.parse(require("fs").readFileSync(process.argv[1],"utf8"));
const w=(j.wallets||[]).find(x=>x.type==="wallet:bitcoin");
process.stdout.write(w?w.walletId:"");
' "$META/wallets.json")
ETH_ID=$(node -e '
const j=JSON.parse(require("fs").readFileSync(process.argv[1],"utf8"));
const w=(j.wallets||[]).find(x=>x.type==="wallet:ethereum");
process.stdout.write(w?w.walletId:"");
' "$META/wallets.json")

run "${CLI[@]}" balance "$BTC_ID"
run "${CLI[@]}" balance "$ETH_ID"

# $90 of BTC as source (quoteFor=from)
run_capture "$META/rate-from.json" "${CLI[@]}" rates-usd-to-native --usd-amount=90 --plugin-id=bitcoin
NATIVE_FROM=$(node -e 'const j=JSON.parse(require("fs").readFileSync(process.argv[1],"utf8")); process.stdout.write(String(j.nativeAmount||""))' "$META/rate-from.json")

# $90 of ETH as destination (quoteFor=to / reverse)
run_capture "$META/rate-to.json" "${CLI[@]}" rates-usd-to-native --usd-amount=90 --plugin-id=ethereum
NATIVE_TO=$(node -e 'const j=JSON.parse(require("fs").readFileSync(process.argv[1],"utf8")); process.stdout.write(String(j.nativeAmount||""))' "$META/rate-to.json")

# Also show $500 conversion (as requested for sizing context)
run "${CLI[@]}" rates-usd-to-native --usd-amount=500 --plugin-id=bitcoin
run "${CLI[@]}" rates-usd-to-native --usd-amount=500 --plugin-id=ethereum

PLUGINS=(changehero changenow exolix godex letsexchange swapuz rango thorchain swapkit sideshift lifi)

# Forward quotes: spend ~$90 BTC → ETH
for p in "${PLUGINS[@]}"; do
  run_capture "$META/q-from-$p.json" "${CLI[@]}" swap-quote --from-wallet-id="$BTC_ID" --to-wallet-id="$ETH_ID" --native-amount="$NATIVE_FROM" --quote-for=from --plugin-id="$p"
  OID=$(node -e '
try {
  const j=JSON.parse(require("fs").readFileSync(process.argv[1],"utf8"));
  const q=(j.quotes||[])[0];
  process.stdout.write(q&&q.objectId?q.objectId:"");
} catch { process.stdout.write(""); }
' "$META/q-from-$p.json")
  if [ -n "$OID" ]; then
    run "${CLI[@]}" swap-quote-get "$OID"
    run "${CLI[@]}" swap-quote-close "$OID"
  fi
done

# Reverse quotes: receive ~$90 ETH, source BTC
for p in "${PLUGINS[@]}"; do
  run_capture "$META/q-to-$p.json" "${CLI[@]}" swap-quote --from-wallet-id="$BTC_ID" --to-wallet-id="$ETH_ID" --native-amount="$NATIVE_TO" --quote-for=to --plugin-id="$p"
  OID=$(node -e '
try {
  const j=JSON.parse(require("fs").readFileSync(process.argv[1],"utf8"));
  const q=(j.quotes||[])[0];
  process.stdout.write(q&&q.objectId?q.objectId:"");
} catch { process.stdout.write(""); }
' "$META/q-to-$p.json")
  if [ -n "$OID" ]; then
    run "${CLI[@]}" swap-quote-close "$OID"
  fi
done

# All providers at once (no preferPluginId)
run_capture "$META/q-all-from.json" "${CLI[@]}" swap-quote --from-wallet-id="$BTC_ID" --to-wallet-id="$ETH_ID" --native-amount="$NATIVE_FROM" --quote-for=from
# Close any returned handles
node -e '
const fs=require("fs");
const {execSync}=require("child_process");
try {
  const j=JSON.parse(fs.readFileSync(process.argv[1],"utf8"));
  for (const q of j.quotes||[]) {
    if (!q.objectId) continue;
    try {
      execSync("node -r sucrase/register src/cli/index.ts -t -d "+JSON.stringify(process.env.HOME+"/.edge-cli/persistent-test")+" --solve-captcha swap-quote-close "+q.objectId, {stdio:"ignore"});
    } catch {}
  }
} catch {}
' "$META/q-all-from.json"

run "${CLI[@]}" logout
run "${CLI[@]}" engine-stop

printf '%s\n' "$LOG" >&2
rm -rf "$META"
