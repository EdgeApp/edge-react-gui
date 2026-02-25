#!/bin/bash
set -euo pipefail

REMOTE_HOST="jack"
REMOTE_FILE="env.json"
LOCAL_ENV="env.json"

usage() {
  cat <<EOF
Push an env.json key to the Jenkins env.json on $REMOTE_HOST.
Inserts the key alphabetically within the correct section.

Usage: $(basename "$0") [-m MESSAGE] [-f FOLDER] <KEY> [JSON_VALUE]

  KEY          Top-level key in env.json (e.g. XGRAM_INIT)
  JSON_VALUE   JSON value to set (any valid JSON). If omitted, extracted from local env.json.
  -m MESSAGE   Custom commit message (default: "Set <KEY> in env.json")
  -f FOLDER    Remote folder under ~/jenkins-files (default: master)

Examples:
  $(basename "$0") XGRAM_INIT
  $(basename "$0") -f testnet XGRAM_INIT '{"apiKey": "abc123"}'
  $(basename "$0") -m "Enable xgram exchange plugin" -f master XGRAM_INIT
EOF
  exit 1
}

COMMIT_MSG=""
TARGET_FOLDER=""
while getopts "m:f:h" opt; do
  case $opt in
    m) COMMIT_MSG="$OPTARG" ;;
    h) usage ;;
    *) usage ;;
  esac
done
shift $((OPTIND - 1))

[ $# -lt 1 ] && usage
KEY="$1"
shift

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

if [ $# -gt 0 ]; then
  VALUE="$1"
  echo "$VALUE" | jq . > /dev/null 2>&1 || { echo "Error: Invalid JSON value" >&2; exit 1; }
else
  VALUE=$(jq --arg key "$KEY" '.[$key]' "$REPO_ROOT/$LOCAL_ENV")
  if [ "$VALUE" = "null" ]; then
    echo "Error: Key '$KEY' not found in local $LOCAL_ENV" >&2
    exit 1
  fi
fi

TARGET_FOLDER="${TARGET_FOLDER:-master}"
TARGET_FOLDER="${TARGET_FOLDER#/}"
TARGET_FOLDER="${TARGET_FOLDER%/}"
[ -z "$TARGET_FOLDER" ] && TARGET_FOLDER="master"
REMOTE_BASE='$HOME/jenkins-files'
REMOTE_REPO="$REMOTE_BASE/$TARGET_FOLDER"

[ -z "$COMMIT_MSG" ] && COMMIT_MSG="Set $KEY in $REMOTE_FILE"

echo "Key:     $KEY"
echo "Value:   $VALUE"
echo "Folder:  $TARGET_FOLDER"
echo "Message: $COMMIT_MSG"
echo ""

REMOTE_TMP=$(mktemp)
VALUE_TMP=$(mktemp)
RESULT_TMP=$(mktemp)
trap 'rm -f "$REMOTE_TMP" "$VALUE_TMP" "$RESULT_TMP"' EXIT

echo "Pulling latest on $REMOTE_HOST..."
ssh "$REMOTE_HOST" "cd $REMOTE_REPO && git pull --ff-only" >&2

echo "Fetching remote $REMOTE_FILE..."
scp -q "$REMOTE_HOST:$REMOTE_REPO/$REMOTE_FILE" "$REMOTE_TMP"

printf '%s' "$VALUE" > "$VALUE_TMP"

echo "Merging $KEY into correct section..."
python3 - "$KEY" "$VALUE_TMP" "$REMOTE_TMP" "$REPO_ROOT/$LOCAL_ENV" > "$RESULT_TMP" <<'PYEOF'
import json
import sys

SECTION_MARKER = "--------"

key = sys.argv[1]
with open(sys.argv[2]) as f:
    value = json.loads(f.read())
with open(sys.argv[3]) as f:
    remote = json.loads(f.read())
with open(sys.argv[4]) as f:
    local = json.loads(f.read())

# Find which section the key belongs to using local env.json key order
target_section = None
current_section = None
for k in local:
    if SECTION_MARKER in k:
        current_section = k
    elif k == key:
        target_section = current_section
        break

if target_section is None:
    print(f"Warning: '{key}' not in local env.json; appending to last section",
          file=sys.stderr)

# Split remote keys into sections: [(header, [key, ...])]
sections = []
cur_header = None
cur_keys = []
for k in remote:
    if SECTION_MARKER in k:
        sections.append((cur_header, cur_keys))
        cur_header = k
        cur_keys = []
    else:
        cur_keys.append(k)
sections.append((cur_header, cur_keys))

# Remove key from wherever it currently sits
for i, (h, keys) in enumerate(sections):
    sections[i] = (h, [k for k in keys if k != key])

# Insert key into the target section
added = False
for i, (h, keys) in enumerate(sections):
    if h == target_section:
        keys.append(key)
        added = True
        break
if not added:
    sections[-1][1].append(key)

# Sort keys alphabetically within each section
for i, (h, keys) in enumerate(sections):
    sections[i] = (h, sorted(keys))

# Reconstruct ordered dict, pulling values from remote (or using new value)
result = {}
for h, keys in sections:
    if h is not None:
        result[h] = remote[h]
    for k in keys:
        result[k] = value if k == key else remote[k]

print(json.dumps(result, indent=2))
PYEOF

echo "Pushing to $REMOTE_HOST..."
scp -q "$RESULT_TMP" "$REMOTE_HOST:$REMOTE_REPO/$REMOTE_FILE"

ESCAPED_MSG=$(printf '%q' "$COMMIT_MSG")
ssh "$REMOTE_HOST" "cd $REMOTE_REPO && git add $REMOTE_FILE && git diff --cached --stat && git commit -m $ESCAPED_MSG && git push"

echo "Done."
