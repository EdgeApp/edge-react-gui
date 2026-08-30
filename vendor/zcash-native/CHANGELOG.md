# zcash-native

## Unreleased

- added: Node N-API addon (`zcash-native/node`) over zingolib `LightClient`, with one wallet file per alias under `documentDirectory`. Tools and Synchronizer keep the existing JS contract so Edge engines do not change. First open after this upgrade creates a new `.dat` and syncs from birthday.
- changed: Replaced the vendored Zcash Swift/Android SDKs with UniFFI bindings to the same zingolib crate used by Node.

## 0.13.3 (2026-08-27)

- changed: Update checkpoints

## 0.13.2 (2026-08-14)

- changed: A rescan no longer re-reports the transactions it is about to re-find, on either platform. The app empties its own transaction list for a resync and rebuilds it from what we send, but both platforms immediately sent the whole set back — Android because the rewind changes every row and its emitted-transaction tracking was cleared, iOS because `rescan` explicitly re-sent `allTransactions` once the rewind finished. The list refilled instantly, at pre-rewind heights on Android and as unmined everywhere, so a resync appeared to do nothing and settled history was described as pending. Both platforms now stay quiet and report each transaction as the scan finds it again, and nothing is carried across a resync — not even a send still waiting to be mined, which would otherwise be a row the scan can never rediscover and that outlives every resync.
- changed: Updated checkpoints
- fixed: Android no longer brands the entire transaction history as expired while a resync rescans the wallet. `isExpired` came from `TransactionState.Expired`, which compares an unmined transaction's expiry height against the live network tip — and a resync un-mines every transaction until the scan re-reaches its block, so the whole history flashed as failed in the app until the rescan completed. Android now reaches the same verdict the wallet database's `expired_unmined` column does, which is also the signal iOS reports: a transaction is expired only once the wallet's own contiguous scan has passed its expiry window without finding it mined.

## 0.13.1 (2026-08-02)

- added: `ironwoodAvailableZatoshi` / `ironwoodTotalZatoshi` on `BalanceEvent`, on both platforms (zero until NU6.3 activates); the deprecated summed fields now include the ironwood pool.
- added: Orchard -> Ironwood (NU6.3) migration surface, identical on both platforms. `Synchronizer.proposeOrchardToIronwoodMigration` builds the sweep: the SDK spends every Orchard note to the wallet's own address with the fee chosen so no Orchard change remains, leaving Sapling and transparent funds untouched, and the app broadcasts it through the ordinary `createTransfer` pipeline. `Tools.getIronwoodActivationHeight` answers from consensus constants (ZIP 258), which neither SDK exposes. There is no migration state to poll: whether to offer the sweep follows from the activation height, the wallet being synced, and the Orchard balance, and broadcasting it spends those notes.
- changed: Pinned the Swift SDK to 2.7.0-rc.4, the release the Zcash team confirmed production-ready for Ironwood (NU6.3). `update-sources` no longer builds the FFI's download URL from a version string - it takes the url and checksum from the `binaryTarget` the pinned checkout itself declares, so the FFI can never drift from the SDK source it was released against.
- changed: Bumped zcash-android-sdk (and the incubator) from 2.5.2 to 2.7.0-rc.4. It ships Kotlin 2.3 metadata, which the app already provides.
- fixed: A transaction that settled while nothing was listening is reported again on the next `subscribe`. The native event stream only carries transactions that are newly found or newly mined, and native drops events entirely until JavaScript attaches a listener, so a transaction mined while the app was closed - or during a failed sync - was neither on the next launch and was never reported again: it stayed at height 0, "pending", forever. `Synchronizer.subscribe` now asks native for the current transaction set once its listeners are attached, which is the only point at which delivery is guaranteed. Re-sending known transactions is harmless, since only those whose height or amount changed are updated.
- fixed: Checkpoint generation now carries the Ironwood commitment tree. `TreeState.ironwoodTree` (field 7) was missing from the bundled lightwalletd proto, so `update-checkpoints` would have silently dropped it and produced post-NU6.3 checkpoints with no Ironwood tree state — the same defect a post-NU5 checkpoint missing `orchardTree` has. Pre-activation output is unchanged (the field comes back empty and is stripped, exactly like `orchardTree` before NU5), so existing checkpoints need no regeneration.

## 0.13.0 (2026-07-31)

- changed: Updated checkpoints

## 0.12.2 (2026-07-14)

- changed: Updated checkpoints

## 0.12.1 (2026-06-18)

- changed: Updated checkpoints

## 0.12.0 (2026-06-13)

- changed: Convert the build tooling from Yarn to npm.
- security: Upgrade dependencies per Socket security recommendations.

## 0.11.0 (2026-06-03)

- changed: Upgrade sdks to v2.5.2
- changed: Use floats for scan progress
- changed: Updated checkpoints

## 0.10.7 (2026-04-24)

- changed: Updated checkpoints

## 0.10.6 (2026-04-10)

- changed: Updated checkpoints

## 0.10.5 (2026-03-24)

- changed: Updated checkpoints

## 0.10.4 (2026-02-24)

- changed: Updated checkpoints

## 0.10.3 (2026-01-28)

- changed: Updated checkpoints

## 0.10.2 (2025-12-09)

- changed: Updated checkpoints

## 0.10.1 (2025-12-04)

- added: `proposeFulfillingPaymentURI` support
- changed: iOS - Emit balance after rescan
- fixed: iOS - get UUID after starting synchronizer

## 0.10.0 (2025-11-18)

- changed: Upgrade iOS and Android sdks to v2.4.0

## 0.9.13 (2025-11-04)

- changed: Updated checkpoints

## 0.9.12 (2025-10-07)

- changed: Updated checkpoints

## 0.9.11 (2025-09-09)

- changed: Updated checkpoints

## 0.9.10 (2025-08-13)

- fixed: Make the `initialize` return type compatible with RN79.

## 0.9.9 (2025-08-04)

- changed: Updated checkpoints to block 3010000

## 0.9.8 (2025-07-22)

- changed: Updated checkpoints to block 3000000

## 0.9.7 (2025-04-30)

- changed: Updated checkpoints

## 0.9.6 (2025-04-02)

- changed: Updated checkpoints

## 0.9.5 (2024-12-02)

- changed: Updated checkpoints
- changed: Upgrade biggystring to v4.2.3

## 0.9.4 (2024-11-21)

- fixed: Fix argument passed to BlockHeight constructor

## 0.9.3 (2024-11-20)

- changed: (Android) Upgrade zcash-android-sdk to v2.2.5
- changed: (iOS) Upgrade zcash-swift-wallet-sdk to v2.2.6
- changed: Updated checkpoints

## 0.9.2 (2024-10-31)

- changed: Updated checkpoints

## 0.9.1 (2024-10-01)

- changed: Updated checkpoints

## 0.9.0 (2024-09-25)

- added: Support sending to ZIP-320 TEX addresses
- changed: Replace `sendToAddress` with `createTransfer`
- changed: Updated checkpoints

## 0.8.1 (2024-09-16)

- changed: Updated checkpoints

## 0.8.0 (2024-09-05)

- added: Add error listeners
- changed: Updated checkpoints

## 0.7.7 (2024-08-19)

- changed: Updated checkpoints

## 0.7.6 (2024-08-07)

- changed: Updated checkpoints

## 0.7.5 (2024-07-24)

- changed: Updated checkpoints
- fixed: Fix deriveViewingKey return value type

## 0.7.4 (2024-06-06)

- changed: Updated checkpoints

## 0.7.3 (2024-05-27)

- fixed: Add a missing header file to the podspec.

## 0.7.2 (2024-05-17)

- fixed: Pause synchronizer events until JavaScript is ready to receive them.

## 0.7.1 (2024-05-11)

- fixed: Stop depending on the iOS-provided SQLite, which causes crashes on iOS 13-15 because it is too old.

## 0.7.0 (2024-04-22)

- added: Support Orchard pool
- added: Support ZIP-317 fees
- changed: (Android) Upgrade zcash-android-sdk to v2.1.0
- changed: (iOS) Upgrade zcash-swift-wallet-sdk to v2.1.5
- changed: Updated checkpoints

## 0.6.14 (2024-04-12)

- fixed: Include missing Rust header file.

## 0.6.13 (2024-04-12)

- fixed: Update the packaging scripts to clean leftover files.
- fixed: Update the packaging scripts to correctly report errors, so we don't send failed packages to NPM.

## 0.6.12 (2024-04-10)

- fixed: Correct packaging mistake the previous release

## 0.6.11 (2024-04-10)

- changed: Updated checkpoints

## 0.6.10 (2024-03-27)

- changed: Updated checkpoints

## 0.6.9 (2024-03-12)

- changed: Updated checkpoints

## 0.6.8 (2024-02-23)

- changed: Updated checkpoints
- fixed: (android) Wrap sdk methods in try/catch to prevent native crashes

## 0.6.7 (2024-02-13)

- changed: Updated checkpoints

## 0.6.6 (2024-01-14)

- changed: Updated checkpoints

## 0.6.5 (2023-11-03)

- changed: Updated checkpoints

## 0.6.4 (2023-10-20)

- changed: (iOS) Upgrade ZcashLightClientKit to v2.0.3
- removed: (iOS) Remove transaction workaround added previously in v0.6.3

## 0.6.3 (2023-10-19)

iOS:

- changed: Emit all txs the first time the synchronizer says it's synced. This is a workaround for the synchronizer not publishing some transactions
- fixed: Fix fee amount returned with transaction.

## 0.6.2 (2023-10-16)

- changed: Upgrade ZcashLightClientKit to v2.0.2
- changed: Make `rescan` async
- changed: Throttle sync status to only report changes (iOS)

## 0.6.1 (2023-10-11)

- added: Add `shieldFunds` support
- changed: Package now exports types
- deprecated: Balance event fields `availableZatoshi` and `totalZatoshi`

Android

- changed: Various syntax cleanups
- fixed: Transactions event now returns confirmed and pending (<10 confirmations) transactions

## 0.6.0 (2023-10-10)

- added: Balances and transactions are no longer queryable and are now emitted as updates are found
- changed: Upgrade zcash-android-sdk to v2.0.1
- changed: Upgrade ZcashLightClientKit to v2.0.1
- changed: Return `raw` and `fee` with transactions
- removed: `getBalance` and `getTransactions`

Android:

- changed: Various syntax cleanups

iOS:

- fixed: Restart synchronizer on rescan
- fixed: Txid parsing

## 0.5.0 (2023-09-20)

- changed: `deriveUnifiedAddress` will now return all three address types
- changed: Replace `runBlocking` with async/await (Android)
- fixed: Rewrite `getTransactions` (Android)
- fixed: Force balance refresh before grabbing balances in `getBalance` (workaround for bug in SDK) (Android)

## 0.4.2 (2023-09-14)

- changed: Always return memos array with transactions
- changed: Simplify compactMap transform

## 0.4.1 (2023-09-13)

- fixed: Update checkpoint path (Android)
- fixed: Fix view key derivation (Android)
- fixed: Fix `getTransactions` early exit (Android)
- fixed: Fix hex string handling (Android)
- fixed: Fix recipient address availability assumption (iOS)

## 0.4.0 (2023-09-04)

- changed: Upgrade zcash-android-sdk to v1.20.0-beta01
- changed: Upgrade ZcashLightClientKit to v0.22.0-beta
- changed: Repackage `KoyTool` and `AddressTool` methods synchronizer-independent `Tools`

## 0.3.5 (2023-08-03)

- fixed: Update our default Kotlin version to be compatible with React Native v0.72.
- changed: Remove our iOS dependency on ZCashLightClientKit by copying the Swift sources directly into this NPM package. This removes the need for users to touch checkpoints on either platform.

## 0.3.4 (2023-07-27)

- added: Add checkpoints to repo with script to update and copy them from Android to iOS build directories
- changed: Proper install instructions for Android in README

## 0.3.3 (2023-06-22)

- fixed: Update the Android build.gradle to use the upstream-specified Kotlin version and upstream-specified appcompat library version.

## 0.3.2 (2022-12-20)

- getBirthdayHeight: Remove Android specific network name and use host and port for both platforms

## 0.3.1 (2022-12-15)

- Add `getBirthdayHeight` method to query blockheight without an active synchronizer
- iOS: Add missing `getLatestNetworkHeight` method
- RN: Remove unimplemented methods and POC comments
- Fix exported types

## 0.2.3 (2022-08-07)

- iOS: Handle potential throw in synchronizer.latestHeight()

## 0.2.2 (2022-06-10)

- Upgrade SDKs to NU5 compatible versions
  - Android: Upgrade zcash-android-sdk to v1.5.0-beta01
  - iOS: Upgrade ZcashLightClientKit to v0.14.0-beta
- iOS: Fix memory leak after stopping synchronizer
- ANdroid: White space and import cleanups

## 0.2.1 (2022-03-16)

- Update the ZcashLightClientKit dependency
- Remove unused build scripts

## 0.2.0 (2022-01-10)

- Add iOS support
- Android: Cleanup unused methods

## 0.1.0 (2021-11-09)

- Initial release

## 0.0.2

- Add stubs for deriveViewKey and getShieldedBalance

## 0.0.1

- Initial release
