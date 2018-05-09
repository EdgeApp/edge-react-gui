# Edge Wallet

## A multicurrency mobile wallet for Bitcoin, Ethereum, Litecoin, and Bitcoin Cash

![Edge Wallet Screenshots](https://cdn-images-1.medium.com/max/1600/1*xMZMuK0_jGNZNzduvggsdw.png)

Edge Wallet is:

* simple
* secure
* private
* decentralized
* multi-currency
* cross-platform
* mobile first
* open source

---

## Requirements

  ### MacOS
   
   Xcode >= 9

## Getting Started

### Install nodejs (v 8.4+) and npm (v 5.3+)

    https://nodejs.org/en/download/

### Install yarn

    https://yarnpkg.com

### Install React Native CLI

    npm install -g react-native-cli

### Checkout develop branch & install node_modules

    cd edge-react-gui
    yarn

### Android NDK Setup

(MacOS) If the NDK is already installed from Android Studio, it should be in `/Users/[user]/Library/Android/sdk/ndk-bundle`.
If not, download and unzip the NDK from https://developer.android.com/ndk/index.html

Set `ANDROID_NDK_HOME` environment variable to the path of the NDK. ie

    export ANDROID_NDK_HOME=/Users/bob/Library/Android/sdk/ndk-bundle

### Add API key in env.json

Get an API key from https://developer.airbitz.co by scanning the QR code with your Airbitz wallet (https://airbitz.co/app)
Copy the env.example.json to env.json and change the `AIRBITZ_API_KEY` to the API key you received from developer.airbitz.co.

### Run the app in debug mode

`react-native run-ios` or `react-native run-android`

---

## Deploying

#### Android

    npm run android:release-install

---

## Debugging

For debugging, we recommend using React Native Debugger

### MacOS

`brew update && brew cask install react-native-debugger`

##### iOS Simulator

    ⌘ + d (command + d)
    Select "Debug JS Remotely"

### Windows / Linux

https://github.com/jhen0409/react-native-debugger/releases

###### GenyMotion Android Emulator

    ⌘ + m (command + m)
    Select "Debug JS Remotely"

## Contributing

Please follow the coding conventions defined in [Edge Conventions](https://github.com/Airbitz/edge-conventions)
