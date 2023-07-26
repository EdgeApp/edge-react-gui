# Edge

[![Build Status](https://travis-ci.com/EdgeApp/edge-react-gui.svg?branch=develop)](https://travis-ci.com/EdgeApp/edge-react-gui)

## A multi-currency mobile wallet for Bitcoin, Ethereum, Monero, Dash, Litecoin, Bitcoin Cash, Ripple/XRP, Polkadot, Tron, Solana, Stellar, Fantom, Algorand, Optimism, Zcash, Pirate Chain, and many others

![Edge Screenshots](https://edge.app/wp-content/uploads/2023/04/Edge-Mock-ups.png)

Edge is:

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

The React Native documentation contains [detailed instructions on how to prepare your computer for React Native development](https://reactnative.dev/docs/0.67/environment-setup). Follow the instructions in the "React Native CLI Quickstart" for your specific platform.

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

Change the `AIRBITZ_API_KEY` in `env.json` to the API key you received from Edge. To use the public API key, leave `AIRBITZ_API_KEY` blank.

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

## Deploying (MacOS Only)

This repo includes several utility scripts that can be used in a CI/CD
environment to build and deploy a release version of the app. The
included `Jenkinsfile` utilizes all the scripts but you are free to
use them in your own CI environment.

### Update the version file

Set `BUILD_REPO_URL` to the URL of an empty Git repo that will hold a version
file that will be auto updated to increment the version and build number. Then
run the following to update a local `release-version.json` file

    yarn gitVersionFile

Update the project files based on the version in `release-version.json`

    yarn updateVersion


### Build, sign, and deploy

The included `deploy.ts` is a script to automate building, signing, and deploying release builds of Edge. It provides the following:

- Auto sign Android APK with Android keystore files
- Auto sign iOS IPA with provisioning profiles
- Build release version of iOS and Android
- Upload iOS IPA and Android APK files to AppCenter for developer testing

### To Use

- Set the env var KEYCHAIN_PASSWORD to the keychain password of the current user
- Copy the `deploy-config.sample.json` to `deploy-config.json` and edit the parameters accordingly. You'll need a HockeyApp account to get ids and keys
- Download a copy of the Google Bundle tool (https://github.com/google/bundletool/releases)
- Set the `bundleToolPath` in `deploy-config.json` to the path to the bundle tool `.jar` file
- Put any Android keystore files into `edge-react-gui/keystores/`
- If using Firebase, put your account's `google-services.json` and `GoogleService-Info.plist` into `edge-react-gui/`
- Install xcpretty `sudo gem install xcpretty`

Run deploy

```sh
yarn deploy edge ios master
yarn deploy edge android master
```

## Fastlane support

This repo supports utilizing Fastlane to automate updates to iOS Provisioning
Profiles. To use Fastlane, set the following environment variables and run
`yarn deploy` as mentioned above

    BUILD_REPO_URL          // Git repo used to store encrypted provisioning
                            // keys.
                            // Will be shared with the gitVersionFile.ts script
    FASTLANE_USER           // Apple ID email
    FASTLANE_PASSWORD       // Apple ID password
    GITHUB_SSH_KEY          // (Optional) SSH Key file to use when accessing
                            // BUILD_REPO_URL
    MATCH_KEYCHAIN_PASSWORD // Password to unlock the current users keychain
    MATCH_PASSWORD          // Password used to encrypt profile information
                            // before being saved to the BUILD_REPO_URL
---

## Debugging

As with any modern React Native app, [Flipper](https://fbflipper.com/) is the officially-supported debugging app. Use the "React Native Hermes Debugger" to debug Javascript running in the UI.

If you want to inspect Redux, you can install the [redux-debugger](https://github.com/jk-gan/flipper-plugin-redux-debugger) plugin for Flipper, which this app supports.

## Contributing

Please follow the coding conventions defined in [Edge Conventions](https://github.com/Airbitz/edge-conventions)
