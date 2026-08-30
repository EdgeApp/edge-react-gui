# edge-currency-accountbased

## Unreleased

- changed: Use `monero-native`, `zano-native`, and `zcash-native` for React Native and Node IO instead of `react-native-monero` / `react-native-zano` / `react-native-zcash`.
- added: Node Zcash native IO for CLI wallets, auto-injecting `nativeIo.zcash` from `io.path/native/zcash` via `react-native-zcash/node`.
- added: `edge-currency-accountbased/node-zcash` `makeZcashIo` for Node, wrapping the react-native-zcash N-API addon. The React Native `zcashIo` entry is unchanged.
- added: `edge-currency-accountbased/node-monero` `makeMoneroIo` for Node, wrapping the react-native-monero N-API addon. The React Native `rn-monero` entry is unchanged.
- added: `edge-currency-accountbased/node-zano` `makeZanoIo` for Node, wrapping the react-native-zano N-API addon. The React Native `rn-zano` entry is unchanged.

## 4.88.0 (2026-08-14)

- added: (Zano) Verify that the native wallet address matches the address derived from the seed phrase when a wallet starts, failing the start rather than syncing a wallet whose native address is not the one shown to the user.
- added: (Zano) Report wallet-file migration and recovery events to the wallet log, so a re-keyed or rebuilt wallet file is visible in support logs rather than silent.
- changed: (Zano) Generate seed phrases from the plugin's own entropy rather than through the native library. Creating a wallet no longer starts the native library or writes a wallet file to disk, and the generated phrase is self-checked offline: it must decode back to the entropy it was built from, and its checksum word must match.
- changed: (Zano) Derive addresses and validate seed phrases without the native library, so scanning or sweeping a Zano private key no longer needs the native module. Phrases protected by a seed passphrase still use the native library, which is the only implementation that supports them.
- changed: (Zano) Update react-native-zano to ^0.4.0, which carries the Zano HF6 SDK and encrypts the wallet file on disk with a password derived from the mnemonic instead of the seed passphrase.
- changed: (Monero) Transactions also carry their key in `otherParams.txSecret`. The core only saves a key it sees when a transaction is first filed, so keys for sends made while the send path reported none never reached the GUI; `otherParams` rides through untouched, which lets the GUI show those keys from the wallet engine's own store.
- fixed: (Zano) Roughly one in 814 newly created seed phrases came out with 25 words and a trailing space instead of 26 words, because the mnemonic library was missing a checksum wrap-around case that Zano core handles.
- fixed: (Zano) Read the private view key without taking the native per-wallet lock. The app requests it for every wallet shortly after login, and the previous call blocks with no timeout, so an account with several Zano wallets could hang while one of them was mid-refresh.
- fixed: (Zcash) The sync ratio no longer holds a stale value for the whole rescan after a resync. The synchronizer is deliberately left running across a resync, so progress it sampled beforehand can be delivered after the sync tracker has been reset. The tracker trusts a first-seen 100 and never goes backwards, so one such report pinned the ratio until the next login - at 1 for a wallet that was synced, or at wherever it had reached for a wallet that was still syncing, which is a common reason to resync in the first place. Progress reports are now ignored for the span of the resync, from before the engine is torn down until the rewind has actually happened, since a stale report is indistinguishable from a fresh one and a status transition cannot mark the boundary either - iOS suppresses the synchronizer's post-rescan SYNCED entirely.
- fixed: (Monero) Outgoing transactions report their transaction key again. The key is the sender's only proof of a payment, and the move to react-native-monero dropped it from the send path, so every send since then has shown an empty Transaction Key.

## 4.87.0 (2026-08-02)

- added: (Sui) `rpcNodes`, `rpcNodesArchival`, and `maxRequestsPerSecond` to the info payload, so nodes can be changed without a client release. Transaction sweeps start on an archival node, since the walk begins at the wallet's oldest transaction and a pruned node rejects a cursor older than its retention window.
- added: (Monero) Verbose `log.warn` tracing of the wallet init and sync process — backend and server selection, LWS login, birthday-height recovery, nym proxy setup, native `openWallet` timing, sync phase transitions with heights and balances, history backfill progress, and pending-pool entries and evictions. Sync-phase and init lines are throttled so a once-per-second poll (or a failing open that retries every poll) cannot flood the log, while every phase change logs immediately, so a wallet stuck initializing or syncing shows where it stopped. Server URLs are logged as their origin only, since a custom server setting can carry credentials.
- added: Zcash: Orchard -> Ironwood (NU6.3) migration detection - `otherMethods.getMigrationStatus` reports when a sweep into the new Ironwood pool is worth offering, from the activation height, sync state and Orchard balance. The sweep itself runs through the ordinary send path, sourcing its amount, fee and proposal from the SDK's Orchard-only migration proposal so no other pool crosses the turnstile.
- added: Zcash: Ironwood pool balances join the per-pool split and the reported available balance.
- changed: (Sui) Broadcast submits to every configured node at once, succeeding if any one does.
- changed: (Monero) Log plugin failures with `log.warn` instead of `log.error` so a failure and the steps leading to it stay in one stream, and log a failed `openWallet` regardless of the thrown value's type (a non-`Error` throw was previously silent).
- changed: Zcash: Upgrade react-native-zcash to v0.13.1, which carries upstream SDK 2.7.0-rc.4 - the release the Zcash team confirmed production-ready for Ironwood (NU6.3).
- fixed: (Sui) Restore syncing and sending after Mysten removed JSON-RPC from the public fullnodes. The plugin used the SDK's `getFullnodeUrl`, which now answers every method with `-32601`, breaking balances, transaction history, fee estimation, and broadcast. Replaced with configurable node lists served by third-party providers that still offer JSON-RPC, raced across nodes with a per-node timeout, and made overridable from the info server.
- fixed: (Sui) Transaction sync progress no longer reports as complete when the queries failed. A total RPC outage previously presented as a wallet frozen at 50% rather than one visibly failing to sync.
- fixed: (Sui) Transaction sweeps commit their cursor per page. Previously a failure part-way through discarded every page of progress, so a wallet whose history could not be swept in a single pass never advanced.
- fixed: (Sui) Token sends page through coins with a cursor. The previous loop re-read the first page indefinitely when it did not cover the send amount.

## 4.86.3 (2026-07-27)

- fixed: (Thorchain/Mayachain) Stop recording failed MsgDeposit actions (Midgard `type: 'failed'`) as full-amount sends. The reverted deposit never moved funds, so only the burned network fee is recorded, marked as a failed transaction — matching the existing failed-send handling.

## 4.86.2 (2026-07-17)

- changed: (Base) Use dynamic `eth_feeHistory` fee estimation instead of a hardcoded 2 gwei priority floor. The previous static floor caused sends to overpay by ~200x during normal network conditions. The dynamic algorithm tracks real-time percentile-based priority fees with a 2x base-fee buffer, so fees rise naturally during congestion spikes and drop to market rate otherwise. The static `minPriorityFee` fallback (used only when `eth_feeHistory` fails) is lowered from 2 gwei to 0.1 gwei, a conservative 20x reduction that covered the observed p99 priority fee in a 1,024-block Base sample.

## 4.86.1 (2026-07-15)

- fixed: (MAYAChain/THORChain) Failed transactions no longer appear in history as successful receives. Midgard reports a reverted transaction's full `in`/`out` amounts even though nothing moved on-chain; we now honor the action `status` and, for a failed action, record a fee-only transaction marked `failed` for the signer (like a failed EVM transaction) instead of crediting the intended recipient.

## 4.86.0 (2026-07-13)

- added: (Zano) Bridgeless bridge tokens SOLx (Solana), TONx (Toncoin), and FUSDx (Freedom Dollar).
- added: (Ethereum) FUSD (Freedom Dollar) token for Bridgeless swaps.
- added: (TON) `otherMethods.makeTx` to build custom-body internal-message transactions (e.g. Bridgeless bridge deposits).
- added: (Solana) `otherMethods.makeTx` to build custom program-instruction transactions (e.g. Bridgeless bridge deposits).
- added: (Solana/TON) `otherMethods.getMaxTx` reporting the maximum spendable amount for makeTx transactions, and a Solana makeTx balance check so deposits that cannot cover the network fee fail before broadcasting.
- fixed: (Tron) Token balance sync failing with `invalid BigNumber string` — pin `tronweb` to exactly 5.1.0 (5.3.x rejects the bare-hex address arrays used by the TRC20 balance checker) and pass 0x-prefixed lowercase addresses so the call also works on newer TronWeb versions.

## 4.85.3 (2026-07-06)

- fixed: (Monero) Incoming transactions no longer sort to the bottom of the history with a 1970 date when the backend reports no timestamp; they get a stable first-seen date until the real block time arrives.
- fixed: (Monero) LWS wallets no longer briefly report as synced with a stale balance before their first server refresh completes.

## 4.85.2 (2026-07-06)

- fixed: (Hedera) HBAR sends failed with an "[object Object]" error. The npm conversion re-resolved `@hashgraph/sdk` to 2.81, whose account-ID serialization calls `Long.fromBigInt` — a method missing from the pinned `long@4.0.0` override. Bump the `long` override to the `5.3.1` the SDK declares so transactions serialize, sign, and broadcast.

## 4.85.1 (2026-07-03)

- added: (Monero) Mark transactions that leave the mempool without confirming as dropped, instead of leaving them displayed as unconfirmed forever. A tx must stay missing for 30 minutes before it is declared dropped, since a just-mined tx briefly disappears from both the mempool and confirmed history while the LWS server indexes its block. Time while the app is closed, and the initial backfill after a relaunch, do not count toward that grace.
- fixed: (Hedera) HBAR sends failed with an "[object Object]" error. The npm conversion re-resolved `@hashgraph/sdk` to 2.81, whose account-ID serialization calls `Long.fromBigInt` — a method missing from the pinned `long@4.0.0` override. Bump the `long` override to the `5.3.1` the SDK declares so transactions serialize, sign, and broadcast.
- fixed: (Monero) Pending (unconfirmed) transactions now appear in the transaction list as soon as the wallet sees them, instead of only after their first confirmation. Pending entries sort behind all confirmed history in the native transaction list, so the newest-known-txid history scan never reached them; on LWS the balance would move with no transaction row to explain it. Requires react-native-monero with `getPendingTransactions`.
- fixed: (Monero) First-sighted incoming transactions still emit the new-transaction notification even though they now enter the wallet while pending (the base checkpoint math treats a height-0 entry as already seen).
- fixed: (Monero) Repair transactions stuck displaying as unconfirmed because the history-scan cursor was recorded while they were still pending, including ones sitting behind the repaired cursor.
- fixed: (Monero) Confirmation counts no longer bounce up and down. The network height reported by the native layer can briefly regress (the LWS client reports the stored account scan height until its first refresh completes, and a load-balanced daemon can answer a block behind the previous poll), and every height change re-stamps every transaction's confirmation count. Small regressions are smoothed so counts only advance, while a large regression is accepted as a correction so one bad reading cannot stick until resync.

## 4.85.0 (2026-06-29)

- changed: (Monero, Zano) Report sync progress at least once a second while it is still advancing, so a slow chain shows steady movement instead of appearing frozen between whole-percent updates.
- changed: Upgrade yaob to v0.4.0 to dedupe the bridge instance shared with edge-core-js (mismatched yaob copies cross-wire native plugin IO).
- fixed: (TON) Prevent duplicate transactions by keying a sent transaction on its external in-message hash. The broadcast and the transaction-list sync derive the same hash, so the pending send reconciles with the confirmed transaction, and the hash resolves on the block explorer. An already-deployed wallet derives this locally with no network lookup; only a wallet's very first send looks the hash up once, after the contract deploys.
- fixed: (Monero) Update the wallet balance as soon as a pending transaction is received and on every sync poll, instead of only after a new block, so an incoming pending amount appears immediately.
- fixed: (Monero) Calculate the max sendable amount from the wallet's live unlocked balance instead of a stale cached value, so tapping Max no longer intermittently returns 0 or an unsendable amount.

## 4.84.1 (2026-06-23)

- fixed: (Stellar) Resolve the "undefined is not an object (evaluating 'Horizon')" crash on login by importing stellar-sdk v13 symbols (Horizon, Keypair, Account, TransactionBuilder, etc.) as named exports. The plugin's WebView uses stellar-sdk's browser build, whose default export is undefined, so the previous default-namespace access (stellarApi.Horizon.Server) threw.

## 4.84.0 (2026-06-18)

- added: Add monero plugin
- fixed: (HyperEVM) Use Etherscan V2 (api.etherscan.io) as the primary transaction-history source and increase the query lookback to 5 minutes, fixing slow/missing transaction list syncing.

## 4.83.0 (2026-06-12)

- changed: Convert the build tooling from Yarn to npm.
- changed: Migrate to bip32 v4 (using the WASM-free @bitcoinerlab/secp256k1), @ethereumjs/util v9, and stellar-sdk v13.
- security: Upgrade dependencies per Socket security recommendations.

## 4.82.1 (2026-05-27)

- changed: (FIO) Replace forked `@fioprotocol/fiosdk` with official npm 1.10.3.

## 4.82.0 (2026-04-28)

- added: zcash - Populate `EdgeTransaction.spendTargets` with the recipient address for outgoing transactions, enabling reverse address lookups (e.g. ZNS) in the GUI.
- changed: (FIO) Use `promisesAgree` on public address resolution
- fixed: zcash - Honor the ZIP-321 `memo` query parameter when parsing payment URIs (base64url decoded), unblocking ZNS claim flows.

## 4.81.2 (2026-04-24)

- changed: Update chain-registry

## 4.81.1 (2026-04-23)

- added: (Cardano) Support parsing Byron addresses
- fixed: (Solana) Fix SOL calculation spent to fund new accounts

## 4.81.0 (2026-04-18)

- changed: Migrate THORChain mainnet endpoints (RPC, thornode, Midgard, archive) off NineRealms to gateway.liquify.com.

## 4.80.0 (2026-04-16)

- added: (Zano) Support base58-encoded raw seed imports in `parseUri`, with and without a `zano:` prefix

## 4.79.1 (2026-04-10)

- changed: Update chain-registry

## 4.79.0 (2026-04-10)

- added: (Zano) Add ETHx BNBx DAIx and BCHx tokens
- fixed: (ZEC) Fix missing incoming transaction notifications

## 4.78.1 (2026-04-08)

- added: (DOT) Add Subscan API key support
- changed: (TON) Replace Orbs servers with dRPC

## 4.78.0 (2026-04-06)

- added: (Zano) Add makeMaxSpend otherMethod to build single-transaction multi-asset max spends.

## 4.77.2 (2026-03-24)

- changed: Update chain-registry package

## 4.77.1 (2026-03-23)

- added: (Zano) Add sweep support for Zano and tokens

## 4.77.0 (2026-03-12)

- added: (Ethereum) Add XAUt (Tether Gold) ERC-20 builtin token

## 4.76.1 (2026-03-10)

- changed: Update chain-registry package

## 4.76.0 (2026-03-10)

- changed: Enhanced EthereumEngine `dumpData()` to include active network adapter configuration

## 4.75.3 (2026-03-06)

- fixed: Mayachain: Use network constants for fees

## 4.75.2 (2026-02-24)

- changed: Update chain-registry package

## 4.75.1 (2026-02-23)

- fixed: (Zano) Clear native storage on resync to prevent stale cached data conflicts
- fixed: (Zano) Fix BTCx mint transactions not showing in wallet

## 4.75.0 (2026-02-23)

- changed: Update Coreum display names to TX branding

## 4.74.2 (2026-02-21)

- fixed: Correctly handle `throw undefined` in the ETH update loop
- fixed: Typo in the NYM contract address
- fixed: Use correct Alchemy URL's

## 4.74.1 (2026-02-21)

- fixed: (Maya) Fix MAYAChain (CACAO) `currencyInfo.displayName`

## 4.74.0 (2026-02-19)

- changed: Return first denom from getDenomination
- fixed: `upgradeRegistryAndCreateMethods` for Mayachain CACAO

## 4.71.4 (2026-02-15)

- changed: Move FIO SDK fork under EdgeApp GitHub organization

## 4.71.3 (2026-02-15)

- fixed: (Zano) Reject wrapped ETH addresses in address validation

## 4.73.2 (2026-02-15)

- fixed: (HyperEVM) Correct USD₮0 denomination multiplier from 18 to 6 decimals
- fixed: (Zano) Reject wrapped ETH addresses in address validation

## 4.73.1 (2026-02-13)

- changed: Move FIO SDK fork under EdgeApp GitHub organization

## 4.73.0 (2026-02-10)

- chaged: Utilize the new edge-core-js sync status API (when available).

## 4.72.1 (2026-02-09)

- fixed: Fix missing engine scope in Liberland transaction processing

## 4.72.0 (2026-02-05)

- added: Cacao (CACAO) MAYAChain support
- added: Add Monad (MON) support
- added: Nym (NYM) Cosmos-based chain with NYX builtin token
- added: (Ethereum) NYM ERC-20 builtin token
- added: (BSC) NYM BEP-20 builtin token
- added: opBNB support

## 4.71.2 (2026-02-02)

- fixed: Remove extra call to whitelistAssets that was hanging and preventing core callbacks from resolving

## 4.71.1 (2026-01-28)

- changed: Update chain-registry package

## 4.71.0 (2026-01-27)

- added: (Cosmos) Add networkPrivacy user setting to enable privacy-enhanced fetch requests
- added: (Ethereum) Add networkPrivacy user setting to enable privacy-enhanced fetch requests

## 4.70.0 (2026-01-16)

- changed: (Polkadot) Update block explorer URL

## 4.69.0 (2026-01-12)

- added: (Celo, FilecoinFEVM, Sonic, RSK) Add ethBalCheckerContract to network adaptor configs
- changed: FIO - Stop saving blockheight on broadcast
- fixed: Auto token detection for Cosmos-related networks

## 4.68.0 (2025-12-19)

- changed: Use `EdgeTransaction.confirmations`
- changed: Migrate ondisk transaction data keyed by `currencyCode` to `tokenId`
- changed: Refactor Ethereum `EthereumNetwork.acquireUpdates` to allow partial status updates

## 4.67.0 (2025-12-09)

- changed: Index internal wallet data with tokenIds

## 4.66.0 (2025-12-04)

- added: (Zano) BTCx token
- added: (Zcash) ZIP-321 URI support
- changed: (Polygon) Decrease gas polling frequency to 1 minute
- fixed: (Polygon) Use `maxFee` instead of `maxPriorityFee` for gas station parsing

## 4.65.1 (2025-11-28)

- fixed: Disabled decoy address routines for performance reasons.

## 4.65.0 (2025-11-18)

- changed: Upgrade react-native-zcash to v0.10.0
- changed: Deprecated Grove RPC endpoints updated to Pokt equivalents

## 4.64.0 (2025-11-14)

- changed: Upgrade @polkadot/api to latest to support Asset Hub migration

## 4.63.2 (2025-11-13)

- fixed: Max spend amount calculations for L2 chains

## 4.63.1 (2025-11-12)

- changed: (BSC) Lower minimum gas price to 0.05 gwei
- changed: Report Piratechain engine syncRatio as download progress since birthday height
- fixed: Zano `parseUri` currencyCode validation

## 4.63.0 (2025-11-04)

- added: Decoy address subscriptions for engines that use the change-server.
- changed: Replace eztz.js with @taquito
- changed: Upgrade chain-registry package.
- changed: (EVM) Use new `needsSync` API from core to fix syncing correctness issues.
- fixed: Added exponential backoff for syncNetwork "retriable" errors.

## 4.62.0 (2025-10-31)

- added: evmChainId values for all EVM chains

## 4.61.4 (2025-10-14)

- added: Add `asyncStaggeredRace` promise util
- changed: Update Axelar node list

## 4.61.3 (2025-10-12)

- fixed: (OSMOSIS) Fix syncing

## 4.61.2 (2025-10-07)

- changed: Upgrade chain-registry package.

## 4.61.1 (2025-10-03)

- fixed: (XLM) Properly store only memo text or ID in a transaction, not both
- fixed: (XRP) Parsing of on-chain memos

## 4.61.0 (2025-10-03)

- added: (COSMOS) Add DEX tx support
- added: (OSMOSIS) Add ATOM to default tokens

## 4.60.1 (2025-09-18)

- fixed: Remove unintentional addition to 4.60.0: Added exponential backoff for syncNetwork "retriable" errors.

## 4.60.0 (2025-09-18)

- added: Added exponential backoff for syncNetwork "retriable" errors.
- added: Add `makeTx` support to `SuiEngine`
- changed: Update rnzano burn asset types

## 4.59.2 (2025-09-09)

- added: (Zano) Add burn asset support

## 4.59.1 (2025-09-08)

- fixed: (Thorchain) Correctly parse incoming TCY transactions.
- fixed: (Sui) Disallow 32-byte hex private key import from `parseUri`

## 4.59.0 (2025-09-03)

- added: (Sui) Support Bech32 `suiprivkey1...` private key import and ASCII‑hex Bech32 inputs; normalize derive/sign to accept mnemonic or hex
- added: (Solana) Add 64‑byte hex private key import; unify public key derivation across mnemonic/base58/hex
- added: (FIO) Detect private keys in `parseUri` and return early to support sweeping
- added: (DOT) Enable 32/64‑byte hex private key import; derive SS58 from mnemonic or 32‑byte seed
- fixed: (DOT) Prevent React Native WASM runtime errors during sweep by forcing asm backend and awaiting crypto initialization
- fixed: Avoid deprecated Gradle syntax.

## 4.58.0 (2025-08-12)

- changed: Upgrade chain-registry package.
- changed: (EVM) Use Etherscan V2 for `etherscan.io` gas oracle calls

## 4.57.0 (2025-08-04)

- added: Filecoin FEVM token support
- changed: Require the environment to support es2015 & `async` functions.

## 4.56.8 (2025-08-04)

- added: (EVM) Accept transactions with a provided `otherParams.nonce` even if pending transactions exist
- fixed: (EVM) Update blockHeight immediately when receiving transactions to prevent them from appearing as "syncing"

## 4.55.8 (2025-08-01)

- fixed: Fix Botanix asset display name.

## 4.55.7 (2025-08-01)

- fixed: Fix Botanix display name and chain name.

## 4.55.6 (2025-07-31)

- fixed: (EVM) Fix missing rate-limit error detection
- added: (EVM) Add gastrackerSupport flag to evmscan adapter config
- added: (EVM) Include more cases to RateLimitError

## 4.55.5 (2025-07-28)

- added: Implement ethFeeHistory fee algorithm for EIP-1559 chains with percentile-based priority fee estimation, initially enabled for Botanix network

## 4.55.4 (2025-07-25)

- fixed: Add xrp network support to RippleTools parseUri networks

## 4.55.3 (2025-07-24)

- changed: HyperEVM block explorer links changed from hyperliquid.xyz to hyperevmscan.io.

## 4.55.2 (2025-07-22)

- changed: Upgrade chain-registry package.

## 4.55.1 (2025-07-21)

- fixed: Fixed incorrect assumptions of Zano deeplink comment parsing.

## 4.55.0 (2025-07-21)

- added: Added Botanix EVM currency.
- added: Added HyperEVM EVM currency.
- fixed: Sync accuracy, reliability, and resync bugs.
- fixed: Network thrashing when transaction fetching fails from an unknown error.

## 4.54.0 (2025-07-18)

- changed: (Zano) `getDisplayPublicSeed` waits for wallet initialization before returning instead of throwing
- fixed: (Zano) Deeplink parsing bug when scanning for unknown currency.
- fixed: (Zano) Wallet initialization failure when the wallet exists in the sdk

## 4.53.0 (2025-07-07)

- added: (Zano) `getDisplayPublicSeed` in `ZanoEngine` to return the private view key
- fixed: (DOT) Mismatching fee calculations between `makeSpend` and `getMaxSpendable`
- removed: (Zano) `getDisplayPublicKey` which was returning the public address instead of the private view key

## 4.52.2 (2025-07-03)

- fixed: (EVM) Added exponential backoff function to etherscan/evmscan API call retries.
- fixed: (EVM) Fixed regression with internal transaction queries.
- fixed: Zano deeplink parsing bug when scanning for native ZANO currency.

## 4.52.1 (2025-07-01)

- changed: Changed Fantom's block explorer to 'explorer.fantom.network'.

## 4.52.0 (2025-06-30)

- added: Support Zano deeplink URI parsing (e.g. zano: addresses).

## 4.51.0 (2025-06-24)

- changed: Osmosis archive node urls

## 4.48.5 (2025-06-24)

- changed: Osmosis archive node urls

## 4.48.4 (2025-06-20)

- added: (Solana) Token2022 support
- fixed: (EVM) Broken token tx query causing stalled syncing when no token transfers found.

## 4.50.0 (2025-06-19)

- added: (Solana) Token2022 support
- fixed: (EVM) Broken token tx query causing stalled syncing when no token transfers found.

## 4.49.0 (2025-06-16)

- added: Added `resolveName` method to Zano `otherMethods` for Zano alias resolution.
- changed: (EVM) Require unconfirmed transactions to be specified in `makeSpend` via `pendingTxs` parameter.

## 4.48.3 (2025-06-06)

- changed: Improved change-server integration by usage of checkpoints.
- fixed: Remove gas station multiplier to fix gas-station calculations.

## 4.48.2 (2025-06-05)

- changed: (Hedera) Save memo to queried transactions
- fixed: (Hedera) Fix missing transactions by specifying query limit
- fixed: Updated FEVM default gas price settings.
- fixed: Include deprecated `defaultSettings` field in FEVM's EdgeCurrencyInfo for legacy support.
- fixed: (Optimism/Sepolia/Holesky) Remove defunct etherscan server URIs.
- fixed: Broken response cleaner for etherscan v2 proxy module request (used for broadcasts).

## 4.48.1 (2025-05-27)

- fixed: Do not send duplicate new-transaction notifications.

## 4.47.2 (2025-05-27)

- fixed: Do not send duplicate new-transaction notifications.

## 4.46.2 (2025-05-27)

- fixed: Do not send duplicate new-transaction notifications.

## 4.48.0 (2025-05-26)

- added: Implement `getTokenDetails` in Ethereum and Zano tools
- added: (Zano) Support infoServerTokens
- changed: Allow Zano to spend to multiple destinations
- changed: Fill in MakeTxDeposit Edge transaction data when sending one asset
- fixed: Update builtinTokens with infoServerPayload when creating tools

## 4.47.1 (2025-05-13)

- fixed: (TRX) Fees simplified to use `wallet/triggerconstantcontract` `energy_used`

## 4.47.0 (2025-05-12)

- changed: Upgrade to Etherscan V2 for supported networks

## 4.46.1 (2025-05-08)

- changed: Revert Tron tx query optimizations

## 4.46.0 (2025-05-08)

- added: (Thorchain) Add TCY token
- added: Add Thorchain Stagenet
- changed: (Fantom) Update explorer links
- fixed: (EVM) Handle 'No internal transactions found' message from Blockscout servers
- removed: (Fantom) Removed ftmscan from network adaptor config

## 4.45.1 (2025-04-29)

- fixed: (TRX) Energy estimations based on contract storage state

## 4.45.0 (2025-04-28)

- added: Add Zano
- changed: Implement use of edge-change-server for network syncing.
- changed: Use XRPL as the network name.

## 4.44.0 (2025-04-02)

- added: (ZKSync) Add token detection contract
- changed: (EVM) Allow custom gas price to go below default minimum value if network base fee has dipped below the minimum value

## 4.43.1 (2025-04-02)

- changed: Upgrade chain-registry package.

## 4.43.0 (2025-04-01)

- added: Sonic Mainnet network support
- changed: (EVM) Allow minimum custom gas price to go below default if detected network gas price is lower
- fixed: (Tron) Fixed skipping first tx query for most tokens (leftover from testing)

## 4.42.3 (2025-03-28)

- fixed: (FIL) Fixed error handling of Filecoin RPC errors.
- fixed: (FIL) Replace Glif RPC node with Ankr due to recent API key pricing changes.
- fixed: (Polygon) Update Polygon gas station url

## 4.42.2 (2025-03-25)

- added: (ADA) Add `isSpendable` to `EdgeTransaction.otherParams`.
- changed: (Ripple) Rotate servers on unhandled errors
- changed: (Sui) Enforce the arbitrary max spend limit
- changed: (Tron) Add note support to transaction query
- fixed: (FIL) Use Filfox API for balance data
- fixed: (Solana) Fix SOL amount handling for DEX transactions
- fixed: (Ripple) Fix race condition when setting up api connection

## 4.42.1 (2025-03-17)

- fixed: Broken Zcash import path.

## 4.42.0 (2025-03-17)

- changed: Make Piratechain and Zcash optional.

## 4.41.0 (2025-03-14)

- changed: (FIO) Require apiToken for all calls to `buyAddressRequest`

## 4.40.0 (2025-03-11)

- changed: (FTM) Rename depegged Multichain Bridged USDC as 'USDC-M'

## 4.39.0 (2025-03-10)

- added: (ALGO) Throw if recipient did not activate the token being sent in `signTx`

## 4.38.0 (2025-03-03)

- added: RLUSD on Ethereum and Ripple networks
- added: SOLO on Ripple network
- changed: Optimize Solana transaction query

## 4.37.3 (2025-02-28)

- changed: (Abstract) Ignore internal transactions

## 4.37.2 (2025-02-24)

- fixed: Regression in FioEngine causing failed broadcasts.

## 4.37.1 (2025-02-17)

- fixed: (Solana) Allow sending to Program Derived Address

## 4.37.0 (2025-02-17)

- added: Added `abstract` EVM-based plugin
- fixed: (ETH) Added new USDS token contract and renamed "classic" to USDSC.

## 4.36.3 (2025-02-17)

- changed: If broadcasting fails, return an error with a better summary.

## 4.36.2 (2025-02-12)

- fixed: (Solana) Fix priority fee for undefined `networkFeeOption`

## 4.36.1 (2025-02-04)

- fixed: Correctly issue notifications for new incoming transactions.

## 4.35.4 (2025-02-04)

- fixed: Correctly issue notifications for new incoming transactions.

## 4.36.0 (2025-01-30)

- added: Add eip681 chainId detection
- fixed: Correctly handle token transaction fees in PolkadotEngine

## 4.35.3 (2025-01-28)

- changed: (Solana) Implement transaction broadcast retry logic
- changed: (Ton) Only use ton center for transaction query
- fixed: (Ton) Fix `isSend` when processing transactions

## 4.35.1 (2025-01-22)

- changed: (Solana) Replace fee, rent, and recentblockhash loops with cached queries where they are needed
- changed: (Solana) Only query transaction blocktime if it isn't already present
- fixed: (Solana) Fix checking token send amount against rent threshold
- fixed: (Solana) Fix recent txid stored for efficient tx query
- fixed: (Sui) Fix Map handling in `processTransaction`
- removed: (Solana) Remove blockheight loop

## 4.35.0 (2025-01-15)

- changed: Implement new Seen Tx Checkpoint API for all currencies.

## 4.34.0 (2025-01-14)

- changed: Upgrade edge-core-js to v2.23.0

## 4.33.0 (2025-01-13)

- added: Add SUI
- fixed: Ignore incorrect fees sent by the Midgard server, and instead just use 0.02 RUNE for Thorchain native transactions.
- fixed: Fix EVM Alchemy urls
- fixed: (FIO) OBT data encryption/decryption

## 4.32.4 (2024-12-25)

- fixed: Set correct Thorchain fee parameters when sending.

## 4.32.3 (2024-12-25)

- fixed: (Pulsechain) Fix broken address and transaction explorer links

## 4.32.2 (2024-12-23)

- fixed: (Tron) Fix incorrect TRX fee estimations

## 4.32.1 (2024-12-19)

- fixed: Use Helius archival nodes for Solana exclusively to fix transaction syncing issues.

## 4.31.4 (2024-12-19)

- fixed: Use Helius archival nodes for Solana exclusively to fix transaction syncing issues.

## 4.32.0 (2024-12-16)

- added: (XRP) Add mnemonic import support
- added: (XRP) Add destination tag to processed transactions
- changed: (XRP/XLM) Create mnemonics by default
- changed: (XRP) Check recipient trust lines before sending token
- fixed: `parseUri` case sensitivity when looking for matching builtin token contract addresses
- removed: Deprecate Binance Beacon Chain

## 4.31.3 (2024-12-11)

- fixed: Updated Algorand explorer to use Allo.
- fixed: (Zcash) Don't show negative values when attempting to max send small amounts

## 4.31.2 (2024-12-11)

- fixed: Use `corsBypass: 'always'` for Solana RPC nodes to fix issues with syncing transaction data.

## 4.31.1 (2024-12-06)

- fixed: Fixed broken balance query method in `aquireTokenBalance` causing stalled syncing.
- fixed: Fix WBNB denomination name

## 4.31.0 (2024-12-04)

- added: (Solana) Use stake-weighted RPC for broadcasting transactions
- changed: (Ripple) Set base reserve 1 XRP and token reserve to 0.2 XRP

## 4.30.0 (2024-12-03)

- added: (XLM) Support uri's containing `dt=` in `parseUri()`

## 4.29.0 (2024-12-02)

- added: Added `getAddresses` to ZCash engine.
- fixed: (ETH) Improved and re-enabled BlockbookWsAdapter integration

## 4.28.0 (2024-11-21)

- added: (LLD/LLM) Tx history support
- fixed: (FIO) Fix unstakefio amount saved to `stakedAmounts`

## 4.27.1 (2024-11-11)

- fixed: (EVM) Fix performance regression caused by thrashing on network queries.

## 4.27.0 (2024-10-31)

- added: Add Toncoin (TON)

## 4.26.3 (2024-10-30)

- fixed: (ADA) Improved balance calculation by deriving from UTXO state.
- fixed: (ADA) Race condition between network queries and local transaction processing causing incorrect UTXO state.

## 4.26.2 (2024-10-29)

- fixed: (ADA) Fixed a bug in Blockfrost response handling that caused an error when processing successful non-JSON responses.
- fixed: (ADA) Re-spending UTXO race condition.
- fixed: Possible to send polkadot currencies to `0x` addresses

## 4.26.1 (2024-10-14)

- changed: (Zcash/Piratechain) Await synchronizer initialization in public methods instead of throwing `synchronizer undefined`error
- fixed: (Zcash/Piratechain) Don't save sensitive initializer object to engine

## 4.26.0 (2024-10-03)

- changed: Add redundancy to Cardano queries
- changed: Increase `MAX_TRANSACTIONS` to 2500.
- changed: (Hedera) Updated transaction query loop to account for mirror node limitations
- fixed: Correctly implement address query lookback times based on network block times.
- fixed: (AVAX) Increased query lookback for transaction history to 5 minutes to fix missing transaction confirmations.
- fixed: (Hedera) Initial sync ratio inaccuracy

## 4.25.2 (2024-09-30)

- fixed: (ALGO) Process unactivatedTokenIds routine immediately after activating a token to tighten race conditions
- fixed: (XRP) Process unactivatedTokenIds routine immediately after activating a token to tighten race conditions

## 4.25.1 (2024-09-27)

- removed: (Piratechain) Removed `bumpSynchronizer` loop. Engine will now rely on critical errors reported from react-native-piratechain for synchronizer management.

## 4.25.0 (2024-09-25)

- changed: (Zcash) Replace `sendToAddress` with `createTransfer`
- changed: Upgrade react-native-zcash to v0.9.0

## 4.24.6 (2024-09-20)

- fixed: Update some MATIC special cases to POL

## 4.24.5 (2024-09-17)

- removed: Ethereum WebSocket server connections, which were preventing incoming transactions appearing.

## 4.24.4 (2024-09-16)

- changed: Upgrade chain-registry package.

## 4.24.3 (2024-09-16)

- fixed: (EVM) Fixed ETH requires a resync or log back in to see new transaction
- fixed: (FIO) Fix amount handling in parseActions

## 4.24.2 (2024-09-12)

- fixed: (EVM) Merge duplicate token transaction data from evmscan fixing incorrect transaction native amounts

## 4.24.1-2 (2024-09-17)

- removed: Ethereum WebSocket server connections, which were preventing incoming transactions appearing.

## 4.24.1-1 (2024-09-16)

- fixed: (EVM) Fixed ETH requires a resync or log back in to see new transaction
- fixed: (FIO) Fix amount handling in parseActions

## 4.24.1 (2024-09-10)

- fixed: (ADA) Correctly parse txid after broadcasting a transaction
- fixed: (ADA) Fixed metadata for staking transactions

## 4.24.0 (2024-09-05)

- added: (Ethereum/Solana) Support additional tokens provided by info server
- added: (Thorchain) Add Midgard API for transaction queries
- changed: (Thorchain) Move most Thorchain-specific functionality out of CosmosEngine and into to ThorchainEngine subclass
- fixed: (ADA) Update tx_info request to include inputs in order to fix all transactions show as receive bug

## 4.23.0 (2024-09-03)

- added: (ADA) `isStakeTx` to `EdgeTransaction.otherParams` for staking transaction signing
- added: (ADA) staking related methods to `EdgeCurrencyEngine.otherMethods`
- changed: (ADA) Include `accountKey` and `privateKey` in Cardano wallet's private key data as an optimization for new wallets going forward.
- fixed: (Solana) Properly validate custom token addresses

## 4.22.0 (2024-08-30)

- added: Public FIO fetch fns to return non-cached addresses and domains

## 4.21.0 (2024-08-29)

- added: POL token on Ethereum.
- added: (Zcash/Piratechain) Log errors thrown by synchronizer
- added: (Zcash/Piratechain) Restart engine after receiving critical error
- changed: Rename MATIC to POL on the Polygon chain.
- fixed: Display name COMBO (Ethereum) to Furucombo
- fixed: Calculate Arbitrum fees more correctly.

## 4.20.0 (2024-08-19)

- added: (Solana) Add new tokens: BSOL, DRIFT, HAWK, JITOSOL, JSOL, JTO, JUP, MIMO, MNGO, MSOL, SOL, USDC.e, WBTC, and WETH
- added: (EVM) Add dRPC nodes
- changed: Add evmscan fallback for `eth_getTransactionReceipt`in `getL1RollupFee`

## 4.19.0 (2024-08-12)

- changed: (FIO) Move OBT fetch into `otherMethodsPrivateKey.fetchObtData`

## 4.18.0 (2024-08-09)

- added: (zkSync) Add USDC
- added: (Cosmos) Add chain ID updater
- added: (Cosmos) Support multiple archive nodes
- fixed: (zkSync) Fix USDC.e currency code

## 4.17.1 (2024-07-30)

- fixed: (ETH) Fix incorrect protocol in blockbook-ws connection URLs

## 4.17.0 (2024-07-30)

- added: signBytes() method for EthereumEngine

## 4.16.0 (2024-07-29)

- added: (Solana) Add base58 private key import
- changed: (Solana) Enforce the network address minimum on SOL spends

## 4.15.2 (2024-07-26)

- fixed: Holesky testnet params

## 4.15.1 (2024-07-25)

- fixed: Fix case where FIO names wouldn't be updated

## 4.15.0 (2024-07-22)

- added: (Solana/Ethereum) Add optional `lightMode` support to disable transaction query
- added: Add optional `testPrivateKeys` function to `parseUriCommon`
- changed: (Zcash) Updated address explorer
- changed: (Tron) Special case the `usdt-trc20` uri prefix
- changed: Upgrade edge-core-js to v2.9.0
- fixed: Prevent fatal error reporting for missing txlist json file
- fixed: (Zcash) Use additional insufficient funds check before sending amount to synchronizer

## 4.14.0 (2024-07-19)

- added: Added Amoy Polygon testnet
- added: Added Sepolia and Holesky Ethereum testnet
- added: Added support for WebSocket connections to Blockbook servers via `BlockbookWsAdapter`
- remove: Remove deprecated Ethereum testnets: Goerli, Kovan, Rinkeby, and Ropsten.
- remove: Remove deprecated Mumbai Polygon testnet

## 4.13.0 (2024-07-16)

- changed: FIO SDK upgraded to v1.9.2
- changed: `getFioNames` call changed to separate `getFioAddresses` and `getFioDomains` calls

## 4.12.2 (2024-07-15)

- fixed: FIO payment wallet connection error, using a temporary workaround while FIO resolves the issue with their network

## 4.12.1 (2024-07-15)

- fixed: Fix incorrect QR code parsing for PIX addresses

## 4.12.0 (2024-07-09)

- added: Implemented common `updateInfoPayload` method for all plugins
- changed: (Ethereum) Include network fee info for core info payload

## 4.11.1 (2024-07-08)

changed: Upgrade @polkadot/api to v12.1.1

## 4.11.0 (2024-07-03)

- changed: Reduce and add variation to polling frequency

## 4.10.0 (2024-06-24)

- added: (Ethereum) Add Liberland Dollar and Merit tokens
- added: (Solana) Add unsignedTx passthrough to passthrough makeSpend
- fixed: (Pirate Chain) Pirate: Use fallback public key for cases where sdk isn't present

## 4.9.0 (2024-06-19)

- added: (Ethereum/Solana) Add BOBBY
- added: (zkSync) Add ZK
- changed: (Piratechain) Allow `derivePublicKey` to fail in case native code isn't present
- removed: (Zcash/Piratechain) Remove `defaultBirthdayHeight`

## 4.8.0 (2024-06-10)

- added: Add 'mumbai' plugin (MATIC testnet)

## 4.7.1 (2024-06-05)

- fixed: (Cosmos) Rework `queryTransactions` to query oldest to newest

## 4.7.0 (2024-06-05)

- added: Build On Bitcoin (BOB) EVM chain
- added: (Zcash/Piratechain) Cache addresses on local data
- added: (Ethereum Classic) Add evmscan provider for transaction history
- added: (Cosmos) WalletConnect ADR36 message support
- fixed: (Cosmos) cosmos_signAmino signer derivation

## 4.6.0 (2024-05-30)

- changed: (Solana) Upgrade SDKs
- removed: (ATOM) Archive transaction query
- removed: (Thorchain) Remove synth assets

## 4.5.3 (2024-05-28)

- added: Added two alternative evmscan servers to zkSync

## 4.5.2 (2024-05-23)

- fixed: (EVM) Stuck wallet syncing caused by error thrown from mismatching networkFee assertion in mergeEdgeTransactions

## 4.5.1 (2024-05-22)

- fixed: (Algorand) Fix ALGO balance lookup for token transactions

## 4.5.0 (2024-05-15)

- added: (EVM) Hardcode gas limit values for some tokens to be prioritized over eth_estimateGas result
- added: (Thorchain) Add synth assets
- added: Update node and server lists from info server payload provided by the core

## 4.4.0 (2024-05-14)

- added: `EdgeCurrencyInfo.customTokenTemplate` fields for all chains that support custom templates.
- added: Add bulk balance fetching and `onNewTokens` callback to Algorand, Cosmos, Solana, XRP, and Tron engines
- fixed: (Polkadot) Show unsuccessful transactions that were charged a fee

## 4.3.3 (2024-05-10)

- fixed: (DOT) Fix incorrect insufficient funds error for max spend of native DOT currency in Polkadot engine

## 4.3.2 (2024-05-09)

- changed: Update Zcash and Tezos nodes.

## 4.3.1 (2024-04-29)

- fixed: Merge internal transactions transfer amounts for EVM currencies

## 4.3.0 (2024-04-22)

- added: (Zcash) Orchard pool support
- added: (Zcash) ZIP-317 dynamic fee support
- added: (Hedera) Replace account purchase with auto account creation
- added: Ethereum default tokens AXS, COTI, and GMT
- added: Binance Smart Chain default token AAVE
- added: Polygon default token VOXEL
- added: zkSync default tokens DAI and USDT
- changed: Updated Liberland rpc list
- changed: Update Smartpay cleaners to match API changes

## 4.2.0 (2024-04-09)

- added: Expose the modern `customFeeTemplate` fields on the relevant currency infos.
- changed: Improve unit tests.
- fixed: Correctly report `InsufficientFundsError` in the Cardano engine.

## 4.1.1 (2024-03-26)

- fixed: (Filecoin FEVM) Incorrectly identifying all transactions as receives

## 4.1.0 (2024-03-25)

- changed: Mark failed transactions processed from EVM scan networks with 'failed' confirmation status

## 4.0.0 (2024-03-25)

- added: Add Cardano (ADA)
- added: Add Cardano PreProd Testnet
- changed: Upgrade edge-core-js to v2.2.1

## 3.3.0 (2024-03-25)

- changed: Upgrade edge-core-js to v1.14.0

## 3.2.8 (2024-03-22)

- fixed: Added initOptions to FilecoinEngine for GLIF API key to fix sync issues

## 3.2.7 (2024-03-21)

- changed: Use EIP-4844 fee calculation for Optimism and Base

## 3.2.6 (2024-03-20)

- changed: Update subscan transfers endpoint url
- fixed: Correctly use the ETH transaction hash as txid for FEVM transactions to fix duplicate transaction bug on Filecoin FEVM

## 3.2.5 (2024-03-11)

- fixed: Performance issue with getMaxSpendable caused by recursive calls
- fixed: (zkSync) fixed getMaxSpendable insufficient funds error caused by misusing gas estimation parameters

## 3.2.4 (2024-03-06)

- fixed: (zkSync) fixed gas limit estimation failures due to caching last estimations

## 3.2.3 (2024-03-06)

- added: Unique ss58 encoding for Polkadot currencies
- fixed: Missing FIO transactions due to missing 'trnsfiopubky' tx type

## 3.2.2 (2024-03-05)

- added: (Solana) Priority fee settings
- changed: Update Pokt network api urls

## 3.2.1 (2024-03-01)

- changed: Update Algorand explorer urls
- fixed: (PLS) fix transaction history date parsing from pulsechain-scan network adapter

## 3.2.0 (2024-02-27)

- added: Cosmos IBC transaction support
- added: (PLS) Integrate new v2 API for Pulsechain as a pulsechain-scan adapter
- changed: (Zcash/Piratechain) Enforce 24 word seed length for imports
- fixed: (PLS) update evmscan adapter servers for Pulsechain to fix transaction history queries
- fixed: Polluting fetchTx call params with NaN causing error responses

## 3.1.2-3 (2024-02-27)

- changed: (ETC) Update RPC urls

## 3.1.2-2 (2024-02-26)

- fixed: (OP) Include L1 rollup fee in balance check for `makeSpend`

## 3.1.2-1 (2024-02-23)

- added: (Tron) Add energy penalties to fee calculation
- added: Add more Arbitrum tokens

## 3.1.2 (2024-02-20)

- fixed: Cosmos token balance query

## 3.1.1 (2024-02-14)

- changed: (FIO) Use a backup balance method for accounts affected by unstake chain data issue

## 3.1.0 (2024-02-12)

- added: Arbitrum One network support
- added: Base network support
- added: (Coreum) Add tokens
- added: Bitstamp EUR Ripple token
- added: BSC Tokens BSC-USD,DOGE,BTCB,ETH,TUSD,DOT,WBNB,LINK, and MATIC
- removed: Unused `EthereumNetworkInfo` params

## 3.0.4 (2024-01-30)

- added: Cosmos Hub (ATOM) support
- added: Axelar (AXL) support
- changed: (Solana) Incorporate rent threshold into insufficient funds checks
- fixed: (Fantom) Include decimal values in fee rates from EVM scan to fix 'transaction underpriced' errors

## 3.0.3 (2024-01-29)

- added: (Solana) Versioned transaction parsing
- added: Add deprecated `memoType` to piratechainInfo for backwards compatibility
- added: (Thorchain) Overestimate network fee to ensure confirmation
- changed: (Cosmos) Ignore events with nonstandard hyphenated denoms

## 3.0.2 (2024-01-22)

- changed: (Thorchain) Use dynamic fees from thornode

## 3.0.1 (2024-01-14)

- added: (Cosmos) Add signMessage method
- added: (Cosmos) Add staked balance query
- fixed: (Tron) Stop saving zero fee EdgeTransactions

## 3.0.0 (2024-01-06)

- changed: Moved FIO staked balances from the balances object to stakingStatus

## 2.18.8 (2024-01-03)

- added: (Optimism) Add Tarot token
- removed: Remove arbitrary limit of 5 unconfirmed transactions for EVM currencies

## 2.18.7 (2023-12-29)

- fixed: ETC spend error regression caused by EIP-1559 upgrade in EthereumEngine

## 2.18.6 (2023-12-26)

- fixed: `makeSpend` regression for non-EIP-1559 transactions

## 2.18.5 (2023-12-21)

- fixed: Accelerate for EIP-1559 type transactions

## 2.18.4 (2023-12-20)

- added: (Optimism) Add native USDC
- changed: (Optimism) Rename wrapped USDC to USDC.e

## 2.18.3 (2023-12-20)

- added: `minerTip` to `feeRateUsed` for EIP-1559 transaction
- changed: Added back EIP1559 support to Fantom
- fixed: Fallback query for baseFee if not cached for EIP-1559 currencies
- fixed: Incorrect spelling for EIP-1559 parameter (maxPriorityFeePerGas)

## 2.18.2 (2023-12-18)

- fixed: Various regressions and bugs caused by recent refactors

## 2.18.1 (2023-12-18)

- added: (Solana) Add BONK

## 2.18.0 (2023-12-15)

- added: Token balance detection for FTM, AVAX, and OP networks

## 2.17.3 (2023-12-13)

- changed: Update Osmosis and Coreum RPC urls

## 2.17.2 (2023-12-11)

- fixed: Replace 2 gwei priority fee minimum non-negative minimum
- changed: Query and cache network base-fee for EIP1559 currencies

## 2.17.1 (2023-12-07)

- added: Network adapter to zkSync for transaction querying
- changed: (Coreum) Update currency code
- fixed: Gas estimation regression for spend routines that use eth_estimateGas RPC call
- fixed: (Tron) Fix unstake v2 native amount
- fixed: Over doing batch queries for token balances in Solana

## 2.17.0 (2023-12-04)

- added: (Solana) Add SPL token support
- added: (Osmosis) Add ION token
- added: (Cosmos-based) Add token spending
- added: Missing RUNE symbol
- added: Cosmos getMaxTx method

## 2.16.0 (2023-12-01)

- added: Coreum (COREUM)
- added: Osmosis (OSMO)
- added: Goerli tokens and Pokt RPC server
- added: Notify core of new detected token balances
- changed: Upgrade edge-core-js to 1.12.0
- changed: (Cosmos-based) Use gas limit estimation for fees
- changed: (Cosmos-based) Use both archive and validator nodes to optimize requests
- changed: (Cosmos-based) Replace `transfer` with `coin_received` and `coin_spent` events for transaction processing

## 2.15.0 (2023-11-30)

- added: EVM memo options for FEVM currencies
- added: WFIL and iFIL tokens to FEVM currencies
- fixed: Token balance query in RpcAdapter had missing 'pending' parameter
- fixed: Filecoin f4 address parsing

## 2.14.0 (2023-11-24)

- added: Add Pokt RPCs as option for Fantom and Polygon
- added: Avascan replaces snowtrace as an evmScan server and explorer for Avalanche

## 2.13.1 (2023-11-21)

- fixed: Incorrect deposit alias for Thorchain RUNE

## 2.13.0 (2023-11-20)

- added: Add `MakeTxDeposit` to support THORChain swap transactions
- added: ENS name resolution support
- changed: Move `makeTx` params types to common
- changed: (RUNE) Replace shapeshift api with native rpc tx query
- fixed: Possible error in ETH transactions when calculated gasPrice is below baseFee

## 2.12.0 (2023-11-14)

- added: Filecoin FEVM
- added: Filecoin FEVM Testnet (Calibration)
- added: Filecoin wallets can send to 0x addresses for FEVM interop
- fixed: Removed unsafeBroadcastTx configuration for Filecoin

## 2.11.2-tc2 (2023-11-21)

- fixed: Incorrect deposit alias for Thorchain RUNE

## 2.11.2-tc (2023-11-20)

- added: Add `MakeTxDeposit` to support THORChain swap transactions
- changed: Move `makeTx` params types to common
- changed: (RUNE) Replace shapeshift api with native rpc tx query
- fixed: Possible error in ETH transactions when calculated gasPrice is below baseFee

## 2.11.2 (2023-11-13)

- fixed: EVM balance sync failure if missing API key for one node type

## 2.11.1 (2023-11-10)

- fixed: Use transaction type 0 (legacy transactions) currencies which do no support EIP-1559

## 2.11.0 (2023-11-08)

- added: Add THORChain (RUNE)
- added: (Polygon) Add native USDC
- changed: (Piratechain) Restart the synchronizer during initial sync if it stops providing status updates
- changed: (Polygon) Update bridged USDC currency code to USDC.e

## 2.10.0 (2023-11-07)

- added: Add a `npm run cli` command for debugging and testing plugins from the command line.
- added: Batch balance query via smart contract

## 2.9.4 (2023-11-06)

- changed: Transactions for currencies which support EIP1559 will be sent with EIP1559 fee parameters
- fixed: Corrected token address for PYUSD on Ethereum to be the proxy contract

## 2.9.3 (2023-11-03)

- fixed: (Piratechain) alias format from base64 to base16

## 2.9.2 (2023-11-02)

- changed: (Piratechain) Use walletId as synchronizer alias

## 2.9.1 (2023-11-01)

- fixed: EdgeTxActionSwap direction parsing for XRP transactions

## 2.9.0 (2023-10-25)

- added: Parse XRP DEX orders into EdgeTxActions

## 2.8.2 (2023-10-25)

- fixed: Filecoin `getMaxSpendable` fee race conditions are resolved by caching the max-spend parameters.
- fixed: Filecoin resync bugs

## 2.8.1 (2023-10-24)

- fixed: Provide working type definitions for this library.

## 2.8.0 (2023-10-23)

- added: Filecoin Testnet (Calibration)
- changed: Improved Filecoin transaction syncing
- fixed: Missing Filecoin transactions caused by external messages for the account (e.g. FILForwarder)

## 2.7.2 (2023-10-20)

- added: Add deprecated `memoType` to zcashInfo for backwards compatibility
- fixed: Account for possible 0-date transaction listerner race-condition
- fixed: Filecoin returns a more stable spendable balance from `getMaxSpendable`
- fixed: More accurate Filecoin fee estimation for `makeSpend`

## 2.7.1 (2023-10-16)

- changed: Upgrade react-native-zcash to v0.6.2
- changed: Update address explorer url (Zcash)
- fixed: Set synchronizer to null in `killEngine` so it can be properly restarted (Zcash)

## 2.7.0 (2023-10-11)

- added: EdgeTxAction tagging to TRX freeze/unfreeze contract call transactions
- added: Support for importing XLM wallets via 12/24-word mnemonic seed phrase
- added: Add Zcash autoshield support
- changed: Use Zcash types directly from react-native-zcash

## 2.6.0 (2023-10-09)

- changed: Upgrade react-native-piratechain to v0.4.0

## 2.5.5 (2023-10-06)

- fixed: Switch Filecoin to a working block explorer (Filfox).

## 2.5.4 (2023-10-02)

- fixed: Max spend for XLM

## 2.5.3 (2023-09-27)

- added: Tron `WithdrawExpireUnfreeze` transaction support
- added: Add VELO v2 token

## 2.5.2 (2023-09-22)

- removed: Temporarily disable non-functionaly zcash memos, pending an updated SDK with correct fee math.

## 2.5.1 (2023-09-21)

- changed: Update Zcash address explorer
- fixed: Rename Tron memos to "note".

## 2.5.0 (2023-09-20)

- changed: Remove the maximum memo length on Tron
- changed: Upgrade react-native-zcash to v0.5.0
- changed: Update Zcash address explorer
- fixed: Use EdgeMemo for WalletConnect data payloads
- fixed: Do not crash if BigInt is not present
- fixed: Block Filecoin when BigInt is not present

## 2.4.1 (2023-09-14)

- changed: Update react-native-zcash to v0.4.2
- fixed: Fixed Zcash transaction memos array handling
- fixed: Add `0x` prefix to EVM data created outside the engine
- fixed: Roundup fee nativeAmount returned from L1 so it is an integer

## 2.4.0 (2023-09-13)

changed: Upgrade react-native-zcash to v0.4.1
changed: Split Zcash and Piratechain into their own engines and tools
changed: Update Pulsechain explorer URL
removed: Disabled all Piratechain synchronizer functionality. This is a temporary removal due to incompatibility between latest react-native-zcash and react-native-piratechain. Engine will still load but it only useful for retrieving private keys.

## 2.3.0 (2023-09-12)

- added: Support the latest core memo API's.

## 2.2.5 (2023-09-21)

- fixed: Do not crash if BigInt is not present.
- fixed: Block Filecoin when BigInt is not present.

## 2.2.4 (2023-09-08)

- fixed: Bug prevent Filecoin spend transactions from being saved in the wallet (by saveTx)
- fixed: Filecoin network fee query issue
- changed: Use Filfox exclusively for Filecoin transaction querying
- fixed: Incorrectly identifying send-to-self transactions as receives from the network
- added: USDT token to Avalanche
- added: PYUSD token to Ethereum

## 2.2.3 (2023-09-07)

- added: Integrate Filfox for Filecoin transaction scanning

## 2.2.2 (2023-09-06)

- changed: Revert usage of `queryMulti` in Polkadot engine balance query

## 2.2.1 (2023-09-04)

- changed: Use separate code path for calculating token max spendable (Polkadot)
- changed: Allow user to spend entire token balance (Polkadot)
- changed: Add early exit to transaction query (Polkadot)
- fixed: Use Filscan as the block explorer for Filecoin
- fixed: Used correct balance in when sending tokens (Polkadot)
- fixed: Update Liberland length fee cost

## 2.2.0 (2023-09-04)

- added: Add new ETH tokens ARB, BUSD, and PAXG
- added: Add new BSC token BUSD
- added: Add new RPC server, Pocket Network
- changed: Parameterize apikey replacement in node urls and remove url-specific apikey logic in engines
- fixed: Skip Liberland transaction history query if subscan url isn't present
- fixed: Correctly report transaction history query status for new empty Filecoin wallets

## 2.1.0 (2023-08-29)

- added: Add a Liberland plugin.
- added: Add a Filecoin plugin.
- fixed: Use the correct sign on Ripple transactions.

## 2.0.0 (2023-08-28)

- changed: Replace deprecated display key and token methods with modern ones.
- changed: Require edge-core-js v0.21.2 or higher.

## 1.5.2 (2023-08-24)

- fixed: Correctly parse more types of Ripple transactions, including DEX transactions.

## 1.5.1 (2023-08-23)

- changed: Removed blockscout API server from ETC info (disabling transaction list retrieval)

## 1.5.0 (2023-08-14)

- added: Support for XRP OfferCreate txs
- added: Fantom tokens listed on Axelarscan (AXLUSDC, AXLUSDT, AXLETH, AXLWBTC)

## 1.4.12 (2023-08-11)

- Fixed: Bug in FIO causing missing historical transactions (first page of transactions).
- Fixed: Improve FIO transaction history fetching from history nodes by using the nodes with the highest action sequence number.

## 1.4.11 (2023-07-30)

- fixed: Use `io.fetchCors` for all requests, instead of `io.fetch`.

## 1.4.10 (2023-07-27)

- fixed: Replace asMaybe and asOptional cleaner default objects with functions that return new objects in otherData cleaners

## 1.4.9 (2023-07-26)

- changed: Update XRP explorer url
- changed: Update checkpoints

## 1.4.8 (2023-07-21)

- Optimism: Replace deprecated rpc method `rollup_gasPrices` with `l1BaseFee` query
- EVM: Handle null gas parameter in WalletConnect requests
- Update checkpoints

## 1.4.7 (2023-07-18)

- FIO: Treat 403 status code as error
- Update checkpoints

## 1.4.6 (2023-07-14)

- Fixed: FIO transaction reliability issues resolved by adding more historical nodes

## 1.4.5 (2023-07-12)

- Update GALA token
- Remove EthGasStation test
- Update checkpoints

## 1.4.4 (2023-06-30)

- Fixed: Critical bug that is missing data field for native EVM transactions including a memo

## 1.4.3 (2023-06-27)

- Disable using TRX for PIX codes

## 1.4.2 (2023-06-21)

- Upgrade @polkadot/api to v10.9.1

## 1.4.1 (2023-06-21)

- Fixed: Fixed Ethereum broken max-spend for spend info with undefined nativeAmount

## 1.4.0 (2023-06-20)

- Added: Add PulseChain (PLS)

## 1.3.1 (2023-06-20)

- Fixed: Fix broken max-spend for zkSync

## 1.3.0 (2023-06-20)

- Deprecate WalletConnect v1
- EVM/ALGO: Add parseWalletConnectV2Payload to parse out amounts from WalletConnect v2 payloads
- ZEC: Update checkpoints

## 1.2.13 (2023-06-02)

- FIO: Fix unstake method insufficient funds checking

## 1.2.12 (2023-06-02)

- FIO: Change `getMaxSpendable` to use available balance
- Update ZEC/ARRR checkpoints

## 1.2.11 (2023-06-01)

- EVM: Re-enable token transaction acceleration
- FIO: Add `getMaxSpendable`
- TRX: Fix memo handling

## 1.2.10 (2023-05-30)

- Fixed: Added transaction processing for FIO name registration actions

## 1.2.9 (2023-05-23)

- FIO: Handle empty otherParams objects as null

## 1.2.8 (2023-05-23)

- Add Pepe token
- Update ZEC/ARRR checkpoints

## 1.2.7 (2023-05-17)

- Tron: Pass nativeAmount directly to TRC20 encoder
- Tron: Make fee optional in asTRC20TransactionInfo cleaner

## 1.2.6 (2023-05-16)

- EVM: Fix null gas price handling in txRpcParamsToSpendInfo
- Ripple: Fix api reconnect logic

## 1.2.5 (2023-05-10)

- Fixed: Find XLM memos in all three makeSpend API locations

## 1.2.4 (2023-05-09)

- ZEC/ARR: Add import private key birthdayHeight option handling
- FIO: Replace public key with recipient public key
- Rename files to the network name, not the currency code
- Use uppercase names for files that export classes and use loweracse names for files that export types and utilities

## 1.2.3 (2023-05-08)

- Fix: Precision bug in min gas price checks for EVM currencies
- Change: Lower zkSync minGasPrice to 0.01 gwei
- Removed non-checksum addresses for EVM-based currencies (legacyAddress)
- Fix: Added dynamic gas limit calculation for zkSync
- Add Tron Stake v2
- Algorand: Support signing multiple transactions in wallet connect request

## 1.2.2 (2023-05-01)

- FIO: Update node list

## 1.2.1 (2023-05-01)

- ZEC/ARRR: Prevent sending overlapping queries to synchronizer
- Fix accessing already deleted wallet connector
- ZEC/ARRR: Update checkpoints

## 1.2.0 (2023-04-24)

- Add WalletConnect v1 support to Algorand
- Update EVM WalletConnect call_request response to include nativeAmount and networkFee
- Break out WalletConnect types to common folder
- Update ZEC checkpoints

## 1.1.1 (2023-04-24)

- fixed: Parse URIs as Tron addresses first before PIX addresses to prevent incorrect parsing of Tron addresses as a PIX address

## 1.1.0 (2023-04-20)

- Added: ERC-55 checksum address returned by `getFreshAddress` for ethereum plugin

## 1.0.1 (2023-04-24)

- fixed: Parse URIs as Tron addresses first before PIX addresses to prevent incorrect parsing of Tron addresses as a PIX address

## 1.0.0 (2023-04-19)

- PIX: Support minimum amount
- ETH: Add ERC20 tokens (Amp, ApeCoin, Cronos Coin, EnjinCoin, Gala, Game Coin, Graph Token, Healthcare Administration Token, LoopringCoin V2, PlayDapp Token, Quant, SAND, SHIBA INU, Strike Token, SUKU, and Wrapped FIO)
- FIO: Fix new account balance object
- Audit and fix noisy unused address logging
- HBAR/EOS: Fix balance and tx query for new accounts
- Upgrade edge-core-js to v0.21.0
- Replace asMaybe and asOptional cleaner default objects with functions that return new objects
- Upgrade cleaners to v0.3.14

## 0.24.2 (2023-04-17)

- Add zkSync wallet type

## 0.24.1 (2023-04-13)

- EVM: Update node lists
- ZEC/ARRR: Update checkpoint files

## 0.24.0 (2023-04-10)

- Add Algorand (ALGO)
- OP: Add WETH and VELO tokens
- BNB Beacon Chain: Fix transaction date handling
- ARRR: Add `unsafeBroadcastTx` to info
- EVM: Query info server fees by pluginId
- EVM: Save network fees to engine rather than to disk

## 0.23.2 (2023-04-04)

- FIO: Fix syncNetwork private key handling
- FIO: Use promiseNy for balance checking
- FIO: Fix promiseNy error handling
- EVM: Update node lists
- ZEC/ARRR: Update checkpoint files

## 0.23.1 (2023-04-04)

- fixed: Crash in `createPrivateKey` for `EosTools`

## 0.23.0 (2023-03-28)

- Refactor FIO use makeSpend, signTx, and broadcastTx instead of ambiguous otherMethods
- changed: Remove `wcRequestResponse` and all WalletConnect signing methods
- added: Support for `signMessage` core API for Ethereum engines to be used for Wallet Connect integrations
- changed: Refactor all engines to only deal with private keys directly from privileged functions

## 0.22.21 (2023-03-21)

- Fix fallback value returned when recipient min balance check fails
- XRP: Add additional broadcast error code handling

## 0.22.20 (2023-03-20)

- EOS: Fix address parsing
- EOS: Replace address regex with greymass sdk regex

## 0.22.19 (2023-03-10)

- removed: Do not use `EdgeCurrencyInfo.defaultSettings` to store network info for most chains.
- changed: Upgrade EOS to have power-up support. This will make spending EOS work again.
- changed: Do not allow sending funds to XRP or Polkadot addresses if they would fail to meet activation the reserve requirement.

## 0.22.18 (2023-03-10)

- fixed: Lower Optimism minGasPrice

## 0.22.17 (2023-03-09)

- changed: Update HBAR explorer URL

## 0.22.16 (2023-03-08)

- added: Parse/quote Smartpay PIX QR codes for Tron/USDT

## 0.22.15 (2023-03-08)

- EVM: Add L1 gas price multiplier

## 0.22.14 (2023-03-02)

- EVM: Fix nativeAmount calculation when paying an L1 fee
- Add optional checkEnvironment method to OuterPlugin to allow a plugin to fail after loading and during initialization
- Update checkpoint files

## 0.22.13 (2023-02-23)

- EVM: Fix race condition of undefined balance for ETH-based currencies
- ARRR: Update checkpoint files

## 0.22.11-1 (2023-02-21)

- EVM: Fix hex to decimal conversion in eth_call

## 0.22.12 (2023-02-17)

- added: Add Optimism currency plugin.
- changed: Loosen restrictions on custom token currency codes.

## 0.22.11 (2023-02-17)

- fixed: Correctly report ETHW balances.

## 0.22.10 (2023-02-15)

- Fix: Include per token reserve in calculation of getMaxSpendable and makeSpend
- Add: Built in tokens for BSC, ETHW, and ETC to allow for custom tokens

## 0.22.9 (2023-02-14)

- Fix: Missing XRP token transactions

## 0.22.8 (2023-02-10)

- Improve `hexToDecimal` safety

## 0.22.7 (2023-02-07)

- Fix: BNB Beacon Chain missing setOtherData method causing login errors

## 0.22.6 (2023-02-07)

- TRX: Add bandwidth and energy staking support

## 0.22.5 (2023-02-06)

- Add XRP token support
- Add native `builtinTokens` support and deprecate `metaTokens`
- Use patch-package to fix @tronscan/client errors

## 0.22.4 (2023-02-01)

- TRX: Fix resource handling
- TRX: Fix fee calculation for low value transactions
- Update checkpoint files

## 0.22.3 (2023-01-30)

- fixed: Adjust build settings to provide better support for iPhone 12.
- fixed: Track EVM wallet connections at the EdgeCurrencyTools level, to prevent active connections from disappearing.

## 0.22.2 (2023-01-20)

- TRX: Add note support
- TRX: Update derivation path to industry standard
- EVM: Revert `getMaxSpendable` simplification changes in favor of recursion due to sliding standard fee scale
- HBAR: Update explorer urls
- DOT: Update @polkadot/api to v9.11.3
- DOT: Improve type safety and various code cleanups

## 0.22.1 (2023-01-17)

- XRP: Replace use of `autofill` with local transaction creation
- XRP: Replace currency settings with networkInfo
- XRP: Clean up code for type-safety
- XRP: Add broadcast failure handling
- Replace forked ethereumjs-wallet library
- Remove ethereumjs-util resolution
- Cleanup old and redundant dependency resolutions
- ARRR: Remove address explorer url

## 0.22.0 (2023-01-11)

- Convert library to React Native Module
  - This package will automatically install itself using React Native autolinking and no longer requires Webpack for integration
  - Plugins are broken out and can be loaded individually
  - Move checkpoint files to android folder
  - Stub away unwanted USB modules
- ZEC: Update checkpoints
- ARRR: Update checkpoints

## 0.21.2 (2023-01-10)

- EOS: Fix destructure error when attempting to spend
- EVM: Remove recursion from `getMaxSpendable`
- Replace remaining json-schema usage with cleaners
- DOT: Add hard limit of 1 to transaction query progress

## 0.21.1 (2022-12-27)

- Changed: Implement accelerate transaction feature using new core API

## 0.21.0 (2022-12-20)

- Add Piratechain (ARRR)
- ZEC: Add getBirthdayHeight plugin method
- Revamp checkpoint creation script to query treestate directly from lightwalletd nodes
- Upgrade react-native-zcash to v0.3.2

## 0.20.5 (2022-12-15)

- TRX: Make sure to check the total native asset cost in makeSpend
- FIO: Update server list

## 0.20.4 (2022-12-15)

- EVM: Only cache gas limit if retrieved from network
- EVM: Fail makeSpend for contract transactions if unable to estimate gas limit
- EVM: Rework gasLimit calculation to double any estimate for transaction that interacts with a contract

## 0.20.3 (2022-12-14)

- Update default Polygon BUSD address from Paxos (0xdab529f40e671a1d4bf91361c21bf9f0c9712ab7) to Binance (0x9c9e5fd8bbc25984b178fdce6117defa39d2db39)
- TRX: Fix missing timestamp on broadcasted transactions

## 0.20.2 (2022-12-07)

- ETH: Add new KNC token and rename old token to KNCV1

## 0.20.1 (2022-12-07)

- Fix Ethereum and builtin token handling
- Various code cleanups

## 0.20.0 (2022-12-02)

- Lay ground work for future dynamically imported currencies by breaking plugins into 'inner' and 'outer' portions
  - 'outer' plugins contain currency details, network info, and list to optional plugin methods
  - 'inner' plugins contain heavy lifting code to create wallets and interact with networks
- TRX: Fix walletType check in `derivePublicKey`
- Various code cleanups

## 0.19.0 (2022-12-01)

- Add Tron (TRX) with TRC20 token support
- Fix `getTokenId` logic error
- Fix balance checking in `makeSpendCheck`
- Rename Plugin to Tools
- Make URI helpers standalone
- Add type definitions for core globals and third-party modules
- Various code cleanups

## 0.18.10 (2022-11-21)

- AVAX: Add USDC token
- Extend makeSpend to support token amount metadata for smart-contract calls

## 0.18.9 (2022-11-15)

- Fix Travis builds
- Fix prepare scripts
- Make Polkadot types visible in Typescript
- Enable remaining ESLint rule

## 0.18.8 (2022-10-31)

- ZEC: Throw error when attempting to send before wallet is synced
- ZEC: Update checkpoints

## 0.18.7 (2022-10-19)

- EVM: Split up eth_getTransactionCount into separate evmscan and rpc methods

## 0.18.6 (2022-10-18)

- ETH: Add Origin (OGN)
- EVM: Add RPC balance query
- EVM: Return empty transaction arrays if evmscan server list is empty

## 0.18.5 (2022-10-14)

- CELO: Fix server url
- ZEC: Update checkpoints

## 0.18.4 (2022-10-03)

- BNB: Fix transaction amount and fee denomination
- ZEC: Update checkpoints

## 0.18.3 (2022-09-30)

- XLM: Add dynamic fee support
- EVM: Fix broken baseFee from accidental boolean coercion
- SOL: Update explorer URLs

## 0.18.2 (2022-09-27)

- BNB: Fix Beacon Chain transaction processing
- Fix parseUriCommon protocol parsing
- CELO: Update server list
- ZEC: update checkpoints

## 0.18.1 (2022-09-20)

- Fix broken biggystring import
- ZEC: update checkpoints

## 0.18.0 (2022-09-19)

- Convert project to Typescript
- Upgrade @polkadot/api to v9.3.3

## 0.17.7 (2022-09-07)

- ETH: Fix spending with empty memo field
- FTM: Add L3USD token
- Update ZEC checkpoints

## 0.17.6 (2022-09-06)

- Allow EVM data to be passed through memo field
- Rename engine.js:makeSpend to makeSpendCheck since it has a different return signature than the asset specific makeSpend
- Restore internal transaction support for etherscan providers. Remove transaction queries from blockbook providers since they don't support internal txs
- Fix broken ethEngine skipChecks

## 0.17.5 (2022-08-23)

- Implement new `skipChecks` and `pendingTxs` API from `EdgeSpendInfo` for ETH engines
- Allow specifying only gasPrice or gasLimit for custom fees

## 0.17.4 (2022-08-18)

- Remove useless broken dependencies usb and node-hid before building
- ZEC: update checkpoint script and checkpoint files
- FIO: Update server list

## 0.17.3 (2022-08-18)

- Fix blockbook query txs return object initialization
- Only record parent network fee on outgoing transactions
- ETH: Update blockbook server list
- XRP: Fix API disconnect
- ETH: Add NOW Token
- Remove unused values from transactions

## 0.17.2 (2022-07-29)

- DOT: Fix sent native amount
- DOT: Fix regression in new wallet syncing

## 0.17.1 (2022-07-28)

- DOT: Fix txCount in `queryTransactions`
- DOT: Reorder operations in `queryTransactions` to reduce callback usage, retry failed queries, and reduce logging

## 0.17.0 (2022-07-27)

- Add Polkadot (DOT)

## 0.16.4 (2022-07-13)

- FTM: Add new default tokens: AVAX, BNB, BTC, CRV, DAI, ETH, FUSD, LIF3, LINK, LSHARE, MIM, TREEB, ZOO
- ETH: Calculate and store feeRateUsed in transactions

## 0.16.3 (2022-07-04)

- ETH: Fix network fee calculation

## 0.16.2 (2022-06-30)

- Add: All AAVE token for kovan
- Change: Rename PAX token to USDP for ethereum

## 0.16.1 (2022-06-10)

- ETH: Break out testnets into their own plugins
- ZEC: Upgrade react-native-zcash to v0.2.2
- ETH: Remove internal transaction queries

## 0.16.0 (2022-05-19)

- Remove the enabledTokens from the cached data (walletLocalData) and filter unknown tokens out

## 0.15.11 (2022-05-14)

- Remove RPC node that returns false zero balances

## 0.15.10 (2022-05-12)

- Add `getTokenId` to ethereum and eos plugins
- Upgrade edge-core-js to v0.19.15
- Upgrade @binance-chain/javascript-sdk to v4.2.0
- Replaced eos `checkAddress` internal loop with regex
- Fix XRP `disconnect` method
- Fix tests
  - Fix plugin imports
  - Always initialize FIO sdk with a baseUrl
  - Fix FTM network fees test
  - Fix ftmInfo.js filename
  - Add timeout to getSupportedCurrencies test to prevent hanging

## 0.15.9 (2022-05-04)

- ETH: Round gas price values to ints before converting to hex

## 0.15.8 (2022-05-03)

- ETH: Fix initial local network fees assignment
- ETH: Merge info server fees response with local data instead of overwriting
- ETH: Prioritize the queried minGasLimit and minGasPrice over the default values

## 0.15.7 (2022-05-02)

- Fix assignment of network fees from info server
- Add logging of fees
- Add feeUpdateFrequency override and change FTM to 1 min
- Change preference of fee providers
- Do not overwrite baseFeeMultiplier coming from settings
- Fix hex number handling
- Update ZEC checkpoints

## 0.15.6 (2022-04-22)

- Add MAI token (miMATIC) to FTM (Fantom)

## 0.15.5 (2022-04-14)

- EOS/TLOS/WAX: Remove parent currency from metaTokens array

## 0.15.4 (2022-04-13)

- Add blockbook broadcast method
- Fix networkFees object initialization on resync
- Fix `checkTxsBlockbook` so it doesn't break on unused addresses
- Reduce some duplicate blockbook code
- Update ZEC checkpoints

## 0.15.3 (2022-04-08)

- Use a reliable FTM RPC-nodes

## 0.15.2 (2022-04-08)

- Fix Bug in EVM fees

## 0.15.1 (2022-03-08)

- Add backwards-compatible apikey helper function

## 0.15.0 (2022-03-08)

This is a breaking release that changes EthereumInitOptions variable names:

- Api keys for etherscan-like data sources are now called `evmScanApiKey` (was `bscscanApiKey`, `ftmscanApiKey`, etc.)
- Api keys for ethgasstation-like data sources are now called `gasStationApiKey` (was `ethGasStationApiKey`)

Other updates:

- Add etherscan fee sources across EVM chains
- FTM: Add new tokens WFTM, TSHARE, TOMB, TBOND, and xBOO
- FTM: Add additional rpc servers
- Update ZEC checkpoints
- Upgrade edge-core-js to v0.19.10
  - added: `EdgeCurrencyInfo.canReplaceByFee`

## 0.14.1 (2022-02-23)

- Update BNB chain display names
- Update ZEC checkpoints

## 0.14.0 (2022-02-18)

- Add Binance Smart Chain (BNB) support
- Add getSplittableTypes method to ethEngine

## 0.13.1 (2022-02-15)

- Add Celo support
- Use binary search in ethEngine's `getMaxSpendable` for main chain currency code

## 0.12.2 (2022-02-10)

- SOL: Use industry standard derivation path
- SOL: Prevent sending empty memo
- SOL: Update explorer links

## 0.12.1 (2022-02-10)

- FIO: Abstract unlockDate calculation into a `getUnlockDate` method

## 0.12.0 (2022-02-08)

- Add Solana (SOL)

## 0.11.11 (2022-02-02)

- ZEC: Fix send amount

## 0.11.10 (2022-02-01)

- FIO: Fix bugs with unlock dates
- FIO: Fix bug by removing zero-amount transactions for staking actions

## 0.11.9 (2022-01-28)

- FIO: Add edge-core-js staking API support
- Add ETH, FTM, MATIC and AVAX EVM-based tokens
- Initialize walletLocalData balance when enabling tokens

## 0.11.8 (2022-01-20)

- ZEC: Fix to enable max spend
- Miscellaneous cleanup: improvem logging, general refactoring and removal of dead code

## 0.11.7 (2022-01-14)

- ZEC: Prevent spending until engine is fully synced

## 0.11.6 (2022-01-11)

- Fix git URLs for dependencies

## 0.11.5 (2022-01-10)

- XRP: Migrate from ripple-lib to xrpl
- ZEC: Upgrade to react-native-zcash v0.2.0

## 0.11.4 (2022-01-07)

- Fixed WalletConnect Rarible bug

## 0.11.3 (2022-01-07)

- MATIC: Add 5 more RPC servers

## 0.11.2 (2022-01-06)

- ETH: Add eth_signTypedData_v4 support

## 0.11.1 (2022-01-06)

- FIO: Replace additional network call with bundle constant

## 0.11.0 (2022-01-06)

- Add Avalanche (AVAX)
- FIO: Add addBundledTransactions action

## 0.10.5 (2022-01-05)

- Support Wallet Connect across all ETH-like currencies
- Add support for RenBridge Gateway address URI

## 0.10.4 (2021-12-28)

- XRP: Set memoMaxLength to 10

## 0.10.3 (2021-12-27)

- MATIC: Fix fee calculation from polygongasstation
- MATIC: Fix default fees

## 0.10.2 (2021-12-22)

- Add support for multiple polygonscan api keys

## 0.10.1 (2021-12-21)

- Add memoMaxLength parameter to currencyInfos
- Upgrade edge-core-js to v0.18.13

## 0.10.0 (2021-12-21)

- Add Polygon
- Remove FIO name expiration
- Update ZEC checkpoints

## 0.9.3 (2021-12-10)

- ZEC: Update checkpoints

## 0.9.2 (2021-11-16)

- ZEC: Commit Zcash checkpoints to repo
- ETH: Remove AGLD

## 0.9.1 (2021-11-11)

- WalletConnect: Move connector map to global scope
- WalletConnect: Add disconnect listener
- ZEC: Fix getDisplayPublicSeed

## 0.9.0 (2021-11-09)

- Zcash: Add Zcash plugin for Android

## 0.8.3 (2021-11-08)

- WalletConnect: Fix fee strings

## 0.8.2 (2021-11-08)

- Wallet Connect Fix: Make sure that transaction methods have fee parameters
- Wallet Connect Fix: Record the connection timestamp to include in the callback payload

## 0.8.1 (2021-11-02)

- Add Wallet Connect
- ETH: Fix error handling in checkUpdateNetworkFees

## 0.8.0 (2021-10-11)

- Add Hedera

## 0.7.76 (2021-10-04)

- FIO: Always return Requests with the newest first
- FIO: Fix off-by-one error when using splice

## 0.7.75 (2021-10-02)

- FIO: Fix request query logic

## 0.7.74 (2021-09-27)

- FIO: Remove new otherLocalData cache and use existing walletLocalData cache

## 0.7.73 (2021-09-23)

- FIO: Add request fetching to engine loop and save data locally

## 0.7.72 (2021-09-17)

- Remove postinstall-postinstall dependency

## 0.7.71 (2021-08-24)

- FTM: Add apikey to ftmscan.com requests

## 0.7.70 (2021-08-20)

- Fix: Regression caused by EIP-681 parseUri implementation

## 0.7.69 (2021-08-18)

- Add: Improved support for EIP-681 URI parsing of payments and token transfers
- Fix: Unable to send transactions on ETC, FTM, and RSK networks

## 0.7.68 (2021-08-02)

- Add base fee multiplier ETH fee algorithm (EIP 1559)
- Add Ethereum testnet server URIs to support testnets for development
- Fix blockbook server URIs

## 0.7.67 (2021-07-20)

- Add x-address decode for xrp parse uri

## 0.7.66 (2021-07-20)

- Throw error if there is a checksum present and it fails verification + tests

## 0.7.65 (2021-07-06)

- ETH: Add checksum support

## 0.7.64 (2021-07-01)

- BNB: Add additional API servers

## 0.7.63 (2021-06-21)

- Add native fee amount to InsufficientFundsError
- FIO: Fixed timestamps in get_actions

## 0.7.62 (2021-06-08)

- FIO: Randomize apiUrl when sending a new request

## 0.7.61 (2021-06-03)

- FIO: Add ALREADY_REGISTERED error rype
- Prevent unnecessary fetch calls when amberdata server lists are empty
- Remove icon URLs

## 0.7.60 (2021-05-25)

- Fix a possible race condition where the last queried block height is saved but the actual transactions are not
- Always set this.walletLocalDataDirty = true if any transactions have changed
- ETH: Use the default token gas limit if getCode reveals the destination is a contract and estimateGas fails to return a gas value
- ETH: Allow ethgasstation safeLow estimate less than 1
- Update logging

## 0.7.59 (2021-05-25)

- XRP: Remove bogus length checks from the XRP key import
- FIO: Refactor SDK initialization so it's only started once per wallet

## 0.7.58 (2021-05-12)

- XRP: Change destination tag limit to 10 digits and less than UINT32

## 0.7.57 (2021-05-11)

- FTM: Add fUSDT support
- XRP: Pass default fee to preparePayment
- XRP: Remove unused 'type' field from transaction validation

## 0.7.56 (2021-05-07)

- Fix metadata issue for accelerated ETH txs (RBF tx)
- Add Fantom

## 0.7.55 (2021-05-03)

- Remove allowance transaction filtering from addTransaction

## 0.7.54 (2021-04-23)

- ETH: Add error reporting to tx lists and gas price query for future debugging
- FIO: Reduce logging verbosity
- BNB: Enable resync
- Upgrade edge-core-js to v0.17.31
  - Add additional log types `crash` and `breadcrumb`

## 0.7.53 (2021-04-19)

- FIO: Change some error logging levels from error to info to reduce log verbosity

## 0.7.52 (2021-04-12)

- ETH: Add UNI ERC20 token
- ETH: Add eth_call to token balance loop
- FIO: Logging cleanup
- FIO: Allow sending tokens without transactionJson or otherParams

## 0.7.51 (2021-04-01)

- XRP: Use default fee of (0.00001 XRP) if SDK is unable to query for recommended fee
- Update content URL

## 0.7.50 (2021-03-16)

- FIO: Refactor FIO action to be passed in otherParams of edgeSpendInfo

## 0.7.49 (2021-03-15)

- EOS: Add dfuse graphql API to search for transactions
- ETH: Add new Golem token GLM
- Add promiseNy util to verify API responses from multiple sources
- Add contract address checking to Blockbook

## 0.7.48 (2021-02-26)

- EOS: Add dfuse API to getKeyAccounts method
- ETH: Double gas limit estimates when sending ETH to a contract address

## 0.7.47 (2021-02-23)

- ETH: Fix RBF bug: Use correct currencyCode for tx lookup in ethEngine saveTx
- FIO: Added transfer address action

## 0.7.46 (2021-02-12)

- Fix variable typo

## 0.7.45 (2021-02-11)

- Add DeFi ERC20 tokens
- Update FIO server list
- Add additional logging

## 0.7.44 (2021-02-02)

- ETH: Bump max gas limit to 300000
- ETH: Add additional estimateGas params that cloudflare requires
- ETH: Put RPC error handling in multicastServers
- ETH: Throw error when custom fee isn't valid or doesn't reach network minimums

## 0.7.43 (2021-01-25)

- EOS: Fix get_key_accounts endpoint and enforce 12 character rule on new account names
- Adjust log levels
- Update to eslint-config-standard-kit to v0.15.1

## 0.7.42 (2021-01-02)

- Add WBTC
- Fix Aave token parameters

## 0.7.41 (2021-01-01)

- Capitalize Aave token codes

## 0.7.40 (2020-12-31)

- Add Aave ERC20 tokens
- FIO: Add additional domain transfer transaction

## 0.7.39 (2020-12-21)

- Double gas estimate when sending ETH to a contract to reduce chance of failure
- FIO logging cleanup

## 0.7.38 (2020-12-13)

- Update ANT contract address and rename original token ANTV1

## 0.7.37 (2020-12-09)

- EOS: Ignore bogus accounts getting returned by nodes

## 0.7.36 (2020-12-07)

- Remove eosrio from hyperion server list

## 0.7.35 (2020-12-04)

- FIO: Refactored multicast servers, add preparedTrx support, Removed non-SSL FIO servers
- Used fetchCors for Trezor blookbook server

## 0.7.34 (2020-11-23)

- Add Blockbook API support for Ethereum
- Disable Alethio API support
- Remove Supereth API support

## 0.7.33 (2020-11-18)

- Fix EOSIO metaToken send issues (contractAddress and denom)

## 0.7.32 (2020-11-16)

- WAX changes
  - Remove unnecessary logs and pass in token data to multiple routines
  - Enable adding token and fetching token balance for EOSIO chains
  - Merge in EOSIO token implementation
  - Fix erroneous WAX activation call and publicKey typo

## 0.7.31 (2020-11-11)

- WAX Integration
  - Update endpoint for finding EOSIO account by key
  - Initial WAX integration
  - Remove unnecessary comments and disable Greymass Fuel for Telos
  - Enable WAX activation process
  - Move WAX activation to eosEngine and attempt activation on engine start
  - Adjustment to EosFuel routine
  - Make singleApiActivation private for Wax
- FIO changes:
  - Check if domain is public
  - Check for transferred addresses/domains.
  - Transfer fio domain changes.
  - Removed FIO str from logs.
- RBF support for ETH, RSK, and ETH tokens

## 0.7.30 (2020-10-08)

- Add onAddressChanged callback to EOS to inform GUI of new account activation

## 0.7.29 (2020-10-04)

- Add postinstall script to npm package

## 0.7.28 (2020-10-04)

- Replace schema with cleaners for transaction history api calls
- Add cloudflare rpcServer
- Only calculate 'data' parameter if using default fees
- Fix TRANSACTION_STORE_FILE data initialization
- Fix hex number parsing
- Pass fetchCors function to amberdata api calls
- Remove unnecessary log
- Add postinstall script for node14 dependency compatibility (usb and node-hid)
- Update cleaners

## 0.7.27 (2020-10-01)

- Add FIO import private key support
- Fix TLOS block explorer link

## 0.7.25 (2020-09-18)

- Upgrade FIO SDK to v1.1.0
- Retry failed FIO tx broadcasts
- Update FIO explorer

## 0.7.24 (2020-09-16)

- Add Telos (TLOS)
- EOS fixes

## 0.7.23 (2020-09-16)

- FIO register domain
- FIO check pub address error handling

## 0.7.22 (2020-09-03)

- Added free FIO address link
- Updated FIO api urls to remove port

## 0.7.21 (2020-09-02)

- Update ETH gas price sanity check values

## 0.7.20 (2020-08-25)

- Add Synthetix ERC20 tokens (SNX, SBTC, and SUSD)
- Save FIO tx fee between makeSpend() requests to the same address to reduce network calls
- Pass parent currency code in error when there's insufficient parent currency to pay transaction fee
- Increase timeout on network-dependent block height test

## 0.7.19 (2020-08-20)

- Use eth_estimategas and eth_getcode to improve ETH and ERC20 token transaction fee estimation

## 0.7.18 (2020-08-12)

- Disable asyncWaterfall for some FIO operations
- Save numTransactions in localWalletData
- Add cleaners to Etherscan get tx api responses

## 0.7.17 (2020-08-04)

- FIO checkTransactions algorithm update to page transactions
- Fix REPv2 token address

## 0.7.16 (2020-07-29)

- Add REPV2 ERC20 token

## 0.7.15 (2020-07-23)

- Add new Tezos API
- FIO - fix multicastServers

## 0.7.14 (2020-07-12)

- FIO fix domain reg url

## 0.7.13 (2020-07-10)

- Add get domains method to FIO plugin
- FIO fallback ref mode
- Add fee strings to ethEngine makeSpend() return value

## 0.7.12 (2020-07-05)

- Add Compound ERC20 token (COMP)

## 0.7.11 (2020-06-25)

- Update FIO apiUrls

## 0.7.10 (2020-06-23)

- Categorize servers by rpc and etherscan

## 0.7.9 (2020-06-05)

- Fix case where a FIO address could appear associated with two FIO wallets

## 0.7.8 (2020-06-04)

- Add etherclusterApiServers[] to rskInfo.js
- Add custom FIO domain support
- Add FIO address renewal support

## 0.7.6 (2020-05-21)

- Tezos - Add makeMutex to wrap makeSpend() to avoid entering it more than once

## 0.7.5 (2020-05-14)

- Refactor EOS plugin to remove owner key to support importing wallets
- Add Ethereum Classic support
- Remove own receive address from Tezos makeSpend

## 0.7.4 (2020-04-28)

- Refactor ETH and RSK to use common code
- FIO performance improvements

## 0.7.3 (2020-04-22)

- isAccountAvailable() renamed to doesAccountExist()

## 0.7.2 (2020-04-17)

- Add cleaners v0.2.0 type checking
- Fix duplicate FIO address after registration
- Reprioritize EOS Hyperion nodes to resolve transaction history view issue

## 0.7.1 (2020-04-07)

- Add TPID to FIO requests
- Fix Max Sends
- Updated fioInfo.js to mainnet

## 0.7.0 (2020-04-06)

- Add FIO

## 0.6.10 (2020-04-06)

- Import EOS private key
- Fix XLM transaction history not showing

## 0.6.9 (2020-03-23)

- Remove FIO codebase, accidentally included in v0.6.8.

## 0.6.8 (2020-03-20)

- Add MET token

## 0.6.7 (2020-03-06)

- Add response error checking to fetch() calls
- Fixed crash when Etherscan API returned text rather than a number by adding decimal and hex regex to response validation

## 0.6.6 (2020-02-13)

- EOS - Revert fetch update to fix syncing

## 0.6.5 (2020-02-06)

- EOS - Add Greymass Fuel

## 0.6.4 (2020-01-22)

- Add ETH internal transaction support

## 0.6.3 (2020-01-06)

- Add ETHBNT

## 0.6.2 (2020-01-01)

- Upgrade to edge-core-js v0.16.17
- Upgrade devDependencies

## 0.6.1 (2019-12-31)

- Fix missing parent currency code from enabledTokens

## 0.6.0 (2019-12-18)

- Add Amberdata support
- RBTC fixes
- Add 'xrp-ledger:' prefix support

## 0.5.9 (2019-12-06)

- Fix nonce query to save nonce as string.
- Add try/catch to checkAndUpdate
- Ensure ETH is checked for balance and txs

## 0.5.8 (2019-12-05)

- Update Tezos explorer and RPC nodes
- Optimize multiple API support for ETH

## 0.5.7 (2019-12-03)

- Add CDAI
- Add Alethio API

## 0.5.6 (2019-11-25)

- Add Blockchair API
- Add support for eth_estimateGas

## 0.5.5 (2019-11-20)

- Refactor ETH for API flexibility (no functional change)

## 0.5.4 (2019-11-07)

- Accept multiple etherscan API keys.

## 0.5.3 (2019-11-04)

- Update usage of EOS API endpoints

## 0.5.2 (2019-10-30)

- Fix Tezos Babylon compatibility.

## 0.5.1 (2019-10-28)

- Update HERC contract address.

## 0.5.0 (2019-10-22)

- Include compound tokens info

## 0.4.9 (2019-10-14)

- Connect to multiple EOS Hyperion nodes (with fallback).

## 0.4.8 (2019-10-11)

- Replace ripplecharts with bithomp.
- Directly connect to EOS producers (with fallback).

## 0.4.7 (2019-10-01)

- Remove BlockScout due to delayed / cached results

## 0.4.5 (2019-09-20)

- Fix XTZ seed issue (`mnemonicToSeedSync` to `mnemonicToSeedSync`)

## 0.4.4 (2019-09-19)

- Allow XTZ mnemonic import
- Adjustments to dependencies

## 0.4.3 (2019-09-13)

- Display mnemonic seeds for RSK when available.

## 0.4.2 (2019-09-13)

- Upgrade Ripple network libraries
- Add Chainlink token
- Fix RSK key management

## 0.4.1 (2019-09-05)

- Fix BNB balance stuck loading on new accounts
- Remove BNB as possible ERC20 token
- Removed `signedTx` data from BNB transactions

## 0.4.0 (2019-09-04)

- Implementation of Binance Chain (BNB)

## 0.3.8 (2019-09-04)

- Remove cached RPC node from being used for XTZ getBalance

## 0.3.7

- Remove unnecessary code for ETH errors

## 0.3.6 (2019-08-29)

- Skip one XTZ node for `getHead` loop to fix engine block height

## 0.3.5

- Add AGLD to list of known tokens

## 0.3.4 (2019-08-22)

- Validate Ethereum addresses prior to sending.

## 0.3.3 (2019-08-22)

- Add support for RSK & Tezos mnemonic keys.
- Fix Tezos URI generation.
- Add basic FIO key generation shims.

## 0.3.2 (2019-08-11)

- Change Tezos signedTx property from string to hex
- Change Tezos currency symbol to 't' due to font issue with official symbol

## 0.3.1 (2019-08-08)

- Set default `signedTx` property on EdgeTransactions to empty string

## 0.3.0 (2019-08-06)

- Integration of RSK / RBTC
- Integration of Tezos

## 0.2.0 (2019-08-01)

- Allow importing of XLM and XRP private keys

## 0.1.19 (2019-07-31)

- Implement ignoring of zero-amount transactions (ie proxy allowance)

## 0.1.18 (2019-07-12)

- Fix `edgeTransaction.otherParams.data` issue throwing error when `otherParams` does not exist

## 0.1.17 (2019-07-12) _Deprecated_

## 0.1.16 (2019-07-10)

- Implement Totle transactions (extra proxy allowance transaction)

## 0.1.15 (2019-07-03)

- Fix EOS infinite loop issue

## 0.1.14 (2019-07-02)

- Fix Outgoing EOS transaction issue

## 0.1.13 (2019-06-27)

- Fix EOS syncing issue
- Fix node 12 compatibility

## 0.1.12 (2019-06-10)

- Fix BRZ token multiplier / denomination / decimals

## 0.1.11 (2019-06-09)

- Add BRZ as a native ERC20 token

## 0.1.10 (2019-05-16)

- Fix importing Ethereum private keys starting with 0x.
- Allow multiple unconfirmed Ethereum spends at once.

## 0.1.9

- Fix toke denomination issue for encodeUri and parseUri
- Increase unit test timeout

## 0.1.8 (2019-03-27)

- Update Ripple block explorer link.
- Add ability to import Ethereum private keys.
- Add ability to detect dropped Ethereum transactions.

## 0.1.7 (2019-03-07)

- Get Ethereum to catch insufficient _token_ balance transactions

## 0.1.5 (2019-03-06)

- Convert Infura eth_getBalance to decimal string.

## 0.1.4 (2019-03-04)

- Fix GUSD denominations.
- Improve Ethereum token syncing using multiple servers.

## 0.1.3 (2019-02-26)

- Fix GUSD and TUSD contract addresses

## 0.1.2 (2019-02-25)

- Fix incorrect Ethereum private key parsing.
- Add popular ERC-20 tokens

## 0.1.1 (2019-02-22)

- Fix CORS issues during EOS activation on react-native.

## 0.1.0 (2019-02-19)

- Upgrade to the edge-core-js v0.15.0 and adapt to breaking changes.

## 0.0.25 (2019-02-19)

- Fix the node entry point not to crash

## 0.0.24 (2019-02-18)

- Fix a crash on boot on React Native

## 0.0.23 (2019-02-15)

- Upgrade to the edge-core-js v0.14.0 types
- Modernize the build system

## 0.0.22

- Fix ETH blockHeight from fluttering in/out of confirmation
- Fix XLM makeSpend if called multiple times and older edgeTransaction is used for signTx

## 0.0.21

- Properly call onTransactionsChanged on new txs

## 0.0.20

- Fix EOS accounts from being detected after activation
- Fix display of ETH private seeds

## 0.0.19

- Fix XRP incorrect spend amounts
- Fix syncing of ETH wallets after network disconnect/reconnect
- Improve syncing of XRP wallets by connecting to multiple servers
- Improve syncing of XRP wallets by detecting connection failure and retrying

## 0.0.18

- Change ETH fee estimates for better confirmation times
- Change broadcastTx to broadcast to all APIs at the same time
- Add Infura to broadcast APIs

## 0.0.17 (2019-02-01)

- Add EOS support
- Add Ethereum support
- Retry failed XRP broadcasts

## 0.0.16

- Publish with a cleaned lib/ directory. Identical code to 0.0.15

## 0.0.15

- Use new colored icons

## 0.0.13

- Fix saving read back of lastAddressQueryHeight to prevent always querying from block 0

## 0.0.12

- Do not load transactions until core asks for getTransactions or we have to save a new tx to disk

## 0.0.11

- Fix incorrect error thrown from makeSpend due to insufficient funds

## 0.0.10

- Fix parseUri for unique identifiers of XLM and XRP

## 0.0.9-beta.2

- Full spend/receive functionality for Ripple/XRP refactored from edge-currency-ripple
- Full spend/receive functionality for Stellar with memo.id support
- EOS support for send/receive
- EOS support for showing outgoing transactions only
- EOS missing ability to activate account
