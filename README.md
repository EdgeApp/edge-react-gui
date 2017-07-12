# airbitz-react-gui

## Edge: powered by Airbitz

Edge is:
- simple
- secure
- private
- decentralized
- multi-currency
- cross-platform
- mobile first
- open source

## Getting Started

_____
#### NOTICE: Until a **yarn** bug gets resolved, use **npm** instead of yarn
_____

1. Make sure you have yarn installed

  https://nodejs.org/en/download/

2. Make sure you have React Native CLI installed

  `yarn global add react-native-cli`

3. Clone this repo, airbitz-core-js, and the demo currency library

  (SSH)
  ```
  git clone git@github.com:Airbitz/airbitz-react-gui.git
  git clone git@github.com:Airbitz/airbitz-core-js.git
  git clone git@github.com:Airbitz/airbitz-currency-shitcoin.git
  ```

  (HTTP)
  ```
  git clone https://github.com/Airbitz/airbitz-react-gui.git
  git clone https://github.com/Airbitz/airbitz-core-js.git
  git clone https://github.com/Airbitz/airbitz-currency-shitcoin.git
  ```

  Ensure the repos are siblings in the same directory:
  ```
  some_directory/
    - airbitz-react-gui/
    - airbitz-core-js/
    - airbitz-currency-shitcoin/
  ```

4. Build each repo
  ```
  # airbitz-core-js/
  yarn
  yarn run build
  ```
  ```
  # airbitz-currency-shitcoin/
  yarn
  yarn run build
  ```
  ```
  # airbitz-react-gui/
  # checkout the develop branch
  git checkout develop
  yarn
  # copy the latest changes from the airbitz-core-js and
  # any other airbitz repos
  yarn run updot
  # Run scripts to update native code
  react-native link
  ```

5. Run the app in debug mode
```
# This requires xcode, Apple/MacOS only
react-native run-ios
```
or
```
# make sure you are running an android emulator
# Pick up a free android emulator at https://www.genymotion.com/fun-zone/
react-native run-android
```

## Deploying

```
# Android (without app signing)
yarn run android:release-install
```

## Troubleshooting

For troubleshooting, we recommend using React Native Debugger
```
# MacOS
brew update && brew cask install react-native-debugger
```

```
# Windows / Linux
https://github.com/jhen0409/react-native-debugger/releases
```

From the app, enable `Debug JS Remotely`
```
# iOS Simulator
⌘ + d (command + d)
Select "Debug JS Remotely"
```
```
# GenyMotion Android Emulator
⌘ + m (command + m)
Select "Debug JS Remotely"
```
