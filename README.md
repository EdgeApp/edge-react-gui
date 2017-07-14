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

1. Make sure you have node and yarn installed

  https://nodejs.org/en/download/

  `npm install -g yarn`

2. Make sure you have React Native CLI installed

  `yarn global add react-native-cli`

3. Checkout develop & install node_modules

  `git checkout develop`

  `yarn`

5. Run the app in debug mode

  `react-native run-ios` or `react-native run-android`

## Deploying

#### Android (without app signing)

`yarn run android:release-install`

## Troubleshooting

For troubleshooting, we recommend using React Native Debugger

MacOS

`brew update && brew cask install react-native-debugger`

Windows / Linux

https://github.com/jhen0409/react-native-debugger/releases

From the app, enable `Debug JS Remotely`
#### iOS Simulator
    ⌘ + d (command + d)
    Select "Debug JS Remotely"

#### GenyMotion Android Emulator
    ⌘ + m (command + m)
    Select "Debug JS Remotely"
