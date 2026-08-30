# zano-native

## Unreleased

## 0.5.0 (2026-08-25)

- added: `runWallet`, which starts the refresh worker for an open wallet. `startWallet` rethrows `ALREADY_EXISTS` for its caller to adopt the already-open wallet, and an adopted wallet does not sync until it is run, so adopting callers need this without reimplementing the raw `run_wallet` response contract.
- changed: `transfer` no longer takes a `paymentId`, and never sends the request-level payment id. Zano HF6 deprecated the transaction-wide payment id -- the node rejects any non-empty value -- and instead delivers payment ids per destination, embedded in integrated addresses, which the wallet attaches natively. Forwarding the option therefore failed every send that carried one. A caller holding a separate payment id must fold it into an integrated destination address before calling. The per-destination address-info loop is also gone: it read fields the native `get_address_info` has never returned, so it never did anything except spend a native round-trip per recipient.
- changed: The `AddressInfo` type now matches the native response: `payment_id` is a boolean presence flag, and `is_integrated` does not exist. Both were previously declared with shapes no native version ever produced.
- fixed: `startWallet` no longer freezes the app while a wallet catches up on blocks. Opening a wallet auto-started its refresh worker, which holds the per-wallet lock for the entire first scan, so the 0.4.0 re-key migration's `resetWalletPassword` blocked on that lock for the whole catch-up (minutes to hours) while sitting on React Native's shared native-module queue, and on iOS every native call in the app queued behind it. Wallets now open with the refresh worker postponed, the migration completes in milliseconds, and the worker is started explicitly for the one wallet `startWallet` returns.
- fixed: Creating a wallet no longer freezes the app. `generateSeedPhrase` opened its temporary wallet without postponing the refresh worker, so the `closeWallet` that follows waited on the per-wallet lock, on the shared native-module queue, for the length of a refresh. A close that does not report OK now fails the call rather than deleting a file this process still holds open.
- fixed: The iOS module now withholds its document directory when the wallet directory cannot be created or excluded from device backups, so the bridge fails at construction instead of letting the SDK write seed and spend keys somewhere a backup would capture.

## 0.4.0 (2026-08-14)

- added: `startWallet` accepts an optional `log` callback that reports wallet-file recovery and migration events.
- added: A `ZanoError` class carrying the native API return code as `error.code`. Thrown error messages keep their existing `<code> <message>` shape.
- added: A unit-test suite (`npm test`) that runs the bridge against a fake native module.
- added: `update-sources.ts` fails the build if the Zano SDK declares a directory this package does not create and exclude from backups, so bumping the SDK pin cannot silently introduce an unprotected one.
- changed: Update `zano_native_lib` to `91085c0` for Zano HF6 support.
- changed: Build the iOS library against the prebuilt `libzano-plain-wallet` xcframework, since `zano_native_lib` no longer ships the raw `_libs_ios` OpenSSL and Boost archives.
- changed: Fetch only the pinned commit and the Git LFS objects we build against, instead of cloning the full history along with every platform's prebuilt archives.
- fixed: Native failures reported as success-shaped payloads (`INTERNAL_ERROR`, `UNINITIALIZED`) now throw instead of resolving with a wallet whose `wallet_id` is undefined.
- fixed: `generateSeedPhrase` no longer leaves a temporary wallet file on disk, encrypted with the seed passphrase, as a side effect of generating a seed.
- security: `startWallet` now encrypts the wallet file with a password derived from the mnemonic, instead of with the seed passphrase, which is the empty string for most wallets, leaving the seed and spend keys effectively unencrypted on disk. Files written by earlier versions are re-keyed in place the first time they open. A file that no known password opens is deleted and rebuilt from the mnemonic, costing one re-scan, unless the wallet has a seed passphrase. That case throws instead, since a passphrase that does not match the file would otherwise rebuild a different wallet over an intact one.
- security: Exclude every iOS directory the SDK writes into -- `wallets`, `logs` and `app_config` -- from device backups, so the wallet files no longer reach an unencrypted Finder backup. Android stores these in private app storage and already sets `android:allowBackup="false"`.

## 0.3.0 (2026-06-13)

- changed: Convert the build tooling from Yarn to npm.
- security: Upgrade dependencies per Socket security recommendations.

## 0.2.8 (2026-02-23)

- fixed: Remove invalid const qualifier from std::vector element types to fix Xcode 26 builds

## 0.2.7 (2026-02-15)

- fixed: Add missing `wrap` and `auditable` fields to `AddressInfo` type

## 0.2.6 (2026-01-29)

- changed: Update `zano_native_lib` to `239d4a39`

## 0.2.5 (2025-11-17)

- fixed: Show proper messages for C++ errors.

## 0.2.4 (2025-09-19)

- fixed: Re-publish with correctly-built binaries.

## 0.2.3 (2025-09-18)

- fixed: Fix `burnAsset` return value and types

## 0.2.2 (2025-09-09)

- added: Add `burnAsset` method

## 0.2.1 (2025-07-21)

- fixed: Support 16k pages for Android 15.

## 0.2.0 (2025-05-26)

- changed: `transfer` now accepts an array of destinations.

## 0.1.3 (2025-05-05)

- fixed: Shield symbols for iOS builds using partial linking and symbol encapsulation.

## 0.1.2 (2025-04-29)

- fixed: Republish with missing .so files

## 0.1.1 (2025-04-25)

- fixed: package.json types path

## 0.1.0 (2025-04-25)

- Initial release
