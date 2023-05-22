# Setting up Maestro for Edge


[Maestro](https://maestro.mobile.dev/) is an [open-source](https://github.com/mobile-dev-inc/maestro/) mobile testing framework for end-to-end testing automation. It is used to automate testing of various flows within the Edge Wallet.



## Note for developers

- If you have previously set up your machine as a development environment for `react-native`, please install Maestro directly via the [installation & getting started documentation](https://maestro.mobile.dev/getting-started/installing-maestro).

## Table of Contents

- [Setting up Maestro for Edge](#setting-up-maestro-for-edge)
  - [Note for developers](#note-for-developers)
  - [Prerequisites](#prerequisites)
  - [Installation (macOS)](#installation-macos)
  - [Running Maestro tests](#running-maestro-tests)
- [Creating Maestro tests with Maestro Studio](#creating-maestro-tests-with-maestro-studio)



## Prerequisites

- macOS 13.x (Both Apple Silicon and Intel are supported)

- An Android device with [USB debugging enabled](https://developer.android.com/studio/debug/dev-options#enable) and connected via USB to your computer.


## Installation (macOS)


1. Open the	Terminal app (Located in the Applications/Utilities folder).
2. Install Apple Command Line Tools by pasting the following command in your terminal, and pressing enter:


```bash
xcode-select --install
```


This will open a dialog box. Click "Install", followed by "Agree" to the license terms. This will start the installation of the Apple Command Line Tools.


> Note: Downloading and installing the Apple Command Line Tools can take between 10 minutes to an hour depending on your internet connection speed.


3. Once Apple Command Line Tools has finished installing, run the following command to verify that the installation was successful:


```bash
xcode-select -p

# /Library/Developer/CommandLineTools

```

4. Next, run the convenience shell script to install all dependencies required for Maestro, including Maestro itself:


```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/EdgeApp/edge-react-gui/develop/maestro.sh)"
```


5. Once the script has finished installing all dependencies & Maestro, the command `maestro --version` should successfully return the version number:


```bash
maestro --version
# 1.27.0
```

## Running Maestro tests


To run Maestro tests, ensure you are in the `edge-react-gui` directory:


```bash
cd ~/edge/edge-react-gui
```

🚀:


```bash
yarn maestro
```

## Creating Maestro tests with Maestro Studio

Maestro Studio, an in-browser app that ships with Maestro, provides a simple way to create Maestro tests. Make sure to have your Android phone connected via USB, and run:


```bash
maestro studio
```

This will open a browser tab on `localhost:9999` and allow you to create tests. Please consult the [maestro studio documentation](https://maestro.mobile.dev/getting-started/maestro-studio) for further information.
