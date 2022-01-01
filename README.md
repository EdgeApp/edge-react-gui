# Edge Wallet

[![Build Status](https://travis-ci.com/EdgeApp/edge-react-gui.svg?branch=develop)](https://travis-ci.com/EdgeApp/edge-react-gui)

## A multi-currency mobile wallet for Bitcoin, Bitcoin Cash, Ethereum, Dash, Litecoin, Ripple/XRP and Monero

![Edge Wallet Screenshots](https://cdn-images-1.medium.com/max/1600/1*xMZMuK0_jGNZNzduvggsdw.png)

Edge Wallet is:

- simple
- secure
- private
- decentralized
- multi-currency
- cross-platform
- mobile first
- open source

---

## Getting Started

### Prepare React Native Development Tools

The React Native documentation contains [detailed instructions on how to prepare your computer for React Native development](https://reactnative.dev/docs/0.64/environment-setup). Follow the instructions in the "React Native CLI Quickstart" for your specific platform.

If you are using a Mac, follow both the iOS and Android target instructions. Otherwise, you only need the Android target instructions.

### Install Yarn

This project uses Yarn to manage Javascript dependencies:

    https://yarnpkg.com

Do not use NPM to install dependencies, since that will not work.

### Checkout develop branch & install node_modules

    cd edge-react-gui
    yarn
    yarn prepare

### Run the bundler

    yarn start

This bundler process needs to run in the background, so feel free to run this in its own terminal window.

### Add API key in env.json

A public API key is built into the edge-core-js which can be used to build and test the Edge app. This key is severely rate limited and should not be used for production. For production use, get an API key by emailing info@edge.app.

Copy the `env.example.json` to `env.json` and change the `AIRBITZ_API_KEY` to the API key you received from Edge. To use the public API key, leave `AIRBITZ_API_KEY` blank.

### Run the app in debug mode

#### iOS

- Run `yarn prepare.ios` to generate the CocoaPods files. You will need to do this after the first install, and any time Xcode produces a `The sandbox is not in sync with the Podfile.lock. Run 'pod install' or update your CocoaPods installation.` error.
- Open `edge-react-gui/ios/edge.xcworkspace` in Xcode
- Choose a target device or simulator and tap the Play button on the top nav bar

#### Android

To build, install, and start the app on a simulator or physical phone with USB debugging, run:

    yarn android

Otherwise, to get an APK, do:

    cd android
    ./gradlew assembleDebug

- The resulting APK will be in `./app/build/outputs/apk/debug/app-debug.apk`
- Copy the APK to a simulator like Genymotion or a real device via Email or messaging app

### Build release version of app

First, run `./scripts/updateVersion.js` to copy the `package.json` version into the native project files, and to assign a unique build number.

#### iOS

- Open `edge-react-gui/ios/edge.xcworkspace` in Xcode
- Hold [ option/alt ] and click on the Edge button on the top bar to the right of the Play and Stop icons.
- Change 'Build Configuration' to Release
- Uncheck 'Debug Executable'
- Close window
- Choose a device and hit Play

#### Android

    cd android
    ./gradlew assembleRelease

- The resulting APK will be in `./app/build/outputs/apk/release/app-release.apk`
- Copy the APK to a simulator like Genymotion or a real device via Email or messaging app

---

## Deploying (macOS Only)

The included `deploy.js` is a script to automate building, signing, and deploying release builds of Edge. It provides the following:

- Auto sign Android APK with Android keystore files
- Auto sign iOS IPA with provisioning profiles

### To Use

- Run `./scripts/updateVersion.js` to set up your build number & version.
- Set the env var KEYCHAIN_PASSWORD to the keychain password of the current user
- Copy the `deploy-config.sample.json` to `deploy-config.json` and edit the parameters accordingly. You'll need a HockeyApp account to get ids and keys
- Put any Android keystore files into `edge-react-gui/keystores/`
- If using Firebase, put your account's `google-services.json` and `GoogleService-Info.plist` into `edge-react-gui/`
- Install xcpretty `sudo gem install xcpretty`

Run deploy

    ./deploy.js edge ios master
    ./deploy.js edge android master

---

## Debugging

As with any modern React Native app, [Flipper](https://fbflipper.com/) is the officially-supported debugging app. Use the "React Native Hermes Debugger" to debug Javascript running in the UI.

If you want to inspect Redux, you can install the [redux-debugger](https://github.com/jk-gan/flipper-plugin-redux-debugger) plugin for Flipper, which this app supports.

## Contributing

Please follow the coding conventions defined in [Edge Conventions](https://github.com/Airbitz/edge-conventions)
