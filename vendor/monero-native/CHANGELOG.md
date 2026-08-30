# monero-native

## Unreleased

## 0.5.0 (2026-08-14)

- changed: (Breaking) `broadcastTransaction` returns a `BroadcastResult` with the transaction secret key (`txKey`) instead of the string `"success"`. The key is the sender's only proof of payment and the broadcast is the send path's only chance to hand it to the caller, since it cannot be derived from the seed. A key the wallet cannot report never fails an already-broadcast payment: the result simply carries no `txKey`.

## 0.4.2 (2026-07-17)

- changed: Bump vtnerd/lwsf to da8e2617958312f10fe4406808c2a951c5cf0a09

## 0.4.1 (2026-07-14)

- fixed: iOS no longer crashes with EXC_BAD_INSTRUCTION (SIGILL) in `CRYPTO_atomic_load` on A11 and older devices (iPhone X, 8, 7, 6s) the moment a wallet opens. OpenSSL's `ios64-xcrun` build target stopped passing a deployment-target flag, so clang targeted the SDK version and raised the CPU baseline to apple-a12, emitting ARMv8.3 `ldapr` (and ARMv8.1 LSE) instructions those chips lack; the first SSL client construction (`getWalletManager` → `boost::asio::ssl::context` → `ERR_clear_error`) executed one and crash-looped the app on login. The OpenSSL build now pins `-miphoneos-version-min`/`-mios-simulator-version-min` to the platform minimum, restoring the ARMv8.0 baseline (`ldar`).

## 0.4.0 (2026-07-06)

- added: `getWalletStatus` reports a `refreshed` flag, true once the wallet has completed its first server refresh (and so knows its real balance and spendable outputs). LWS wallets report seed heights that look synced before then, so treat a wallet as synced only when `refreshed` is true.
- fixed: LWS wallets can spend and receive over the Nym mixnet. The lwsf RPC timeout of 5 seconds was too short for a mixnet round-trip, so single-shot spend and receive calls failed; the Nym path now uses a 120-second budget.

## 0.3.0 (2026-07-03)

- added: `getPendingTransactions`, a paged view of the not-yet-mined transactions. `getAllTransactions` sorts pending entries behind all confirmed ones, so a cursor-based scan of confirmed history never reaches them; this exposes the pending set directly.
- fixed: LWS wallets sync again. The 0.2.0 https change passed `use_ssl=true` to `wallet->init` for https daemons; wallet2 (monerod) ignores that flag, but lwsf honors it and switches from tolerant `ssl_support_autodetect` to `ssl_support_enabled`, whose certificate verification always fails on iOS/Android (no OpenSSL system CA store in the app sandbox). Every LWS connection was silently dropped at the TLS handshake, so LWS wallets polled forever at height 0 with no transactions or balance. Revert to `use_ssl=false` (TLS still autodetected from the `https://` scheme); the Nym scheme fix is unaffected since it derives https from the port inside NymHttpClient.
- fixed: Monero Full Node (monerod) sends no longer fail with "Failed to load transaction from file". `createTransaction` now retains the signed transaction natively and `broadcastTransaction` commits it directly, instead of saving it to a file and reloading it: on the full-node (wallet2) backend `save_tx` writes an unsigned tx set while `submitTransaction`'s `load_tx` requires a signed one, so the file round-trip always failed. Retained transactions are capped at 50 per wallet (oldest disposed first) and cleared when the wallet closes. Method signatures are unchanged, but the semantics narrow: `signedTxHex` is now an opaque token (the txid) identifying the retained transaction rather than serialized bytes, a signed transaction can no longer be broadcast after its wallet closes or the app restarts (`broadcastTransaction` reports that it must be recreated), and payments the wallet would split into multiple on-chain transactions are rejected at creation so a broadcast is atomic.

## 0.2.0 (2026-06-29)

- changed: Switch the package manager from yarn to npm (package-lock.json + `.npmrc` legacy-peer-deps), matching the other Edge currency repos.
- fixed: Monero Full Node (monerod) wallets now sync, calculate max, and send when the Nym mixnet is enabled. The Nym HTTP client rebuilt request URLs from an unreliable SSL flag and emitted `http://` on port 443, so every monerod RPC failed under Nym while the same wallet worked with Nym off. Derive the scheme from the daemon address (and treat port 443 as https).
- fixed: `getWalletStatus` now reads the live wallet balance on every call instead of only recomputing it when the synced block height changes, so a pending incoming transaction (or pending change after a send) is reflected immediately rather than after the next block.

## 0.1.0 (2026-06-15)

- Initial release
