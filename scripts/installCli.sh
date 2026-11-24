#!/bin/bash
# Installs the Edge CLI from a GitHub release: no Node.js or npm needed.
#
#   curl -fsSL https://raw.githubusercontent.com/EdgeApp/edge-react-gui/master/scripts/installCli.sh | bash
#   curl -fsSL …/installCli.sh | bash -s -- --version 4.53.0   # a release other than the newest
#   curl -fsSL …/installCli.sh | bash -s -- --user             # without sudo, under ~/.edge-cli/app and ~/.local/bin
#   curl -fsSL …/installCli.sh | bash -s -- uninstall          # remove it; the CLI's data is kept
#
# A release is tagged cli-v<version> and carries a tarball for macOS on arm64
# and one for Linux on x64, install.sh and SHA256SUMS. A tarball holds a
# Node.js runtime and the CLI's package; the runtime's own npm then installs
# the package's dependencies from its lockfile. Without --version, the newest
# cli-v release is installed. Other machines install the CLI from npm.
#
# Releases come from EDGE_CLI_REPO (public: no token). GITHUB_TOKEN, or
# `gh auth token` when the GitHub CLI is signed in, is sent when set.
# EDGE_CLI_RELEASE_DIR installs from a directory holding a release's files
# instead, as the Mason build does to test what it made.
set -euo pipefail

repo=${EDGE_CLI_REPO:-EdgeApp/edge-react-gui}
api=${EDGE_CLI_GITHUB_API:-https://api.github.com}
release_dir=${EDGE_CLI_RELEASE_DIR:-}
version=''
user=0
uninstall=0
while [[ $# -gt 0 ]]; do
  case $1 in
    --version) version=${2:?--version needs a version}; shift 2 ;;
    --user) user=1; shift ;;
    uninstall) uninstall=1; shift ;;
    *) echo "install.sh: unknown option $1" >&2; exit 2 ;;
  esac
done
version=${version#cli-v}
version=${version#v}

fail() { echo "install.sh: $*" >&2; exit 1; }

case $(uname -s) in
  Darwin) os=darwin ;;
  Linux) os=linux ;;
  *) fail "the Edge CLI installs on macOS and Linux, not $(uname -s)" ;;
esac
case $(uname -m) in
  arm64 | aarch64) arch=arm64 ;;
  x86_64 | amd64) arch=x64 ;;
  *) fail "unsupported CPU $(uname -m)" ;;
esac
platform=$os-$arch

if [[ $user == 1 ]]; then
  prefix=${EDGE_CLI_PREFIX:-$HOME/.edge-cli/app}
  bindir=${EDGE_CLI_BINDIR:-$HOME/.local/bin}
  as_root=()
  # ~/.edge-cli also holds the CLI's data, which must be private. One that
  # already exists keeps its mode, as the CLI itself leaves it.
  if [[ -z ${EDGE_CLI_PREFIX:-} && ! -d $HOME/.edge-cli ]]; then
    mkdir -m 700 "$HOME/.edge-cli"
  fi
else
  prefix=${EDGE_CLI_PREFIX:-/opt/edge-cli}
  bindir=${EDGE_CLI_BINDIR:-/usr/local/bin}
  # One sudo prompt, like Homebrew, unless already root or the prefix is writable.
  if [[ $(id -u) == 0 ]] || { mkdir -p "$prefix" 2>/dev/null && [[ -w $prefix ]]; }; then
    as_root=()
  else
    as_root=(sudo)
  fi
fi
admin() { ${as_root[@]+"${as_root[@]}"} "$@"; }

if [[ $uninstall == 1 ]]; then
  [[ -L $prefix/current ]] || fail "$prefix is not an Edge CLI install"
  admin rm -f "$bindir/edge-cli"
  admin rm -rf "$prefix"
  echo "Removed the Edge CLI from $prefix and $bindir/edge-cli; its data in ~/.edge-cli is kept."
  exit 0
fi

work=$(mktemp -d "${TMPDIR:-/tmp}/edge-cli-install.XXXXXX")
trap 'rm -rf "$work"' EXIT

fetch() { # fetch <url> <file> [curl options…]
  local url=$1 file=$2
  shift 2
  curl -fsSL --retry 3 "$@" -o "$file" "$url" || fail "could not download $url"
}

if [[ -n $release_dir ]]; then
  get() { cp "$release_dir/$1" "$work/$1" 2>/dev/null || fail "$release_dir holds no $1"; }
else
  token=${GITHUB_TOKEN:-}
  if [[ -z $token ]] && command -v gh >/dev/null 2>&1; then token=$(gh auth token 2>/dev/null || true); fi
  auth=(-H "X-GitHub-Api-Version: 2022-11-28")
  [[ -z $token ]] || auth+=(-H "Authorization: Bearer $token")
  json() { # json <route> <file>
    curl -fsSL --retry 3 "${auth[@]}" -H 'Accept: application/vnd.github+json' -o "$2" "$api/repos/$repo/$1"
  }
  if [[ -n $version ]]; then
    tag=cli-v$version
  else
    # The app's releases share the repository; the CLI's are tagged cli-v,
    # and the list is newest first.
    json 'releases?per_page=100' "$work/releases.json" || fail "could not list $repo's releases"
    tag=$(tr -d '\n\r' < "$work/releases.json" | grep -o '"tag_name"[[:space:]]*:[[:space:]]*"cli-v[^"]*"' | head -1 | sed -E 's/.*"(cli-v[^"]*)"$/\1/' || true)
    [[ -n $tag ]] || fail "$repo has no Edge CLI release (tagged cli-v<version>)"
  fi
  json "releases/tags/$tag" "$work/release.json" || fail "$repo has no release $tag"
  # Each asset object holds its API URL and then its name.
  asset() {
    local url
    url=$(tr -d '\n\r' < "$work/release.json" | sed -E 's/"[[:space:]]*:[[:space:]]*/":/g' | tr '{' '\n' | grep "\"name\":\"$1\"" | grep -o '"url":"[^"]*/releases/assets/[0-9]*"' | head -1 | sed 's/"url":"\(.*\)"/\1/' || true)
    [[ -n $url ]] || fail "the release has no $1"
    echo "$url"
  }
  get() { fetch "$(asset "$1")" "$work/$1" "${auth[@]}" -H 'Accept: application/octet-stream'; }
fi

get SHA256SUMS
tarball=$(awk '{print $2}' "$work/SHA256SUMS" | grep -E "^edge-cli-[0-9][^ ]*-$platform\\.tar\\.gz$" | head -1 || true)
[[ -n $tarball ]] || fail "the release has no $platform tarball; install the Edge CLI from npm on this machine"
get "$tarball"

release=${tarball#edge-cli-}
release=${release%-$platform.tar.gz}
[[ -z $version || $version == "$release" ]] || fail "asked for $version but the release is $release"

# The tarball must match the release's SHA256SUMS.
expected=$(awk -v f="$tarball" '$2 == f {print $1}' "$work/SHA256SUMS")
if command -v sha256sum >/dev/null 2>&1; then actual=$(sha256sum "$work/$tarball" | awk '{print $1}')
else actual=$(shasum -a 256 "$work/$tarball" | awk '{print $1}'); fi
[[ -n $expected && $expected == "$actual" ]] || fail "checksum mismatch for $tarball: refusing to install it"

dest=$prefix/$release
if [[ -f $dest/.installed && $(cat "$dest/.installed") == "$actual" ]]; then
  echo "The Edge CLI $release is already installed in $dest"
else
  partial=$dest.partial
  admin mkdir -p "$prefix"
  admin rm -rf "$partial"
  admin mkdir -p "$partial"
  admin tar -xzf "$work/$tarball" -C "$partial" --strip-components 1
  # The dependencies, with the runtime's own npm, as the release's lockfile
  # names them. No install scripts run: the CLI loads no compiled addon a
  # dependency would build. Peers are left out, as the app provides them.
  echo "Installing the Edge CLI $release's dependencies"
  admin env PATH="$partial/node/bin:$PATH" npm_config_update_notifier=false \
    "$partial/node/bin/node" "$partial/node/lib/node_modules/npm/bin/npm-cli.js" ci \
    --prefix "$partial/package" --cache "$partial/.npm-cache" \
    --omit=dev --omit=peer --ignore-scripts --no-audit --no-fund --loglevel=error \
    || fail "npm could not install the Edge CLI's dependencies"
  admin rm -rf "$partial/.npm-cache"
  echo "$actual" | admin tee "$partial/.installed" > /dev/null
  admin rm -rf "$dest"
  admin mv "$partial" "$dest"
fi

previous=''
[[ -L $prefix/current ]] && previous=$(readlink "$prefix/current")
admin ln -sfn "$release" "$prefix/current"
admin mkdir -p "$bindir"
admin ln -sf "$prefix/current/bin/edge-cli" "$bindir/edge-cli"
# Every other release goes, except the one just replaced, which an engine
# started from it may still be reading.
for old in "$prefix"/*; do
  name=$(basename "$old")
  [[ -d $old && ! -L $old && $name != "$release" && $name != "$previous" ]] || continue
  admin rm -rf "$old"
done

"$bindir/edge-cli" --version > /dev/null || fail "the installed Edge CLI does not run"
echo "Installed the Edge CLI $release in $dest, as $bindir/edge-cli"
case ":$PATH:" in
  *":$bindir:"*) ;;
  *) echo "Add $bindir to your PATH to run edge-cli." ;;
esac
