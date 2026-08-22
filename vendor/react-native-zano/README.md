# react-native-zano

This library packages Zano C++ client for use on React Native.

Supported platforms:

- Android
- iOS

## Usage

First, add this library to your React Native app using NPM or Yarn, and run `pod install` as necessary to integrate it with your app's native code.

Here is a simple usage example:

```js
import { makeZano } from 'react-native-zano'

const zano = makeZano()
const version = await zano.getVersion()
```

We have types too, if you need those:

```ts
import type { CppBridge } from 'react-native-zano'
```

All methods available in Zano's `plain_wallet_api` are available here. In addition, there are convenience methods that provide higher-level abstractions by combining multiple raw asynchronous API calls and handling common error cases:

- getSeedPhraseInfo - Returns information about a seed phrase
- generateSeedPhrase - Creates a new seed phrase
- startWallet - Opens an existing wallet or creates a new one if it doesn't exist
- stopWallet - Safely closes a wallet
- removeWallet - Deletes a wallet from the system
- walletStatus - Gets the current status of a wallet
- getBalances - Retrieves the balance information for a wallet
- getTransactions - Fetches recent transactions for a wallet
- whitelistAssets - Add assetIds to wallet's local whitelist
- transfer - Sends funds to another wallet

## Developing

This library relies on a large amount of native C++ code from other repos. To integrate this code, you must run the following script before publishing this library to NPM:

```sh
npm run update-sources
```

This script does the following tasks:

- Download third-party source code.
- Compile shared libraries for Android.
- Compile an iOS universal static library and put it into an XCFramework.

The `update-sources` script is also the place to make edits when upgrading any of the third-party dependencies. The react-native-zano repo doesn't include these third-party C++ sources, since they are enormous.

For this to work, you need:

- A recent Android SDK, installed at `$ANDROID_HOME`
- Xcode command-line tools
- `cmake`, provided by `brew install cmake`
- `llvm-objcopy`, provided by `brew install llvm`
