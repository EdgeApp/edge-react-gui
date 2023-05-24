#!/bin/bash

set -e

is_cmd() { command -v "$1" >/dev/null 2>&1; }
is_linux() { [[ $(uname -sm) == Linux\ *x86_64* ]]; }
is_mac() { [[ $(uname -sm) == Darwin\ * ]]; }
is_arm() { [[ $(uname -m) == arm64 ]]; }
is_x86() { [[ $(uname -m) == x86_64 ]]; }
is_mac_arm() { [[ $(uname -sm) == Darwin\ *arm64* ]]; }
is_mac_x86() { [[ $(uname -sm) == "Darwin"*"x86_64"* ]]; }
if is_linux && is_x86 || is_mac_arm || is_mac_x86; then
  :
else
  echo "Error: Unsupported OS"
  exit 1
fi

maybe_add_to_path() {
  local path_to_add="$1"
  if [[ ! "$PATH" =~ (^|:)"$path_to_add"(:|\$) ]]; then
    if [[ -w "$shell_config" ]]; then
      echo "export PATH=\"$path_to_add:\$PATH\"" >>"$shell_config"
      echo "Added \"$path_to_add\" to $shell_config"
      source "$shell_config"
    else
      echo "Could not add \"$path_to_add\" to $shell_config. $shell_config is not writable"
    fi
  else
    echo "$path_to_add already exists in PATH"
  fi
}

NODE_VERSION="16.20.0"
JAVA_VERSION="11.0.19-zulu"

JAVA_SDKMAN_URL="https://get.sdkman.io"
MAESTRO_INSTALL_URL="https://get.maestro.mobile.dev"

HOMEBREW_PREFIX=$(is_mac_arm && echo "/opt/homebrew" || echo "/usr/local")
HOMEBREW_SHELLENV="eval \$(${HOMEBREW_PREFIX}/bin/brew shellenv)"

# Detect the user's shell and choose the configuration file accordingly
detect_user_shell() {
  user_shell="$(basename "$SHELL")"
  case $user_shell in
  bash) shell_config="$HOME/.bashrc" ;;
  zsh) shell_config="$HOME/.zshrc" ;;
  *)
    error "Unsupported shell: $user_shell"
    return 1
    ;;
  esac
  echo "Detected shell ${user_shell}"

  # Check if shell_config file exists, and if not, create it
  if [ ! -f "$shell_config" ]; then
    touch "$shell_config"
  else
    source "$shell_config"
  fi
}

detect_user_shell || exit 1

CLEAR="\033[2K\r"
BOLD="\033[1m\t"
GREEN="\033[1;32m"

start() {
  local step=0

  while [ "$step" -lt "${#CMDS[@]}" ]; do
    echo -ne "[ ] ${STEPS[$step]}...\n"
    if ${CMDS[$step]}; then
      echo -ne "\r${CLEAR}[✅] ${STEPS[$step]}\n"
    else
      echo -ne "\r${CLEAR}[❌] ${STEPS[$step]}\n"
      exit 1
    fi
    step=$((step + 1))
  done
}

# Define the installation steps and their corresponding commands
STEPS=("Checking Apple CLI tools installation"
  "Installing Homebrew"
  "Installing Git"
  "Installing nvm, node, npm and yarn"
  "Installing the Java Development Kit (JDK)"
  "Installing android-platform-tools"
  "Installing Maestro")

CMDS=("verify_apple_cli_tools_installed"
  "install_homebrew"
  "install_git"
  "install_node_npm_yarn"
  "install_jdk"
  "install_adb"
  "install_maestro")

install_homebrew() {
  # Check if Homebrew is already installed
  if is_cmd brew; then
    echo "Homebrew already installed"
    return 0
  fi

  # Install curl if not present
  if ! is_cmd curl && is_cmd apt-get; then
    echo "curl is not installed. Installing curl..."
    sudo apt-get update && sudo apt-get install curl -y || {
      echo "Unable to install curl. Please install curl manually and try again."
      return 1
    }
  fi

  # Install Homebrew
  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

  # Add Homebrew to PATH on macOS or Linux
  if is_mac; then
    (
      echo
      echo $HOMEBREW_SHELLENV >>"$shell_config"
    )
  elif is_linux; then
    maybe_add_to_path "$HOME/.linuxbrew/bin" || return 1
    maybe_add_to_path "/home/linuxbrew/.linuxbrew/bin" || return 1
  fi
  source "$shell_config"
}

install_git() {
  if is_cmd git; then
    echo "git already installed"
  else
    echo "Installing git via homebrew"
    brew install git
  fi
}

install_node_npm_yarn() {
  if is_cmd nvm; then
    echo "NVM already installed. "
  else
    echo "Installing NVM"
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.3/install.sh | bash
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
    [ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"
    source "$shell_config"
  fi

  if is_cmd node; then
    echo "NodeJS already installed. "
  else
    echo "Installing NodeJS"
    nvm install $NODE_VERSION
    nvm use $NODE_VERSION
  fi

  if is_cmd yarn; then
    echo "Yarn already installed..."
  else
    echo "Installing Yarn"
    npm install -g yarn
  fi

}

verify_apple_cli_tools_installed() {
  if ! xcode-select -p &>/dev/null; then
    echo "Please install Apple CommandLineTools via:"
    echo -e "$GREEN \033[1m\txcode-select --install \033[0m"
    return 1
  else
    echo "Apple CLI Tools properly installed!"
  fi
}

install_jdk() {
  # Java is re-installed every time this script is run, because the "output" of `java -version` on macOS
  # when Java is not installed is not parseable. The only clue that JRE / JDK is not installed is `which java`
  # will return /usr/bin/java, which is a stub that prompts the user to install Java.

  java -version > /dev/null 2>&1

  # Check the exit status of the java command
  if [ $? -eq 0 ]; then
      # Exit status was 0, so Java is installed
      echo "Java is already installed"
      return 0
  else
      # Exit status was not 0, so Java is not installed
      echo "Java is not installed"
  fi

  if [ -d "$HOME/.sdkman/" ]; then
    rm -rf "$HOME/.sdkman/"
  fi
  curl -s "https://get.sdkman.io" | bash
  source "$HOME/.sdkman/bin/sdkman-init.sh"
  if ! is_cmd sdk; then
    echo "Failed to install SDKMAN"
    return 1
  fi
  sdkman_auto_answer=false
  sdkman_selfupdate_enable=false
  sdk install java $JAVA_VERSION
  sdk default java $JAVA_VERSION
  if ! is_cmd java; then
    echo "Failed to install JDK"
    return 1
  fi
}

install_adb() {
  if is_cmd adb; then
    echo "ADB is already installed."
  else
    echo "Installing ADB..."
    brew install android-platform-tools
    if ! is_cmd adb; then
      echo "Failed to install ADB"
      return 1
    fi
  fi
}

install_maestro() {
  if is_cmd maestro; then
    echo "Maestro is already installed and in the PATH."
    return 0
  else
    echo "Maestro is not installed or not in the PATH. Installing Maestro..."
    curl -Ls "https://get.maestro.mobile.dev" | bash -s -- -b "$HOME/.maestro"
    maybe_add_to_path "$HOME/.maestro/bin" || return 1
    if ! is_cmd maestro; then
      echo "Failed to install maestro"
      return 1
    fi
    echo "Maestro installed successfully."
  fi
}

start

echo 'Installation of Maestro and its dependencies completed.'
