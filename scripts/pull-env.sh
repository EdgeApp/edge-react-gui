#!/bin/bash
set -euo pipefail

REMOTE_HOST="jack"
REMOTE_FILE="env.json"
LOCAL_ENV="env.json"
REMOTE_BASE='\$HOME/jenkins-files'

usage() {
  cat <<EOF
Pull the remote env.json from $REMOTE_HOST and update the local copy.

Usage: $(basename "$0") [-f FOLDER]

  -f FOLDER  Remote folder under ~/jenkins-files (default: master)
  -h         Show this help message
EOF
  exit 1
}

TARGET_FOLDER=""
while getopts "f:h" opt; do
  case $opt in
    f) TARGET_FOLDER="$OPTARG" ;;
    h) usage ;;
    *) usage ;;
  esac
done
shift $((OPTIND - 1))

TARGET_FOLDER="${TARGET_FOLDER:-master}"
TARGET_FOLDER="${TARGET_FOLDER#/}"
TARGET_FOLDER="${TARGET_FOLDER%/}"
[ -z "$TARGET_FOLDER" ] && TARGET_FOLDER="master"

REMOTE_REPO="$REMOTE_BASE/$TARGET_FOLDER"

REMOTE_TMP="$(mktemp)"
trap 'rm -f "$REMOTE_TMP"' EXIT

echo "Pulling latest env.json from $REMOTE_HOST ($TARGET_FOLDER)..."
ssh "$REMOTE_HOST" "cd \"$(eval echo $REMOTE_REPO)\" && git pull --ff-only" >&2
scp -q "$REMOTE_HOST:$(ssh $REMOTE_HOST eval echo $REMOTE_REPO)/$REMOTE_FILE" "$REMOTE_TMP"

backup_local_env() {
  local base="${LOCAL_ENV}.bak"
  local candidate="$base"
  if [ -e "$candidate" ]; then
    local counter=1
    while [ -e "${base}-${counter}" ]; do
      counter=$((counter + 1))
    done
    candidate="${base}-${counter}"
  fi

  cp "$LOCAL_ENV" "$candidate"
  echo "$candidate"
}

if [ ! -f "$LOCAL_ENV" ]; then
  echo "No local $LOCAL_ENV found; creating from remote."
  cp "$REMOTE_TMP" "$LOCAL_ENV"
  exit 0
fi

if diff -q "$LOCAL_ENV" "$REMOTE_TMP" >/dev/null 2>&1; then
  echo "Local $LOCAL_ENV already matches remote; nothing to do."
  exit 0
fi

BACKUP_PATH=$(backup_local_env)
echo "Backed up local $LOCAL_ENV to $BACKUP_PATH"

cp "$REMOTE_TMP" "$LOCAL_ENV"
echo "Updated $LOCAL_ENV with contents from $REMOTE_HOST/$TARGET_FOLDER."
