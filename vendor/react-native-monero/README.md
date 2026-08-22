# react-native-monero

This library packages Monero C++ client for use on React Native.

Supported platforms:

- Android
- iOS

## Usage

First, add this library to your React Native app using NPM or Yarn, and run `pod install` as necessary to integrate it with your app's native code.

Here is a simple usage example:

```js
import { what } from 'react-native-monero'

// ???
```

## Developing

This library relies on a large amount of native C++ code from other repos. To integrate this code, you must run the following script before publishing this library to NPM:

```sh
npm run build-native
```

This script does the following tasks:

- Download third-party source code.
- Compile shared libraries for Android.
- Compile an iOS universal static library and put it into an XCFramework.

The `build-native` script is also the place to make edits when upgrading any of the third-party dependencies. The react-native-monero repo doesn't include these third-party C++ sources, since they are enormous.

For this to work, you need:

- A recent Android SDK, installed at `$ANDROID_HOME`
- Xcode command-line tools
- `autoreconf`, provided by `brew install autoconf`
- `automake`, provided by `brew install automake`
- `cmake`, provided by `brew install cmake`
- `llvm-objcopy`, provided by `brew install llvm`
