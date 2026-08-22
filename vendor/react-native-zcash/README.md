# react-native-zcash

This library packages the ZCashLightClientKit for use on React Native.

## Usage

First, add this library to your React Native app using NPM or Yarn, and run `pod install` as necessary to integrate it with your app's native code.

If you encounter errors during `pod install`, you may need to add the following code to the `target` section of your Podfile:

```ruby
# Zcash transitive dependencies:
pod 'CGRPCZlib', :modular_headers => true
pod 'CNIOAtomics', :modular_headers => true
pod 'CNIOBoringSSL', :modular_headers => true
pod 'CNIOBoringSSLShims', :modular_headers => true
pod 'CNIODarwin', :modular_headers => true
pod 'CNIOHTTPParser', :modular_headers => true
pod 'CNIOLinux', :modular_headers => true
pod 'CNIOWindows', :modular_headers => true
pod 'sqlite3', :modular_headers => true
```

On the Android side, you may need to configure an explicit Kotlin version, so all your native dependencies will be compatible with one another. Simply define `kotlinVersion` in your `android/build.gradle` file:

```groovy
buildscript {
  ext {
    kotlinVersion = '1.8.22'
  }
}
```

### API overview

- `Tools`
  - `deriveViewingKey`
  - `getBirthdayHeight`
  - `isValidAddress`
- `makeSynchronizer`
  - `start`
  - `stop`
  - `rescan`
  - `getLatestNetworkHeight`
  - `sendToAddress`
  - `shieldFunds`
  - `deriveUnifiedAddress`

`Tools` contains methods that don't require a running synchronizer (with one exception, `isValidAddress` on Android which does requires any synchronizer connected to the requested network). In addition to the methods above, the following events can be subscribed to:

- `BalanceEvent`- available and total transparent and shielded balances
- `StatusEvent` - current synchronizer activity (`STOPPED`, `DISCONNECTED`, `SYNCING`, and `SYNCED`)
- `TransactionEvent`- confirmed transactions
- `UpdateEvent` - syncing progress and network height

## Developing

This library relies on a large amount of native code from other repos. To integrate this code, you must run the following script before publishing this library to NPM:

```sh
npm run update-sources
```

This script will download ZCashLightClientKit and zcash-light-client-ffi, modify them for React Native, and integrate them with our wrapper code.

The `update-sources` script is also the place to make edits when upgrading any of the third-party dependencies.

We also have an `update-checkpoints` command that will connect to a node and generate fresh checkpoints based on the chain state.

### Source Formatting

Install `ktlint` and `swift-format` using your package manager, such as `brew install ktlint swift-format`. Run `fix-swift` or `fix-kotlin` to format the native sources.
