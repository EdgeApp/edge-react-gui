#!/usr/bin/env bash
# Full Edge CLI review log — every command + response for human review.
# Always uses tester servers (-t). Never production.
set -u
set -o pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

LOG_DIR="$HOME/.cursor/logs"
mkdir -p "$LOG_DIR"
STAMP=$(date +%Y%m%d-%H%M%S)
LOG="$LOG_DIR/edgeCliFullReview-${STAMP}.log"
TMP=$(mktemp -d /tmp/edge-cli-review-XXXXXX)
USER="review$(openssl rand -hex 3)"
PASS="Pass$(openssl rand -hex 4)!r1"
PIN="1357"

CLI=(node -r sucrase/register src/cli/index.ts -t -d "$TMP" --no-spawn --solve-captcha)

exec > >(tee -a "$LOG") 2>&1

echo "================================================================"
echo "Edge CLI full review log"
echo "Started: $(date -Iseconds)"
echo "Log file: $LOG"
echo "Work dir: $TMP"
echo "Test user: $USER"
echo "Branch: $(git rev-parse --abbrev-ref HEAD) @ $(git rev-parse --short HEAD)"
echo "================================================================"
echo
echo "\$ echo LOG_PATH"
echo "$LOG"
echo

section() {
  echo
  echo "----------------------------------------------------------------"
  echo "## $1"
  echo "----------------------------------------------------------------"
}

run() {
  local label="$1"
  shift
  echo
  echo "\$ ${CLI[*]} $*"
  echo "---"
  set +e
  "${CLI[@]}" "$@"
  local code=$?
  set -e
  echo "---"
  echo "exit=$code  ($label)"
  return 0
}

# --- Start engine ---
section "Start engine (tester servers, TCP 9008)"
pkill -f "src/cli/engine/index.ts" 2>/dev/null || true
sleep 1
node -r sucrase/register src/cli/engine/index.ts -t -d "$TMP" --tcp=9008 --idle-timeout=600 \
  >/tmp/edge-engine-review.out 2>/tmp/edge-engine-review.err &
ENG_PID=$!
echo "engine pid=$ENG_PID"
for i in $(seq 1 60); do
  if grep -q Ready /tmp/edge-engine-review.err 2>/dev/null; then break; fi
  sleep 1
done
echo
echo "\$ cat /tmp/edge-engine-review.err"
cat /tmp/edge-engine-review.err
SOCK=$(sed -n 's/.*unix:\(.*\)$/\1/p' /tmp/edge-engine-review.err | tail -1)
echo
echo "socket=$SOCK"

# --- Engine / context ---
section "Engine & context"
run engine-status engine-status
run engine-config engine-config
run local-users local-users
run fetch-challenge fetch-challenge
run fetch-login-messages fetch-login-messages
echo
echo "\$ curl --unix-socket \$SOCK http://localhost/currency-configs"
curl -s --unix-socket "$SOCK" http://localhost/currency-configs | head -c 2000
echo
echo "..."

# --- Account create + login (CAPTCHA) ---
section "Account create (CAPTCHA) + credential logins"
run create-account create-account "$USER" --password="$PASS" --pin="$PIN"
run account-info account-info
run get-login-key get-login-key
run engine-sessions engine-sessions
run touch touch

# Logout and password login again
run logout logout
run login-with-password login-with-password "$USER" --password="$PASS"

# PIN login (after logout)
run logout logout
run login-with-pin login-with-pin "$USER" --pin="$PIN"

# Account key login
KEY=$(node -r sucrase/register src/cli/index.ts -t -d "$TMP" --no-spawn get-login-key 2>/dev/null | tail -1 | tr -d '"' | tr -d '[:space:]')
# get-login-key returns JSON { loginKey: "..." } typically
LOGIN_KEY=$(node -r sucrase/register -e "
const {execSync}=require('child_process');
const out=execSync('node -r sucrase/register src/cli/index.ts -t -d $TMP --no-spawn get-login-key',{encoding:'utf8'});
try { const j=JSON.parse(out); console.log(j.loginKey||j); } catch { console.log(out.trim()); }
" 2>/dev/null | tail -1)
echo
echo "# extracted loginKey=$LOGIN_KEY"
run logout logout
if [ -n "$LOGIN_KEY" ] && [ "$LOGIN_KEY" != "undefined" ]; then
  run login-with-key login-with-key "$USER" --login-key="$LOGIN_KEY"
else
  echo "# SKIP login-with-key (could not extract loginKey)"
  run login-with-password login-with-password "$USER" --password="$PASS"
fi

# --- Username / availability ---
section "Username helpers"
run account-available-taken username-available "$USER"
run account-available-free username-available "${USER}zz_nope"
run local-users local-users

# --- OTP / password / pin / recovery ---
section "OTP, password, PIN, recovery"
run otp-key otp-key
run enable-otp enable-otp
run otp-status-2 otp-key
run disable-otp disable-otp
run change-pin change-pin --pin=2468
run change-password change-password --password="${PASS}x"
# restore password for later
run password-setup-restore change-password --password="$PASS"
run change-recovery change-recovery --question="What is your favorite color?" --answer=blue --question="What is your pet name?" --answer=fluffy

# --- Wallets ---
section "Wallets"
run create-currency-wallet create-currency-wallet wallet:bitcoin --name="Review BTC"
WALLET_JSON=$(node -r sucrase/register src/cli/index.ts -t -d "$TMP" --no-spawn currency-wallets 2>/dev/null)
echo
echo "# currency-wallets raw for id extraction:"
echo "$WALLET_JSON"
WID=$(node -r sucrase/register -e "
const {execSync}=require('child_process');
const out=execSync('node -r sucrase/register src/cli/index.ts -t -d $TMP --no-spawn currency-wallets',{encoding:'utf8'});
const j=JSON.parse(out);
const w=(j.wallets||j)[0];
console.log(w.walletId||w.id||'');
" 2>/dev/null | tail -1)
echo "# walletId=$WID"

run currency-wallets currency-wallets
if [ -n "$WID" ]; then
  run wallet-info wallet-info "$WID"
  run rename-wallet rename-wallet "$WID" --name="Renamed BTC"
  run balance-map balance-map "$WID"
  run get-addresses get-addresses "$WID"
  run get-transactions get-transactions "$WID"
  run wallet-tokens wallet-tokens "$WID"
  run wallet-tokens wallet-tokens "$WID"
  run get-display-public-key get-display-public-key "$WID"
  # dry-run spend / max — may fail with insufficient funds; still log
  ADDR=$(node -r sucrase/register -e "
const {execSync}=require('child_process');
const out=execSync('node -r sucrase/register src/cli/index.ts -t -d $TMP --no-spawn get-addresses $WID',{encoding:'utf8'});
const j=JSON.parse(out);
console.log(j.publicAddress||j.segwitAddress||Object.values(j).find(v=>typeof v==='string'&&v.length>10)||'');
" 2>/dev/null | tail -1)
  echo "# receive get-addresses for dry-run=$ADDR"
  if [ -n "$ADDR" ]; then
    run get-max-spendable get-max-spendable "$WID" --to="$ADDR"
    run spend-dry spend "$WID" --to="$ADDR" --native-amount=1000 --dry-run
    run spend-max-dry spend-max "$WID" --to="$ADDR" --dry-run
  fi
  run all-keys all-keys
  run get-raw-private-key get-raw-private-key "$WID"
  run wallet-state-archive change-wallet-states "$WID" --archived=true
  run wallet-state-unarchive change-wallet-states "$WID" --archived=false
fi

# --- Data store ---
section "Data store"
run set-item set-item reviewStore --item-id=item1 --value="hello-cli-review"
run list-store-ids list-store-ids
run data-store-list-items list-store-ids reviewStore
run get-item get-item reviewStore --item-id=item1
run delete-item delete-item reviewStore --item-id=item1

# --- Edge login ---
section "Edge login (request lobbyId)"
# Run in background-ish: just POST and print, cancel after
echo
echo "\$ ${CLI[*]} request-edge-login   # will poll; we use REST instead for controlled log"
curl -s --unix-socket "$SOCK" -X POST http://localhost/request-edge-login | tee /tmp/edge-pending.json
echo
PENDING=$(node -e "const j=require('/tmp/edge-pending.json'); console.log(j.pendingId)")
LOBBY=$(node -e "const j=require('/tmp/edge-pending.json'); console.log(j.lobbyId)")
URI=$(node -e "const j=require('/tmp/edge-pending.json'); console.log(j.uri)")
echo "pendingId=$PENDING lobbyId=$LOBBY uri=$URI"
echo
echo "\$ curl --unix-socket \$SOCK GET /request-edge-login/\$PENDING"
curl -s --unix-socket "$SOCK" "http://localhost/request-edge-login/$PENDING"
echo
# Approve from same logged-in session via CLI lobby commands
run fetch-lobby fetch-lobby "$LOBBY"
run approve-login-request approve-login-request "$LOBBY"
echo
echo "\$ curl --unix-socket \$SOCK GET /request-edge-login/\$PENDING (after approve)"
sleep 2
curl -s --unix-socket "$SOCK" "http://localhost/request-edge-login/$PENDING"
echo

# --- Transport parity ---
section "Unix vs TCP parity"
echo
echo "\$ curl --unix-socket \$SOCK http://localhost/engine/status"
curl -s --unix-socket "$SOCK" http://localhost/engine/status
echo
echo
echo "\$ curl http://127.0.0.1:9008/engine/status"
curl -s http://127.0.0.1:9008/engine/status
echo

# --- Help ---
section "Help"
run help help
run help-wallet help create-currency-wallet

# --- Automated suites ---
section "Automated suite: testCliCaptcha"
set +e
node -r sucrase/register scripts/testCliCaptcha.ts
echo "exit=$?"
set -e

section "Automated suite: testEdgeLogin"
set +e
node -r sucrase/register scripts/testEdgeLogin.ts
echo "exit=$?"
set -e

section "Automated suite: testCli (oneshot)"
set +e
node -r sucrase/register scripts/testCli.ts
echo "exit=$?"
set -e

# --- Cleanup ---
section "Cleanup"
run logout logout
echo
echo "\$ kill engine $ENG_PID"
kill "$ENG_PID" 2>/dev/null || true
sleep 1
rm -rf "$TMP"

echo
echo "================================================================"
echo "Review complete: $(date -Iseconds)"
echo "Full log: $LOG"
echo "================================================================"
