# edge-react-gui

## 2.12.0 (2022-02-23)

- Add BNB Smart Chain support
- Add CELO support with CUSD and CEUR tokens
- Add new swap partner Exolix
- Add support for splitting between EVM-compatible chains
- Show available unlocked balance in flip input
- Add additional warning before display wallet private keys
- Fix incorrect spend race condition
- Add imported wallet flag to log output
- Convert special currency info map keys from currency code to pluginId
- Fix fee display in flip input
- Import biggystring functions individually
- Upgrade edge-core-js to v0.19.10
  - fixed: Stop adding undefined entries to EdgeAccount.currencyWallets.
  - added: Define a new EdgeToken type and make that available as EdgeCurrencyConfig.builtinTokens and EdgeCurrencyConfig.customTokens.
  - added: Define a new EdgeCurrencyPlugin.getBuiltinTokens method, and use that to populate EdgeCurrencyConfig.builtinTokens when available.
  - added: Pass EdgeToken fields to EdgeCurrencyEngine.addCustomToken, along with the existing EdgeMetaToken fields.
  - added: EdgeCurrencyInfo.canReplaceByFee.
  - deprecated: EdgeCurrencyInfo.defaultSettings
  - deprecated: EdgeCurrencyInfo.metaTokens
  - deprecated: EdgeCurrencyInfo.symbolImage
  - deprecated: EdgeCurrencyInfo.symbolImageDarkMono
  - added: Include an imported flag with all new wallet keys, to indicate whether they were derived freshly or imported from user-entered data.
  - fixed: Do not hang forever if creating a currency engine fails.
  - changed: Make denominationToNative and nativeToDenomination only look at the currencies available on the current wallet.
  - changed: Add comments and improve organization in the public types file.
  - changed: Use cleaners to load & save many files for additional safety.
  - fixed: Improve wallet start-up performance by loading fewer files.
- Upgrade edge-currency-accountbased to v0.14.1
  - Add Binance Smart Chain (BNB) support
  - Add Celo support
  - Add getSplittableTypes method to ethEngine
  - Use binary search in ethEngine's getMaxSpendable for main chain currency code
  - Update ZEC checkpoints
- Upgrade edge-exchange-plugins to v0.12.14
  - Add Binance Smart Chain to swap partners
  - Changelly: Add BNB Smart Chain support
  - Changenow: Fix corner case where standard flow was skipped
  - Exolix: Update plugin to use mainchain:tokencode values in requests
  - Coingecko: Add Celo and Aave unique IDs
  - Godex: Disable DGB selling
  - Transfer: Use pluginIds instead of currency codes
  - Fix calling denomination methods from wrong wallet
  - Use pluginIds instead of currency code keys in transcription and invalid-code maps
  - Add helper function and transcription maps for changing mainnet codes

## 2.11.1 (2022-02-15)

- Fix activation-needed wallet creation flow
- Fix wallet picker token issue
- Fix transaction details fiat amount for custom tokens
- Fix BOO exchange rate

## 2.11.0 (2022-02-14)

- Add Solana (SOL) support
- Add error localization
- Fix staking end date display
- Fix Bitpay error for unsupported currencies
- Fix React Native Promise type-checking
- Log error stack traces in development mode
- Upgrade edge-core-js to v0.19.5
  - changed: Send the optional keyOptions parameter through the importKey methods.
  - fixed: Remove JCenter from the Android build file.
- Upgrade edge-currency-accountbased to v0.12.2
  - Add Solana (SOL)
  - FIO: Abstract unlockDate calculation into a getUnlockDate method
  - SOL: Use industry standard derivation path
  - SOL: Prevent sending empty memo
  - SOL: Update explorer links

## 2.10.0 (2022-02-03)

- FIO: Add staking support
- Add many new AVAX, MATIC, and FTM tokens
- Transak: Reenable India support
- Add support for Bitpay JSON Payment Protocol v2
- Fix max send for tokens
- Disable activation-needed currencies from being created in Exchange scene
- Fix Advanced transaction details device description
- Fix race conditions in ManageTokensScene and Create wallet flow
- Organize currency settings by pluginId
- Consolidate denomination selectors
- Allow archiving of broken wallets
- Various visual fixes
- Upgrade edge-core-js v0.19.4
  - added: EdgeCurrencyWallet.stakingStatus, along with matching engine methods for returning and updating this.
  - fixed: Removed unnecessary C++ compiler flags.
  - fix: Correctly select swaps with the best price.
  - fix: Correctly prefer swap plugins with active promo codes.
  - changed: Add more logging to the swap procedure.
  - fix: Only write the deviceDescription on sent transactions.
  - fix: Add a native requiresMainQueueSetup method to silence a warning on iOS
- Upgrade edge-currency-accountbased to v0.11.11
  - FIO: Add edge-core-js staking API support
  - FIO: Fix bugs with unlock dates
  - FIO: Fix bug by removing zero-amount transactions for staking actions
  - Add ETH, FTM, MATIC and AVAX EVM-based tokens
  - Initialize walletLocalData balance when enabling tokens
  - ZEC: Enable max spend
  - ZEC: Update checkpoints
  - Miscellaneous cleanups: improve logging, general refactoring and removal of dead code
- Upgrade edge-exchange-plugins to v0.12.8
  - Coingecko: Add new tokens
  - Coingecko: Fix BNT unique ID
  - Add constant rates for AVAX wrapped tokens

## 2.9.0 (2022-01-14)

- Add Avalanche (AVAX) C-Chain support
- iOS: Add Zcash support
- iOS: Require iOS 12 or newer
- Redesign flip input modal
- XRP: Update reserve balance requirement to 10 XRP
- FIO: Requests from connected wallets now default from associated FIO name
- Fix FIO bundle purchase modal logic
- Remove receiving wallet balance check in Exchange scene
- Android: Replace jcenter with mavenCentral
- Various visual fixes and improvements
- Update translations
- Fix git URLs for dependencies
- Upgrade react-native-mail to v6.1.1
- Upgrade edge-core-js to v0.19.1
  - changed: Simplify the React Native integration to "just work".
    - Stop depending on external libraries such as react-native-fast-crypto, react-native-randombytes, or react-native-webview.
    - Use React Native auto-linking to integrate all native code, HTML, and Javascript needed to run the core.
    - Accept core plugins via a pluginUris prop to MakeEdgeContext or MakeFakeEdgeWorld.
    - Allow core debugging by running yarn start in this repo to start a dev server, and then setting the debug prop to true.
    - Accept an allowDebugging prop on Android to enable WebView debugging in general (useful for debugging plugins).
  - changed: Require EdgeCurrencyEngine methods to return promises.
  - changed: Mark methods as readonly in the TypeScript definitions, to match what Flow was already doing.
  - changed: Write files atomically on Android, so out-of-disk and other errors do not lead to data corruption.
  - fixed: Upgrade edge-sync-client, so info server errors are no longer fatal.
  - fixed: Do not destroy the core WebView when opening Safari links on iOS.
  - fixed: Allow logins with an appId to approve or reject vouchers.
  - added: Allow maximum swaps by passing "max" to EdgeSwapRequest.quoteFor.
  - added: Add an EdgeCurrencyEngine.getMaxSpendable method for native max-spend calculations.
- Upgrade edge-currency-accountbased to v0.11.7
  - ZEC: Upgrade to react-native-zcash v0.2.0
  - XRP: Migrate from ripple-lib to xrpl
  - ZEC: Prevent spending until engine is fully synced
  - Fix git URLs for dependencies
- Upgrade edge-currency-bitcoin to v4.9.20
  - Support mixed case Bridge Address prefix
- Upgrade edge-currency-monero to v0.3.4
  - Update dependencies to use 'https://' instead of 'git://'
- Upgrade edge-exchange-plugins to v0.12.7
  - ChangeNow: Upgrade to v2 API
  - Godex: Restrict AVAX trading to the AVAXC network
  - Godex: Re-enable FTM trading
  - Prevent AVAX token trading on partners without mainnet identification
  - Coingecko: Add AVAX
- Upgrade edge-login-ui-rn to v0.9.29
  - Update dependencies to use 'https://' instead of 'git://'

## 2.8.1 (2022-01-07)

- MATIC: Fix syncing issue
- Add a WalletConnect deep link type
- Various Wallet Connect Fixes
- Fix Android deep link handling
- Add support for Ren Bridge Gateway URI
- FIO: Add option to add Bundled Transactions
- Upgrade edge-currency-accountbased to v0.11.2
  - Fixed WalletConnect Rarible bug
  - MATIC: Add 5 more RPC servers
  - ETH: Add eth_signTypedData_v4 support
  - FIO: Replace additional network call with bundle constant
  - Add Avalanche (AVAX)
  - FIO: Add addBundledTransactions action
  - Support Wallet Connect across all ETH-like currencies
  - Add support for RenBridge Gateway address URI
- Upgrade edge-currency-bitcoin to v4.9.19
  - Add support for RenBridge Gateway address URI

## 2.8.0 (2021-12-21)

- Add Polygon (MATIC)
- FIO: Remove name expiration details
- Enforce memo field length limits from currency plugins
- Add terms agreement modal
- Add prompt to enable camera permission on scan modal
- Various visual fixes
- Update translations
- Upgrade edge-core-js to v0.18.13
  - added: EdgeSpendTarget.memo, which is a renamed version of EdgeSpendTarget.uniqueIdentifier.
  - added: EdgeCurrencyInfo.memoType, EdgeCurrencyInfo.memoMaxLength, EdgeCurrencyInfo.memoMaxValue. Use these to learn which currencies support memos.
  - added: EdgeCurrencyTools.validateMemo & EdgeCurrencyWallet.validateMemo. Use these to check memos for validity before sending.
  - deprecated: EdgeSpendTarget.uniqueIdentifier. Use EdgeSpendTarget.memo instead.
  - fixed: Gracefully handle errors while reading the exchange-rate hint cache.
  - fixed: Correctly match server-returned children with their on-disk stash entries. This produces more accurate errors if the server loses a child.
- Upgrade edge-currency-accountbased to v0.10.4
  - Add Polygon
  - Add memoMaxLength parameter to currencyInfos
  - Add support for multiple polygonscan api keys
  - Remove FIO name expiration
  - ZEC: Update checkpoints
- Upgrade edge-exchange-plugins to v0.12.4
  - Add ability to restrict all token codes per mainchain
  - Prevent MATIC ERC20 trading

## 2.7.0 (2021-12-10)

- Banxa: Add credit card and Interac payment methods in Canada
- Simplex: Add USDT support
- New themed side menu
- Replace legacy scan scenes with themed scan modal
- Safello: Fix Bankid and Swish app deeplinks
- Fix navigation after paying FIO request
- Don't allow keysOnlyMode currencies to be created in wallet picker
- Add error message when scanning invalid login QR code
- Add fullscreen mode for buttons modal
- Various text and visual improvements
- Update translations
- Upgrade edge-exchange-plugins to v0.12.0
  - Remove Totle
  - Changelly: Disable estimated swaps
  - Use the correct "to" currency code for the Sideshift's tx metadata
  - Add Exolix plugin (not yet enabled in the app)
- Upgrade edge-login-ui-rn to v0.9.28
  - Fix header spacing
  - Various minor fixes for account creation process
- Upgrade edge-currency-accountbased to v0.9.3
  - Update ZEC checkpoints

## 2.6.1 (2021-11-24)

- Force Android to create a compressed APK to reduce app size
- Fix ZEC Trasaction Exchange details

## 2.6.0 (2021-11-21)

- Add Zcash (Android only)
- Moonpay: Enable recurring purchases
- Create component ListModal to replace contacts and country list modals
- Various visual fixes
- Update translations
- Remove AGLD token
- Upgrade edge-currency-accountbased to v0.9.2
  - Add Zcash
  - ZEC: Commit Zcash checkpoints to repo
  - ETH: Remove AGLD
- Upgrade edge-exchange-plugins to v0.11.38
  - Prevent ZEC purchases from partners who don't support sending to shielded addresses
- Upgrade edge-login-ui-rn to v0.9.23
  - Various visual fixes for account creation process
  - Upgrade sha3 to v2.1.4
  - Upgrade react-native-patina to v0.1.6

## 2.5.1 (2021-11-10)

- Fix missing metadata on accelerated transactions
- WalletConnect: Fix select wallet tile spacing
- WalletConnect: Fix connection list showing unapproved connections
- Android: Fix crashing on older devices

## 2.5.0 (2021-11-07)

- Add WalletConnect
- Fix ETH transaction fee calculation
- Fix date and time display on 2FA scenes
- Fix insufficient funds error showing after a swap
- Refactor Create Account scenes to use common components and visuals
- Fix spinner visuals in settings scene
- Save changes to transaction metadata immediately
- Remove cliff background gif
- Banxa URL update
- Various font and border weight consistency fixes
- Remove lodash
- Upgrade edge-core-js to v0.18.11
  - added: Implement TypeScript utilities in Flow
  - added: Wallet Connect types and onWcNewContractCall callback
  - updated: Ethereum, Bitcoin, and Bitcoin xpub documentation
  - fixed: Type-safety and null checks
- Upgrade edge-currency-accountbased to v0.8.2
  - Add Wallet Connect
  - ETH: Fix error handling in checkUpdateNetworkFees
- Upgrade edge-login-ui-rn to v0.9.22
  - rn: Refactor Create Cccount scenes to use common components
  - rn: Update Create Account scene headers
  - rn: Dismiss keyboard when showing the QR modal
  - rn: Standardize button text to regular with thinner borders

## 2.4.0 (2021-10-22)

- New themed change mining fee scene
- Add support for new UD domains (.coin, .wallet, .bitcoin, .x, .888, .nft, .dao, and .blockchain)
- Fix inability to cancel security alert modal
- Upgrade react-native-share to v7.1.12 to fix iOS crash
- Pass Quicksand font to login UI
- Use react-native-fast-image for remote assets
- Simplify advanced tx details props
- Bits of Gold: Removed GB support (temporary)
- Update partner descriptions
- Various visual fixes

## 2.3.1 (2021-10-12)

- Fix uniqueIdentifier logic in spendInfo selector
- Enable HBAR uniqueIdentifier

## 2.3.0 (2021-10-11)

- Add Hedera (HBAR) support
- Fix react-native-share crash on iOS 10 devices

## 2.2.0 (2021-09-27)

- Use new sync servers
- Fix token icons on exchange scene
- Fix RIF trading on Godex
- Fix missing FIO request metadata
- Fix status bar visual consistency
- Add wallet balance to exchange scene
- New themed notes modal
- New themed version update modal
- Add spinners to buttons waiting on background tasks
- Add loading gif while app completes new account creation
- Fix issue empty amount issue when user edits amount metadata
- Fix slow loading exchange rate on exchange scene
- Fix flip input cursor blink animation
- Fix XMR spendable amount error display
- Cleanup exchange scene error visuals
- Fix keyboard persistence when unfocusing a text field
- Fix FIO domain transfer requiring a transaction fee change
- Fix modals persisting after logging out
- Remove deprecated exchange providers
- Support adding a memo for FIO transactions
- Various visual fixes and improvements
- Temporarily block FTM trading for some exchange partners
- Replace custom node modal with list
- FIO: Save request data locally
- Create new tappable settings row component
- Add type-checking to scene navigation props
- Update build instructions
- Fix Xcode 13 legacy build system issues
- Update partner descriptions
- Update translations
- Upgrade edge-core-js to v0.18.9
  - fixed: Allow import 'edge-core-js/types' to work in TypeScript.
  - changed: Upgrade cleaners to v0.3.11
  - fixed: Restore Webpack production mode
  - fixed: Limit the number of documents uploaded to the sync server in one request.
  - fixed: Upgrade to edge-sync-client v0.2.1, which improves the sync-server retry logic.
  - changed: Use edge-sync-client to retrieve the list of sync servers instead of a hard-coded list.
- Upgrade edge-currency-accountbased to v0.7.74
  - FIO: Remove new otherLocalData cache and use existing walletLocalData cache
  - FIO: Add request fetching to engine loop and save data locally
  - Remove postinstall-postinstall dependency
- Upgrade edge-exchange-plugins to v0.11.36
  - Remove inactive swap plugins Faast and Coinswitch
  - Coingecko: add HBAR
  - Nomics: Fix error handling
  - Disable FTM trading on all plugins that do not identify the version of FTM is supported (ERC20 or mainnet)
  - Plugins will be updated as mainnet identification is added.
  - Godex: Add support for RBTC network name
  - Move edge-core-js to devDependencies
- Upgrade edge-login-ui-rn to v0.9.20
  - rn: Fix handling for the START_RESECURE action type.
  - rn: Fix date handling in 2FA scenes
  - rn: Fix date handling in alert modal
  - rn: Fix keyboard hiding in recovery scene
  - rn: Rename any instance of 'screen' to 'scene'
  - rn: Update translations
  - rn: Add gif loader to wait screen
- Upgrade edge-currency-monero to v0.3.3
  - Reformat spendable balance error into 3 lines

## 2.1.0 (2021-08-23)

- New UI2 themed Scan scene
- Reimplement OutlinedTextInput
- New UI2 themed raw text modal
- Replace old modals with themed ButtonsModal
- Add Resync option to tokens
- Add minimum balance check to Exchange and partner plugins scenes
- Add type-checking to react-native-router-flux
- Remove tab bar from Request scene
- Remove magnifying glass icon from Address modal
- Always check clipboard for address when entering Send scene
- Fix button text font size and autoshrinking
- Fix FlipInput component visual issues
- Fix FIO Request button
- Fix error when cancelling the share menu
- Fix crash when cancelling high fee modal
- Fix keyboard hiding PIN entry on Send scene
- Fix tokens still appearing in list after deletion
- Add apikey to Fantom initialization
- Unfocus keyboard when side menu is opened
- Remove edge-components
- Various text and visual fixes
- Update translations
- Upgrade edge-core-js to v0.18.5
  - fixed: If multiple metadata files exist for a single transaction, always load the oldest one
- Upgrade edge-currency-bitcoin to v4.9.18
  - BCH: Update xpub explorer URL
- Upgrade edge-login-ui-rn to v0.9.16
  rn: Fix Change PIN scene losing access to keyboard
  rn: Fix error when cancelling sending
  rn: Enable Typescript strict mode and fix type definitions
  rn: Update translations
- Upgrade edge-currency-accountbased to v0.7.71
  - FTM: Add apikey to ftmscan.com requests

## 2.0.19 (2021-08-20)

- Fix issue with sending ERC-20 tokens
- Upgrade edge-currency-accountbased to v0.7.69
  - Fix: Regression caused by EIP-681 parseUri implementation

## 2.0.18 (2021-08-18)

- Fix issue when sending ETC, FTM, and RSK
- Pass currency code to parseUri
- Upgrade edge-currency-accountbased to v0.7.69
  - Add: Improved support for EIP-681 URI parsing of payments and token transfers
  - Fix: Unable to send transactions on ETC, FTM, and RSK networks

## 2.0.17 (2021-08-02)

- Add Exchange Max function Exchange scene
- ETH: EIP-1559 support
- Themed Change Password and Change PIN
- Make request QR tappable to increase accessibility
- DGB: fix private key sweeping
- Change exchange rates to strings and refactor accompanying functions
- Add blinking cursor to FlipInput
- Reconfigure exchange quote scene
- Update the PrimaryButton component design
- Fix font color on auto-logout modal
- Fix whitespace handling in wallet search
- Fix error when saving transaction metadata
- Prevent scene-specific modals from lingering after leaving scene
- Save device name to sent transaction metadata
- Add styles/utils for Add Custom Token scene
- Update text strings and translations
- Upgrade "edge-core-js to v0.18.4
  - fixed: Ensure that transactions never have `undefined` as a `nativeAmount`.
  - fixed: Change the WebPack build settings to allow easier debugging.
  - fixed: Fix the React Native WebView bundle to work on really old devices.
- Upgrade edge-currency-bitcoin to v4.9.17
  - Linting fixes
  - Update travis file to use node 14, fix the yarn install step and added more testing steps
  - Add plugin test fixtures for Digibyte including all the supported WIF variations
  - Add a wif serializer to Digibyte's to keep supporting the old Private Key prefix
  - Update Digibyte's Private Key prefix to match the new standard
- Upgrade edge-currency-accountbased to v0.7.68
  - Add base fee multiplier ETH fee algorithm (EIP 1559)
  - Add Ethereum testnet server URIs to support testnets for development
  - Fix blockbook server URIs
- Upgrade edge-exchange-plugins to v0.11.32
  - Swap: Ensure all quotes expire in the future
  - Currency Converter: Fix response cleaner
  - Bitmax: Update url to ascendex.com
- Upgrade edge-login-ui-rn to v0.9.14
  - rn: Use hooks for the public login screen
  - rn: Font size consistency fixes
  - rn: Close modals on scene exit.
  - rn: Add type definitions for TypeScript (this release re-writes the entire codebase into TypeScript, but this should be the only externally-visible difference).

## 2.0.16 (2021-07-26)

- Code cleanups: connectors, actions, and constants
- Add styles/utils for Add Custom Token scene
- Ethereum checksum support
- FIO: Fix custom domain registration when there isn't a name registered to address
- Fade component fixes
- UI component consistency fixes
- Update translations
- Update partner descriptions
- Upgrade edge-currency-accountbased to v0.7.67
  - XRP: Add x-address support
  - Throw error if there is a checksum present and it fails verification
- Upgrade edge-login-ui-rn to v0.9.12
  - rn: Synchronize outlined text field logic fixes
  - rn: Tighten the outlined text field props
  - rn: Fix the crash in the QR-login modal
  - rn: Run yarn precommit to update strings
  - rn: Always close modals on the way out the door
  - rn: Fix coding errors caught by TypeScript
  - rn: Add missing react-native-gesture-handler dependency
  - rn: Put withTheme after connect
  - rn: Simplify the Fade component
  - rn: Move the isASCII function to the right file
  - rn: Use better export syntax
  - rn: Use modern syntax for localization
  - rn: Remove unused components & libraries
  - rn: Implemented recovery translations
  - rn: Add back button to the "TermsAndConditions" screen
  - rn: Switch New Account flow screens positions: move "TermsAndConditions" screen after "Pin" screen and before "Wait" screen
  - rn: Upgrade to react-native-airship v0.2.6
- Upgrade edge-exchange-plugins to v0.11.30
  - Totle: Fix error response handling
- Upgrade edge-currency-bitcoin to v4.9.16
  - BCH: Fix typo in BSV wallet type in forks array

## 2.0.15 (2021-07-19)

- Fix crash when attempting to send without an exchange rate present

## 2.0.14 (2021-07-06)

- New themed Create Account flow
- Only allow for one FIO expired pop-up per login
- Show required amount when there isn't sufficient parent currency to pay token transaction fee
- Automatically adjust max send amount after changing fee
- Logs and CSV Export TXs show which device was used to send the transaction
- Replace all instances of old flip input with new one
- "Delete wallet" replaced with "Archive Wallet" to reflect actual functionality
- Remove Split BCH option from segwit bitcoin wallets
- Fix token wallet loading on first login on new device
- Fix recorded timestamp on FIO transactions
- Fix incorrect recorded denomination in swap details
- Fix negative fee values caused by incorrect precision
- Sanitize PIN input
- Update partner descriptions
- Removed unused legacy code
- Various visual fixes and enhancements
- Update translations
- Upgrade edge-core-js to v0.18.2
  - Remove several methods and properties:
    - `EdgeAccount.exchangeCache` - Use `EdgeAccount.rateCache` instead.
    - `EdgeContext.getRecovery2Key` - Use `EdgeUserInfo.recovery2Key` instead.
    - `EdgeContext.pinExists` - Use `EdgeUserInfo.pinLoginEnabled` instead.
    - `EdgeContext.on('login')` - Use `EdgePendingEdgeLogin.watch('account')` instead.
    - `EdgeContext.on('loginError')` - Use `EdgePendingEdgeLogin.watch('error')` instead.
    - `EdgeContext.on('loginStart')` - Use `EdgePendingEdgeLogin.watch('username')` instead.
    - `EdgeCurrencyWallet.exportTransactionsToCSV` - Moved to edge-react-gui project.
    - `EdgeCurrencyWallet.exportTransactionsToQBO` - Moved to edge-react-gui project.
    - `EdgeCurrencyWallet.getBalance` - Use `EdgeCurrencyWallet.balance` instead.
    - `EdgeCurrencyWallet.getBlockHeight` - Use `EdgeCurrencyWallet.blockHeight` instead.
    - `EdgeCurrencyWallet.getDisplayPrivateSeed` - Use `EdgeCurrencyWallet.displayPrivateSeed` instead.
    - `EdgeCurrencyWallet.getDisplayPublicSeed` - Use `EdgeCurrencyWallet.displayPublicSeed` instead.
    - `EdgeCurrencyWallet.startEngine` - Use `EdgeCurrencyWallet.changePaused(false)` instead.
    - `EdgeCurrencyWallet.stopEngine` - Use `EdgeCurrencyWallet.changePaused(true)` instead.
    - `EdgeEncodeUri.legacyAddress` - Use `EdgeEncodeUri.publicAddress` instead.
    - `EdgeEncodeUri.segwitAddress` - Use `EdgeEncodeUri.publicAddress` instead.
  - Remove the `options` prop on the `MakeEdgeContext` React Native component.
    - Just pass any context options as normal props.
  - Remove the `type` property from all error classes, as well as the global `errorNames` table.
    - Use the new error-identification methods, such as `asMaybePasswordError`, to determine if an error is a specific type.
  - Stop allowing `null` in places where we expect an `EdgeAccountOptions` object.
    - Just pass `undefined` if this parameter isn't used.
  - Return the `EdgeAccount.otpResetDate` as a `Date` object.
  - The following changes affect Edge core plugins:
    - Remove `EdgeIo.console` - Use `EdgeCorePluginOptions.log` instead.
    - Define `EdgeCurrencyEngine` methods to return `Promise<void>` instead of `Promise<mixed>`.
    - The core will no longer upgrade `pluginName` to `pluginId` for legacy currency plugins.
  - Save the device description on sent transactions
  - Add an optional InsufficientFundsError.networkFee field
  - Avoid performing back-to-back initial syncs
- Upgrade edge-currency-accountbased to v0.7.65
  - ETH: Add checksum support
  - BNB: Add additional API servers
  - Add native fee amount to InsufficientFundsError
  - FIO: Fixed timestamps in get_actions
- Upgrade edge-login-ui-rn to v0.9.9
  - rn: New themed Create Account flow
  - rn: Fix Change Recovery Questions modal on large screens
  - rn: Update translations

## 2.0.13 (2021-06-14)

- Queue wallet loading to improve GUI performance
- New themed Manage Tokens scene
- Add custom token support to FTM and RSK
- Replace all instances of old flip input to use a new one
- New mainnet/token icon URL format
- Fix memory leak in WalletProgressIconComponent
- Various navigation and text fixes
- Upgrade edge-currency-accountbased to v0.7.62
  - FIO: Randomize apiUrl when sending a new request
  - FIO: Add ALREADY_REGISTERED error rype
  - Prevent unnecessary fetch calls when amberdata server lists are empty
  - Remove icon URLs
- Upgrade edge-currency-bitcoin to v4.9.15
  - Remove icon URLs
  - Upgrade edge-core-js to v0.17.33
  - Upgrade to Webpack 5
  - Upgrade cleaners to v0.3.9
- Upgrade edge-currency-monero to v0.3.2
  - Remove icon URLs
- Upgrade edge-login-ui-rn to v0.9.7
  - rn: New themed Create Account scene
  - rn: Reorganize layers and decreased tappable area to prevent text entry in PIN field
  - rn: Allow direct entry of recovery token
  - rn: Update translations

## 2.0.12 (2021-06-01)

- Upgrade to React Native v0.64.1
- Add more currency icons
- iOS: Fix transaction timestamp accuracy
- Add additional context modal for Contacts permission
- Fix missing currency codes in Sweep Private Key wallet picker
- Add side menu hamburger button to Settings and ToS scenes
- Text and layout fixes
- Upgrade edge-currency-accountbased to v0.7.60
  - Fix a possible race condition where the last queried block height is saved but the actual transactions are not
  - Always set this.walletLocalDataDirty = true if any transactions have changed
  - ETH: Use the default token gas limit if getCode reveals the destination is a contract and estimateGas fails to return a gas value
  - ETH: Allow ethgasstation safeLow estimate less than 1
  - Update logging
  - XRP: Remove bogus length checks from the XRP key import
  - FIO: Refactor SDK initialization so it's only started once per wallet
- Upgrade edge-currency-monero to v0.3.1
  - Fix float amount precision
  - Fix recorded native amount and fee
  - Import native code directly from react-native-mymonero-core. Before, this plugin relied on "magic" methods passed in via the global object
- Upgrade edge-exchange-plugins to v0.11.28
  - Godex: Add the mainnet currency codes to the transaction request
  - Fox: Check mainnet matches user's wallet
- Upgrade edge-login-ui-rn to v0.9.4
  - Prevent user from selecting duplicate recovery questions
  - Show error on Change Password Recovery Screen when user selecting the same question
  - Fix spacing issue on create account welcome screen
  - Prepare for future edge-core-js breaking changes

## 2.0.11 (2021-05-17)

- Add Fantom (FTM) support with fUSDT
- New themed Exchange scene with confetti
- Visual and text fixes
- XLM and XRP unique identifier fixes
- Upgrade edge-core-js to v0.17.33
  - Add a paused flag to EdgeCurrencyWallet, and a matching changePaused method
  - Deprecate EdgeCurrencyWallet.startEngine - Use EdgeCurrencyWallet.changePaused(false) instead
  - Deprecate EdgeCurrencyWallet.stopEngine - Use EdgeCurrencyWallet.changePaused(true) instead
  - Clean legacy Airbitz wallet files to prevent potential crashes at login
- Upgrade edge-currency-accountbased to v0.7.58
  - Add Fantom
  - FTM: Add fUSDT support
  - XRP: Pass default fee to preparePayment
  - XRP: Remove unused 'type' field from transaction validation
  - XRP: Change destination tag limit to 10 digits and less than UINT32
  - Fix metadata issue for accelerated ETH txs (RBF tx)
- Upgrade edge-exchange-plugins to v0.11.27
  - Add constant rate for fUSDT to USDT
  - ChangeNow: Add ERC20-only filter to prevent trading for mainnet tokens when only the ETH ERC20 token is available
- Upgrade edge-login-ui-rn to v0.9.2
  - Add testID's to various screens
  - Improve internal type-safety. This should not have any extenally-visible effects

## 2.0.10 (2021-05-05)

- Upgrade to RN 0.64
- Various bug fixes and improvements
- Upgrade edge-core-js to v0.17.32
  - Enable safari10 option in webpack minimizer to fix stuck loading screens on iOS 10
  - Add crash and breadcrumb methods to EdgeLog for crash reporting
  - Deprecate the options prop on the MakeEdgeContext React Native component
  - Just pass any context options as normal props
  - Reset the wallet sync ratio as part of a resync
- Upgrade edge-currency-accountbased to v0.7.55
  - Remove allowance transaction filtering from addTransaction
  - ETH: Add error reporting to tx lists and gas price query for future debugging
  - FIO: Reduce logging verbosity
  - BNB: Enable resync
  - Add additional log types crash and breadcrumb
  - FIO: Change some error logging levels from error to info to reduce log verbosity
- Upgrade edge-exchange-plugins to v0.11.25
  - Convert Nomics, Coincap, and Currencyconverter API to use bulk requests
  - Sideshift: Add refund address
- Upgrade edge-login-ui-rn v0.9.1
  - Disable the password recovery email on Android. This works around a tricky crash in the React Native rendering code.

## 2.0.9 (2021-04-16)

- Add UNI ERC20 token
- Various bug fixes and improvements
- Upgrade edge-core-js to v0.17.30
  - Deprecate several methods:
    - EdgeContext.getRecovery2Key - Use EdgeUserInfo.recovery2Key instead.
    - EdgeCurrencyWallet.exportTransactionsToCSV - Moved to edge-react-gui project.
    - EdgeCurrencyWallet.exportTransactionsToQBO - Moved to edge-react-gui project.
    - EdgeCurrencyWallet.getDisplayPrivateSeed - Use EdgeCurrencyWallet.displayPrivateSeed instead.
    - EdgeCurrencyWallet.getDisplayPublicSeed - Use EdgeCurrencyWallet.displayPublicSeed instead.
  - Upgrade build scripts to use Webpack 5.
- Upgrade edge-currency-accountbased to v0.7.53
  - ETH: Add UNI ERC20 token
  - ETH: Add eth_call to token balance loop
  - FIO: Logging cleanup
  - FIO: Allow sending tokens without transactionJson or otherParams
  - FIO: Change some error logging levels from error to info to reduce log verbosity
- Upgrade edge-exchange-plugins to v0.11.24
  - Sideshift: Move permission check after currency check
  - Upgrade eslint-config-standard-kit to v0.15.1
  - Upgrade to edge-core-js v0.17.29
  - Upgrade to Webpack 5
- Upgrade edge-login-ui-rn to v0.9.0
  - *Breaking change*: This release contains a breaking change that was not indicated in the minor version update:
    - rn: Prompt for notification permissions to support security features
  - rn: Update modal colors
- Upgrade edge-currency-monero to v0.2.10
  - Update image URL

## 2.0.8 (2021-04-08)

- Reset the slider on the send screen when the pending state changes.
- Hide 0 crypto amount if balance is hidden.
- Fix tokens not showing the correct icon on Request Scene.
- Fix a crash when initiating password recovery.
- Remove the BPay option for Banxa Australia.
- edge-currency-bitcoin v4.9.14
  - Fix the BECH32 Litecoin prefix.
- edge-login-ui-rn to v0.8.0
  - Re-theme the change password recovery modals.
  - Fix broken links when setting up password recovery using the "share" option.

## 2.0.7 (2021-03-19)

- Brand new themed send screen and workflow
- Add new Golem ERC20 token GLM
- Update partner descriptions
- Update translations
- edge-currency-accountbased to v0.7.51
  - FIO: Refactor FIO action to be passed in otherParams of edgeSpendInfo
  - EOS: Add dfuse graphql API to search for transactions
  - ETH: Add new Golem token GLM
  - Add promiseNy util to verify API responses from multiple sources
  - Add contract address checking to Blockbook
  - XRP: Use default fee of (0.00001 XRP) if SDK is unable to query for recommended fee
  - Update content URL
- edge-currency-bitcoin to v4.9.13
  - RVN: Support old specification of blockheader check in newer blocks
- edge-exchange-plugins to v0.11.23
  - Move REPV2 to constantRate plugin
  - Convert Coingecko to handle bulk queries
  - Fix Sideshift error handling
- edge-login-ui-rn to v0.8.0
  - Breaking changes:
    - rn: Add react-native-share as a native dependency.
  - Other changes:
    - Add a "share" option for the password recovery token.
    - rn: Catch & display errors while launching screens.
    - rn: Make the OTP error & OTP repair screens less confusing based on user feedback.
    - rn: Upgrade edge-core-js & use its latest type definitions internally.
    - all: Upgrade linting tools.

## 2.0.6 (2021-03-01)

- Fix an issue with password recovery
- Update plugin list sorting
- Upgrade edge-core-js to v0.17.26
  - Fix the `EdgeContext.listRecoveryQuestionChoices` method.
    - Fix the runtime data validation to accept the actual server return values.
    - The return type of `Promise<string[]>` has always been incorrect, so the correct return type is now `Promise<EdgeRecoveryQuestionChoice[]>`.
    - As a stop-gap measure, though the return-type definitions is now `any`. We will insert the correct return type definition in the next breaking release.

## 2.0.5 (2021-02-27)

- Banxa: Add support for selling BTC in Australia
- MoonPay: Add support for buying DGB
- Fix transaction searching
- More themed components
- Various bug fixes and improvements
- Upgrade edge-login-ui-rn to v0.7.0
  - Breaking changes:
    - Add a native react-native-localize dependency
    - Remove the unused folder parameter from various touch-related functions:
      - isTouchEnabled
      - isTouchDisabled
      - enableTouchId
      - disableTouchId
    - Remove the error parameter from the onLogin callback
    - Remove the ChooseTestAppScreen component
    - Upgrade other native dependencies
  - Other changes:
    - Add German translation
    - Flip the background gradient direction
    - Improve the security alerts screen appearance
    - Add a new 2fa repair screen component
- Upgrade edge-core-js to v0.17.25
  - Load all supported currency pairs at launch to improve exchange rate loading speed
  - Fix the parentNetworkFee field missing in certain EdgeTransaction instances
  - Fix missing transactions while searching
  - Perform more data validation on network requests
  - Fix a bug that would prevent login vouchers from working on Airbitz accounts with 2fa turned on
  - Expose periodic 2fa errors through the context's error event
  - Add an EdgeAccount.repairOtp method
- Upgrade edge-currency-accountbased to v0.7.48
  - FIO: Added transfer address action
  - ETH: Fix RBF bug: Use correct currencyCode for tx lookup in ethEngine saveTx
  - ETH: Double estimated gas limits when sending ETH to contract address
  - EOS: Add dfuse API to getKeyAccounts method
  - Fix variable typo
- Upgrade edge-exchange-plugins to v0.11.21
  - Sideshift: Add order status URL
  - Sideshift: Throw appropriate error messages instead of relying on cleaners
  - Coingecko: Add FIO
  - Bitmax: Remove FIO fallback value
  - Log issues with API responses as warnings

## 2.0.3 (2021-02-11)

- Add new DeFi ERC20 tokens
- Show loading ring when resyncing a wallet
- Themed preferred exchange partner modal
- Update partner descriptions and limits
- Fix inputs error on change fee screen
- Upgrade edge-core-js to v0.17.23
  - Ensure all crypto to crypto exchange rates have a route to USD
  - Add currency code column to CSV exports
- Upgrade edge-currency-accountbased to v0.7.46
  - Add DeFi ERC20 tokens
  - Update FIO server list
  - Add additional logging
- Upgrade edge-currency-bitcoin to v4.9.12
  - Rename TBTC to TESTBTC to avoid conflict with tBTC ERC20 token
- Upgrade edge-exchange-plugins to v0.11.19
  - Move aTokens to constantRate plugin
  - Rename TBTC to TESTBTC
  - Sideshift: add uniqueIdentifier to swaps

## 2.0.2 (2021-02-05)

- Fix crash when adding a Fio name

## 2.0.1 (2021-02-04)

- Fix detection of transactions with large input values
- Themed FIO screens
- Fix wallet balance display issue
- Add Doge settings
- Fix minor navigation issues
- Update partner descriptions
- Upgrade edge-currency-bitcoin to v4.9.11
  - Refactor parseTransaction test and add big number transaction support
- Upgrade edge-currency-accountbased to v0.7.44
  - ETH: Bump max gas limit to 300000
  - ETH: Add additional estimateGas params that Cloudflare requires
  - ETH: Put RPC error handling in multicastServers
  - ETH: Throw error when custom fee isn't valid or doesn't reach network minimums

## 2.0.0 (2021-01-26)

- New dark-themed components
- Swipable wallets to quickly send, receive, and reveal settings
- Added tutorial on new swipe actions
- Android: Fix export transactions
- Safello: Add BankId support
- EOS: Fix account activation errors related to hyperion nodes
- Deprecate WAX
- Verbose logging setting to minimize noisy logs
- logs before sending to logs server
- Update partner descriptions
- Update translations
- Upgrade edge-core-js to v0.17.22
  - Update EdgeCurrencyEngine to allow getFreshAddres, addGapLimitAddresses, and isAddressUsed to return promises
  - Periodically perform a re-login to sync logged-in account credentials with the server
  - Add an EdgeContextOptions.logSettings property to control logging verbosity, along with an EdgeContext.changeLogSettings method
  - Deprecate the EdgeEncodeUri.legacyAddress and EdgeEncodeUri.segwitAddress parameters and just pass the address in EdgeEncodeUri.publicAddress, regardless of format
  - Update the swap logging to give more information about failed quotes
- Upgrade edge-currency-accountbased to v0.7.43
  - EOS: Fix get_key_accounts endpoint and enforce 12 character rule on new account names
  - Adjust log levels
  - Update to eslint-config-standard-kit to v0.15.1
  - Add WBTC
  - Fix Aave token parameters
- Upgrade edge-currency-bitcoin to v4.9.10
  - Throw error when custom fee is below 1 sat/byte
  - Add StratumError to carry the throwing server's URI
  - Update to eslint-config-standard-kit to v0.15.1
  - Adjust log levels
  - Add parseUri tests
- Upgrade edge-currency-monero to v0.2.9
  - Add additional logging and context for logs
  - Upgrade to eslint-config-standard-kit v0.15.1
  - Add parseUri tests
- Upgrade edge-exchange-plugins to v0.11.18
  - Coingecko: Add AAVE tokens
  - Coingecko: Fix rates[] initialization
- Upgrade edge-login-ui-rn to v0.6.28
  - Only fetch recovery questions if they exist
  - Fix the OTP backup code modal crash
  - Add a scroll view to the change password screen
  - Expose the security alerts screen as a standalone component
    - Add hasSecurityAlerts and watchSecurityAlerts helpers to determine when to show this screen
    - Add a skipSecurityAlerts prop to the LoginScreen component, so the GUI can manage the alerts instead of the login UI
  - Eliminate all legacy Disklet usage
  - Expose the QR modal from the password login screen
  - Update translations
  - Fix a bug that could show the user redundant login approval requests
  - Add helper text to pin login network errors
  - Improve the password recovery error text
  - Replace several old-style modals with themed modals

## 1.19.1 (2020-12-31)

- Add new swap partner SideShift
- Add WAX
- Add Aave interest bearing tokens support
- Add WBTC
- FIO: Fix removing public address and added parseUri for approving request
- Update partner descriptions and assets
- Theme the password-recovery reminder modal
- Clean up unused code
- Replace all for-in loops with for-of loops
- Use new logs1 endpoint
- Upgrade edge-core-js to v0.17.19
  - Upgrade Airbitz accounts with secret-key login
  - Filter duplicates from rateHints
  - Add low priority edgeRates bias
  - Update linting
- Upgrade edge-exchange-plugins to v0.11.18
  - Add rates1 as a fiat/fiat exchange rate provider
  - Fix Coingecko returning duplicate rates
  - Fix Sideshift cleaner throws and formatting
- Upgrade edge-currency-accountbased to v0.7.42
  - Add Aave ERC20 tokens
  - Add WBTC
  - FIO: Add additional domain transfer transaction

## 1.19.0 (2020-12-21)

- Upgrade to React Native v0.63.4
- Update ANT token
- Change Zcoin to Firo
- Upgrade edge-currency-accountbased to v0.7.39
  - Double gas estimate when sending ETH to a contract to reduce chance of failure
  - FIO logging cleanup
  - Update ANT contract address and rename original token ANTV1
- Upgrade edge-currency-bitcoin to v4.9.7
  - Change Zcoin to Firo
  - Use XZC code when querying info1 for FIRO electrum servers
  - Update DOGE fee calculation
  - Suppress electrum spam server messages
  - Update Blockchair explorer URLs to include partner ID
  - Update InfoServer constant
- Upgrade edge-currency-monero to v0.2.7
  - Update Blockchair explorer URL to include partner ID
- Upgrade edge-exchange-plugins to v0.11.15
  - Update ChangeNow to save amount returned from order creation endpoints to metadata
  - Add new swap partner SideShift
  - Add ANT token to Coingecko
  - Reduce Nomics queries by ignoring fiat/fiat pairs
  - Add support for FIRO
  - Fix CORS issue with Coincap
- Upgrade edge-login-ui-rn to v0.6.24
  - Fix & theme the password recovery input modal
  - Show the correct header for IP validation errors
  - Fix typos on the 2fa reset modal
  - Add colors to all spinner components
  - Fix Flow types around react-native-material-textfield
- Upgrade edge-components to v0.0.31
  - Fix the react-native-material-textfield Flow types
- Upgrade edge-plugin-simplex to remove all Sell functionality

## 1.18.1 (2020-12-09)

- EOS: Patches issue with bogus accounts getting returned by nodes
- WAX: Disabled in core plugins

## 1.18.0 (2020-11-25)

- ETH: Accelerate Transaction feature (replace-by-fee)
- FIO: Cancel request, transfer domain, expanded exchange support, verify payer address before sending request, text and visual updates
- Support Azteco URI
- Limit exchange rate queries to active wallet crypto/fiat pairs
- Add paste button to flip input
- Reduced memory utilization
- Update translations
- Add new showWarning function to AirshipInstance.js
- Separate render of wallet Currency and token currencies
- Make Icon standard and just pass iconColor and iconSize as props
- Refactor icons and normalize names
- New common component TouchableTextIcon
- Removed parent container from RNCamera
- Android: AndroidX support, Upgrade to gradle v6.2
- iOS: iPhone 12 safe area fixes
- Update edge-react-gui README versions and instructions
- Upgrade react-native-firebase to v4.3.8
- Upgrade edge-core-js to v0.17.18
  - (feature) Add ability to filter `getTransactions()` with `searchString` option
  - (feature) Add requested currency pair to rateHints if it cannot be served by searchRoutes()
- Upgrade edge-currency-accountbased v0.7.34
  - RBF support for ETH, RSK, and ETH tokens
  - Add Blockbook API support for Ethereum
  - Disable Alethio API support
  - Remove Supereth API support
  - Update endpoint for finding EOSIO account by key
  - Disable Greymass Fuel for Telos
  - Additional checks and bugfixes for FIO addresses and domains
  - Removed FIO strings from logs
- Upgrade react-native-fast-crypto to v2.0.0
  - Remove all Monero features (these live in react-native-mymonero-core now)
  - iOS: Use the OpenSSL-Universal package to provide OpenSSL libraries
  - Android: Use implementation gradle command instead of deprecated compile
  - Android: Fix some documentation errors
  - Remove the deprecated default export
- Upgrade edge-login-ui-rn to v0.6.22
  - Update back button icon
- Upgrade edge-components v0.0.30
  - Remove unused components: Icon, IconButton, ModalManager, PasswordInput, SimpleConfirmModal, StaticModal, TextAndIconButton, TextButton, ThreeButtonModal, YesNoModal

## 1.17.8 (2020-11-20)

- Upgrade Android SDK target to 29
- Upgrade edge-currency-bitcoin to v4.9.3
  - Add `hardFee` to DOGE to ensure transaction meets minimum network fee of 1 DOGE/tx

## 1.17.7 (2020-11-16)

- Fix double entry bug on some Android keyboards

## 1.17.6 (2020-11-03)

- Add 'sell' deepQuery type to Bity

## 1.17.5 (2020-10-30)

- Upgrade Bity plugin
- Fix QBO export

## 1.17.4 (2020-10-19)

- Upgrade react-native-fast-crypto to v1.8.2
  - Upgrade Monero C++ libraries to support v17 hard fork

## 1.17.3 (2020-10-19)

- Add Sofort payment method support through Banxa
- Add onAddressChange callback to update GUI when EOS accounts are activated
- FIO - Fix code capitalization
- Misc fixes and upgrades in preparation of RN63
- Upgrade edge-currency-accountbased to v0.7.30
  - Add onAddressChanged callback to EOS
- Upgrade edge-core-js to v0.17.15
  - (feature) Add onAddressChanged callback
- Upgrade edgelogin-ui-rn to v0.6.20
  - Don't show the reset button without a reset token
  - Use more modern React methods & import styles
  - Upgrade to react-redux v6.0.1
  - Theme the delete user modal
- Upgrade edge-exchange-plugins to v0.11.11
  - Update Changelly to use getFixRateForAmount

## 1.17.2 (2020-10-04)

- FIO import private key
- Add USDC support in Wyre
- New themed components
- Fix EOS wallet activation
- EdgeProvider - Add unique identifiers to spendtargets
- Fixed the export transaction date picker on iOS 14
- Re-worked transaction export on Android and fixed crash
- Misc code cleanups
- Upgrade edge-core-js to v0.17.14
  - (fix) Don't crash when using a barcode to log into accounts with pending OTP resets
  - (fix) Correctly expire any vouchers on the device while doing a barcode login
  - (fix) Upgrade to node-fetch v2.6.1
- Upgrade edge-currency-accountbased to v0.7.29
  - Add FIO import private key support
  - Replace schema with cleaners for transaction history api calls
  - Add cloudflare rpcServer
  - Pass fetchCors function to amberdata api calls
  - Add postinstall script for node14 dependency compatibility (usb and node-hid)
  - Update cleaners
  - Fix TLOS block explorer link
- Upgrade edge-exchange-plugins to v0.11.10
  - Fix Fox Exchange parent fee display for token trades
  - Fix CORS issues with Nomics
  - Remove unused xagau and herc plugins
  - Remove debugging comment
- Upgrade edge-currency-bitcoin to v4.9.2
  - Add 'bitcoin-sv:' URI support

## 1.17.1 (2020-09-22)

- Upgrade edge-login-ui-rn to v0.6.18
  - rn: Fix a crash when rendering the SecondaryButton. This would occur when the 2fa reminder modal popped up.

## 1.17.0 (2020-09-18)

- Add 2FA voucher support to allow your device to approve a login from another device
- Re-theme 2FA screens
- Register FIO domains
- FIO usability fixes
- Refactor flip input to address crashes on Android
- Wallet custom token filter fix
- Add unique identifier requestSpend logging to EdgeProvider
- Remove dummy address from Wyre widget launch
- Upgrade edge-core-js to v0.17.14
  - (feature) Expose an EdgeAccount.pendingVouchers field
  - (feature) Expose as EdgeUserInfo.voucherId field
  - (fix) Don't crash when using a barcode to log into accounts with pending OTP resets
  - (fix) Correctly expire any vouchers on the device while doing a barcode login
  - (fix) Upgrade to node-fetch v2.6.1
  - (fix) Switch to the new voucher endpoint
  - (fix) Always return OtpError.voucherId when available
- Upgrade edge-currency-accountbased to v0.7.25
  - FIO register domain
  - Added free FIO address link
  - Upgrade FIO SDK to v1.1.0
  - Retry failed FIO tx broadcasts
  - FIO check pub address error handling
  - Updated FIO api urls to remove port #
  - Update FIO explorer
  - Update EOS explorer
- Upgrade edge-exchange-plugins to v0.11.7
  - Enable Changelly order status URL
  - Pass last Totle tx as orderId
- Upgrade edge-login-ui-rn to v0.6.16
  - Fix a race condition that could lead to an infinite login loop
  - Upgrade to the latest react-native-airship
  - Remove unused TouchId logic from the password login screen
  - Re-theme and add voucher support to the OTP reset alert, OTP error screen, and related modals
  - Route to a security alert screen after logging into an account with pending issues

## 1.16.7 (2020-09-05)

- Add Bitaccess support
- Fix for modals persisting on auto-logout
- Various text and translation fixes
- Record orderIds to util server
- Upgrade edge-core-js to v0.17.12
  - (feature) Add a keyLoginEnabled flag to EdgeUserInfo
  - (feature) Add a lastLogin date to EdgeUserInfo and EdgeAccount
- Upgrade edge-currency-bitcoin to v4.9.1
  - Replace logger with EdgeLog
- Upgrade edge-currency-accountbased to v0.7.20
  - Update ETH gas price sanity check values
  - Added free FIO address link
  - Updated FIO api urls to remove port
- Upgrade edge-login-ui-rn to v0.6.15
  - Do not enable touch for users without locally-stored data
  - Fix the modal title size
  - Upgrade to react-native-patina v0.1.3

## 1.16.6 (2020-08-26)

- Added Synthetix ERC20 tokens SNX, SBTC, and SUSD
- Add support for Anypay pay: protocol
- Use eth_estimategas and eth_getcode to improve ETH and ERC20 token transaction gas limit estimation
- Add BSV buy support for Simplex
- New flip input design
- Theming enhancements and fixes
- Update partner descriptions
- Upgrade edge-core-js to v0.17.11
  - (feature) Add a login voucher system. When a new device tries to log into an account with 2-factor security, the server can issue a voucher along with the OtpError. Existing devices with the 2-factor token can then log in and either approve or deny the voucher using EdgeAccount.approveVoucher or EdgeAccount.rejectVoucher. The EdgeLoginMessages type also includes a list of pending vouchers now.
  - Upgrade to hash.js v1.1.7 and redux-keto v0.3.4.
  - (feature) Allow users to pass 6-digit OTP codes directly. This means EdgeAccountOptions.otp is deprecated for passing the secret. Use EdgeAccountOptions.otpKey to pass the secret, or EdgeAccountOptions.otp to pass the 6-digit code.
  - (feature) Save usernames for first-time logins that fail 2fa.
  - (feature) Save & return the account creation date as EdgeAccount.created.
  - Harden server response parsing.
  - Upgrade to hash.js v1.1.7 and redux-keto v0.3.4.
  - Upgrade many dev dependencies.
- Upgrade edge-currency-bitcoin to v4.9.0
  - Add support for Anypay payment protocol
- Upgrade edge-currency-accountbased to v0.7.20
  - Add Synthetix ERC20 tokens (SNX, SBTC, and SUSD)
  - Use eth_estimategas and eth_getcode to improve ETH and ERC20 token transaction fee estimation
  - Pass parent currency code in error when there's insufficient parent currency to pay transaction fee
  - Save FIO tx fee between makeSpend() requests to the same address to reduce network calls
  - Increase timeout on network-dependent block height test
- Upgrade edge-login-ui-rn to v0.6.14
  - Use react-native-airship to power more modals
  - Fix the header "skip" buttons on the password recovery workflow
  - Many internal cleanups & refactorings
- Upgrade edge-plugin-simplex to commit #653587d
  - Add BSV support
  - Improve error handling

## 1.16.5 (2020-08-13)

- Visual enhancements
- Export transactions with adjustable date range
- FIO address length can mpw be more than 16 characters
- Show parent currency transaction fee for token exchanges
- Link to prove sending Monero transaction in block explorer
- Added ability to enable/disable all notifications at the same time
- View Monero view key in wallet options
- Save additional numTransactions field in walletLocalData to resolve transaction list not displaying all transactions
- Added Save button to change mining fee
- Upgrade edge-components to v0.0.28
  - Fix compatibility with Flow v0.84.0
- Upgrade edge-currency-accountbased to v0.7.18
  - Disable asyncWaterfall for some FIO operations
  - Save numTransactions in localWalletData
  - Add cleaners to Etherscan get tx api responses
  - FIO checkTransactions algorithm update to page transactions
  - Fix REPv2 token address
- Upgrade edge-currency-monero to v0.2.6
  - Export private view key via getDisplayPublicSeed()
  - Update transaction explorer to Blockchair
- Upgrade edge-exchange-plugins to v0.11.6
  - Display parent currency and fiat fee for token swaps
  - Add CoinGecko
- Upgrade edge-login-ui-rn to v0.6.13
  - Enforce Flow typing & other cleanups throughout the codebase
  - Prevent the welcome screen from flickering at startup

## 1.16.4 (2020-08-04)

- Upgrade edge-currency-accountbased to v0.7.17
  - FIO checkTransactions algorithm update to page transactions
  - Fix REPv2 token address

## 1.16.3 (2020-07-30)

- Add additional fee data to transaction details
- Upgrade edge-currency-bitcoin to v4.8.6
  - Tweak electrumwss server scoring logic so negative scores don't get reset
- Upgrade edge-currency-accountbased to v0.7.16
  - Add REPv2 ERC20 token
  - Add new Tezos API service
- Upgrade edge-exchange-plugins to v0.11.5
  - Add REPv2 exchange rate
  - Prevent Totle plugin from returning arbitrage quotes for transfers
- Upgrade Wyre plugin

## 1.16.2 (2020-07-17)

- Upgrade Wyre plugin
- Upgrade edge-currency-bitcoin to v4.8.5
  - Support for Ravencoin's new blockheader length in latest hardfork

## 1.16.1 (2020-07-12)

- Upgrade edge-currency-accountbased to v0.7.14
  - FIO fix domain reg url

## 1.16.0 (2020-07-10)

- Add support for Ethereum Classic (ETC)
- Add support for Compound ERC20 token (COMP)
- Add token from wallet list modal
- Export token transaction history
- Wyre plugin refactor
- Upgrade edge-core-js to v0.17.9
  - Allow the user to pass an onLog callback to the context constructor
    - This allows our CLI to silence the core and supports more flexibilty in GUI log handling
  - Apply cleaners to the login stashes as well as remove some legacy disklet API usage
  - Support date filters for getTransactions
  - Save fee information in the spend metadata
  - Fix BSV replay protection feature broken by commit 11e752d8
  - Update info server URI
  - Add bias for Coinmonitor exchange rate provider
- Upgrade edge-currency-bitcoin to v4.8.4
  - Save fee information in the spend metadata
  - Send additional logging to core
- Upgrade edge-currency-accountbased to v0.7.13
  - Add getDomains method to FIO plugin
  - Save fee information in the spend metadata
  - Add Compound ERC20 token (COMP)
- Upgrade edge-exchange-plugins to v0.11.4
  - ChangeNow - Add fallback to floating-rate if trade is outside fixed-rate min and max
  - Add FIO rate via BitMax API
  - Add Coinmonitor rate API support for BTC/ARS pair
  - Add promoCode support to Switchain

## 1.15.2 (2020-06-25)

- Update FIO server list

## 1.15.1 (2020-06-22)

- Show fee as fiat amount on swap quote scene
- Upgrade edge-currency-bitcoin to v4.8.2
  - Prioritize Earn.com fee estimation
  - Decrease fee level block targets
- Upgrade edge-exchange-plugins to v0.11.1
  - Force high fee when swapping from BTC

## 1.15.0 (2020-06-17)

- Newly designed transaction details scene
- Price change alert push notifications
- Transak - added US debit card support
- Moonpay - added more countries
- Implement new theming scheme and utilize it for transaction details scene
- Fix the request scene share button to share the wallet public address URI instead of a file
- Fix share app button so it doesn't share a file
- Upgrade edge-core-js to v0.17.6
  - Expose an `EdgeAccount.rootLoginId`
  - Save the decryption keys for Monero spends
  - Replace git2.airbitz.co with git1.edge.app in the sync server list
- Upgrade edge-currency-bitcoin to v4.8.1
  - Make sure minimum LOW_FEE is enforced on all fee levels

## 1.14.1 (2020-06-08)

- Add try/catch to prevent info1 errors from appearing when server is under load

## 1.14.0 (2020-06-05)

- New FIO features
  - Create custom domain
  - Renew addresses and domains
  - Use new Address Modal for picking FIO addresses on all FIO related screens
  - Redesign user flow for connecting wallets to FIO addresses
- New Share Edge button in the side menu
- Remove unused code, dependencies, and strings
- Upgrade edge-core-js to v0.17.4
  - Save transaction metadata with spends
  - Save an EdgeTransaction.spendTargets list with every spend
  - Save an optional EdgeTransaction.swapData field with swap transactions
  - Save the decryption keys for Monero spends (requires a matching Monero plugin change)
  - Replace git2.airbitz.co with git1.edge.app in the sync server list
- Upgrade edge-currency-bitcoin to v4.8.0
  - Add mempool.space recommended bitcoin fee API
  - Increased target block delays for earn.com fee estimator
  - Increased bitcoin gap limit to 25
- Upgrade edge-currency-accountbased to v0.7.9
- Fix case where a FIO address could appear associated with two FIO wallets
  - Add etherclusterApiServers[] to rskInfo.js
  - Add custom FIO domain support
  - Add FIO address renewal support
- Upgrade edge-currency-monero to v0.2.5
  - Upgrade mymonero-core-js to export transaction private key
  - Upgrade edge-core-js to v0.17.4
  - Add EdgeTransaction.txSecret to capture transaction private key
  - Improve logging
  - Add makeMutex() to wrap makeSpend() to avoid entering it more than once at a time
- Upgrade edge-exchange-plugins to v0.11.0
  - Save swap metadata using the new, official edge-core-js API
- Upgrade edge-login-ui-rn to v0.6.10
  - Remove native-base as a dependency
  - Upgrade to react-native-vector-icons version 6
  - Fix ios-warning icon size

## 1.13.2 (2020-05-26)

- Fix flipinput crash on max spend Android

## 1.13.1 (2020-05-25)

- Fix flipinput crash on Android

## 1.13.0 (2020-05-22)

- Add buy support in India with new partner Transak
- Transfer button to easily transfer funds between wallets
- FIO
  - OBT data support
  - Custom ERC20 token support
  - Warning about access to FIO address when deleting FIO wallet
- New address modal with autocomplete FIO addresses
- Edge update version notification
- RTL text fixes
- Allow fee change even in locked transactions with partners or exchanges
- Force text entry to right of FlipInput amount
- Upgrade edge-core-js to v0.17.2
  - Prioritize the WazirX rate plugin when available.
- Upgrade edge-currency-accountbased to v0.7.6
  - Tezos - Add makeMutex to wrap makeSpend() to avoid entering it more than once
  - Refactor EOS plugin to remove owner key to support importing wallets
  - Add Ethereum Classic support
  - Remove ourReceiveAddresses from Tezos makeSpend
- Upgrade edge-exchange-plugins to v0.10.4
  - Add WazirX exchange rate provider
  - Fix Switchain ERC20 token sending issue and metadata
  - Fix swapInfo orderUri variable name across all swap partners
- Upgrade edge-components to v0.0.27
  - Add keyboardType and inputAccessoryViewId on FormFieldInput

## 1.12.4 (2020-05-14)

- Prevent excluded currency codes from appearing in wallet modal search results
- Temporarily exclude XTZ in exchange from-wallet selector

## 1.12.3 (2020-05-08)

- Upgrade edge-core-js to v0.17.1
  - Use constant-time comparisons for encryption & decryption.
  - Upgrade redux-keto dependency & fix uncovered type errors.
  - Improve git server error messages & rotation logic.
- Add Orchid (OXT) ERC20 token

## 1.12.2 (2020-05-04)

- Create and pay FIO Requests
- Connect wallets to FIO addresses
- Unstoppable Domains - added support for .kred .luxe and .xyz domains
- Fix Switchain ERC20 swap
- Fixed crashes on logout
- Additional promo code functionality
- Various other bug fixes
- Upgrade edge-currency-accountbased to v0.7.4
  - Refactor ETH and RSK to use common code
  - FIO performance improvements
  - isAccountAvailable() renamed to doesAccountExist()
- Simplex upgraded to support additional fiat currencies

## 1.12.1 (2020-04-17)

- New exchange provider Switchain
- Increased limit and added more countries to MoonPay
- New transaction details screen
- Enhanced deeplinking capabilities
- Bug fixes and visual enhancements
- ***BREAKING CHANGE*** Upgrade edge-core-js to v0.17.0
  - This release also renames all `pluginName` instances to `pluginId`. This affects all plugin types, but the core contains compatibility code so old currency plugins continue working (but not for rate or swap plugins, which are easier to just upgrade).
  - Breaking changes to the swap API:
    - Return a new `EdgeSwapResult` structure from `EdgeSwapQuote.approve`. This now contains the `destinationAddress` and `orderId` that used to exist on the `EdgeSwapQuote` type.
    - Merge the `EdgeSwapPluginQuote` and `EdgeSwapQuote` types into one.
      - The `EdgeSwapQuote.isEstimate` flag is no longer optional, but must be `true` or `false`.
      - Remove `EdgeSwapQuote.quoteUri`. Just concatenate `EdgeSwapInfo.orderUri` with `EdgeSwapResult.orderId` to get this.
    - Rename `EdgeSwapInfo.quoteUri` to `orderUri`.
    - Remove the deprecated `plugins` option from `EdgeSwapRequestOptions`.
  - Other breaking changes:
    - Remove deprecated `EdgeAccount.currencyTools`. Use `EdgeAccount.currencyConfig`.
    - Remove deprecated `EdgeAccount.exchangeTools`. Use `EdgeAccount.swapConfig`.
    - Remove deprecated `EdgeAccount.getExchangeQuote`. Use `EdgeAccount.fetchSwapQuote`.
    - Remove deprecated `EdgeAccount.pluginData`. Use `EdgeAccount.dataStore`.
    - Remove deprecated `EdgeIo.WebSocket`.

- Upgrade edge-exchange-plugins to v0.10.2
  - Add Switchain swap plugin.
  - Pass promo codes to Changelly, ChangeNow, and Godex.
  - Fix ChangeNow on Android & add better logging.

- Upgrade edge-currency-accountbased to v0.7.2
  - Add cleaners v0.2.0 type checking
  - Fix duplicate FIO address after registration
  - Reprioritize EOS Hyperion nodes to resolve transaction history view issue

- Upgrade edge-login-ui-rn to v0.6.9
  - Visual fixes to Password Recovery and 2FA

## 1.12.0 (2020-04-07)

- Add FIO - register address, send, and receive
- Added additional Banxa payment methods
- Fix missing XLM transaction history
- Move Exchange side menu button
- Remove countries from Simplex Sell
- Add FIO currency support
  - Includes new screens to view and register new FIO addresses
- Upgrade edge-currency-accountbased to v0.7.1
  - FIO currency
  - XLM transaction history fix
- Upgrade edge-core-js to v0.16.25
  - Prioritize swap providers with active promo codes.

## 1.11.10 (2020-04-01)

- Reduced Bits of Gold fees
- Expanded price tracking for ERC20 tokens
- Updated Totle plugin
- Enhanced deeplinking
- Bug fixes
- Upgrade edge-exchange-plugins to v0.9.2
  - Increases number of asset prices retrieved from CoinCap to 500
  - Upgrade Totle plugin to new API
- Refactor edgeProvider
  - Fix lockInputs and set default to true
  - Handle the case where both nativeAmount and exchangeAmount are missing in a spend target
- Deeplinking and GuiPlugin refactor
  - Disable GUI plugins based on promo setup.
  - Inject linking parameters into EdgeProvider
  - Pass promo codes to fiat plugins via EdgeProvider & optional query parameter
  - Link into plugins apart from Simplex
  - Improve flexibility of plugin data format

## 1.11.9 (2020-03-24)

- Switch from jsc-android to react-native-v8 to fix Samsung S7 device family crashes

## 1.11.8 (2020-03-24)

- Fix error message on Create Wallet caused by partially enabled FIO wallet

## 1.11.7 (2020-03-23)

- Bits of Gold support for Buy in Israel
- Add Metronome ERC20 token
- Bug fixes and visual improvements
- Add priority setting for exchange rate providers
- Fix white screen crash on settings screen
- Enhanced deeplink support
- Upgrade edge-login-ui-rn to v0.6.8
  - Added auto-scroll on terms and conditions screen
- Upgrade edge-currency-accountbased to v0.6.9
  - Add response error checking to fetch() calls
  - Fixed crash when Etherscan API returned text rather than a number by adding decimal and hex regex to response validation

## 1.11.6

- Added support for Cred

## 1.11.5

- Implement Greymass Fuel for EOS send
- Support buying with iDEAL in Netherlands through Banxa
- Exchange Settings now has an option to select Preferred Provider or Best Exchange Rate
- Visual and text updates
- Bug fixes

## 1.11.4

- New Visual Improvements
- Buy Crypto with ApplePay now supported in United States
- Automatically add recipient address in notes after a send transaction for easy viewing
- Improved wallet search
- Minor bug fixes

## 1.11.3

- Update BSV address to use 1 format
- Remove Bitcoin Cash prefix from BCH addresses
- Add ETHBNT as a default token
- Fixed BNB Syncing
- Fixed Wallet Picker to use the same wallet order from the Wallets List screen
- Visual and text improvements
- Minor bug fixes

## 1.11.2

- Fixed RSK synchronization
- Resolved delayed app notifications
- Fixed various wallet list display issues
- Enhanced ETH network performance

## 1.11.1

- Wallet list fixes
- Update Banxa GB

## 1.11.0

- Redesign of Wallet List and Transaction History screens
- Improved 2FA Background Notifications
- Safello - Sell
- Safello - Denmark region support added
- Safello - Additional payment method added for Sweden
- Support new DAI and SAI
- Other minor fixes

## 1.10.3

- FIO Registration URL update

## 1.10.2

- Improve EOS & Ethereum connectivity.
- Fix spends from large UFO & other non-Bitcoin wallets.
- Add visual indication for syncing wallets.
- Improve wallet selector search.
- Add Banxa GB support.

## 1.10.1

- Add KYC notices for Fox Exchange & CoinSwitch.
- Fix Tezos support.
- Fix Firebase tracking crash bug.

## 1.10.0

- Integration of Compound
- Settings Send Logs button
- Developer mode URI sticky will continue for all accounts on device of last URI entered
- Affiliate links
- Exchange Screen able to search wallet in wallet picker

## 1.9.8

- Emergency EOS fix (part 2)

## 1.9.7

- Emergency EOS fix
- Minor UX bug-fixes
- Minor Bity updates
- Remove uninhabited and non-sovereign locations

## 1.9.5

- Integrate RSK
- Request reviews in-app
- Re-work the custom fee UI

## 1.9.4

- Hot fix for Edge Login

## 1.9.3

- Improved notifications
- Integration of BNB
- Buy sell buttons separated

## 1.9.2

- Fix Tezos balance updating bug

## 1.9.1

- Fix DASH max fee issue
- Improve API transaction broadcasting reliability for Bitcoin-related coins
- Enable Tezos (XTZ)
- Add Anthem Gold (AGLD) as preferred token
- UI notification improvements

## 1.9.0

- Improved stability when coming in and out of background
- Integrate Safello for buying in Nordic countries and Europe
- Integrate Bits of Gold for selling to Israeli and European bank account
- Integrate CoinSwitch for swapping coins

## 1.8.3

- Add LibertyX plugin
- Add MoonPay plugin
- Fix EOS syncing issues
- Improve Bitcoin & related coins connection reliability

## 1.8.2

- Fix all-zero exchange rates

## 1.8.1

- Fix the minimum Android SDK version to 23+ (Android 6)

## 1.8.0

- React native upgrade + visual fixes
- Prefer fixed-rate quotes over estimates

## 1.6.0

- EOS support
- Implementing deep linking of bitcoin, ethereum, bitcoincash, dash, and edge URIs
- Add Wyre plugin to support buy/sell of Bitcoin and Ethereum from US bank account
- Add Chinese, Korean, French, and Vietnamese translations
- Add support for IMP and IRR fiat currencies

## 1.5.0

- Add Changenow as an exchange provider
- Use new colored currency icons
- Allow signin/singout of ShapeShift via Settings screen

## 1.4.5

- Update to v2 of Coinbase API

## 1.4.3

- Big performance boost when logging in and syncing wallets
- Add support for Monero bulletproofs which fixes Monero spending
- Allow users to enable/disable exchange providers
- Fix occasional Token is not supported error in Exchange screen
- Enable viewing xpub for more currencies
- Fix crash on large accounts when tapping top right menu button immediately after login
- Fix hang when using Simplex from some Android devices

## 1.4.2

- Fix Shapeshift account error dropdown
- Fix oversized exchange button when going back from confirmation
- Fix missing email text field for password recovery setup
- Fix tappability of wallet list option button

## 1.4.1

- Fix Shapeshift activation when using Google Login
- Fix incorrect fiat amounts when exchange ERC20 tokens
- Fix query to Shapeshift authentication on Android devices

## 1.4.0

- Support Changelly.com in Exchange functionality
- Support for Stellar (XLM)
- Add ability to select custom nodes for Bitcoin and similar currencies
- Support for ShapeShift membership
- Add Spanish, Italian, and Russian translations
- Implement device size based UI scaling

## 1.3.4

- Fix Payment Protocol support on Android
- Change DGB P2SH address to S address
- Prevent TouchID button from being tapped after login
- Prevent create wallet button Done button from being tapped multiple times
- Fix white screen hang upon login if an incoming transaction happens
- Implement new modal manager
- Fix React error that FlatList key is not a string
- Fix address wrapping in Simplex plugin
- Fix horizontal gap in Android transaction list
- Fix horizontal gap in Android wallet list
- Fix double tap bug on Change Password modal
- Change Redux actions to use Flow types instead of action creators

edge-login-ui:

- Add scaling to login screen
- Add popup of 2FA reset request warning for all accounts on device

edge-currency-bitcoin:

- Add eboost
- Fix Payment Protocol support on Android

## 1.3.3

- Fix BIP70 support for Bitcoin Cash
- Change warning text when doing Edge Login to full access application
- Add XMR/XRP PaymentID/Destination Tag button to Send Confirmation screen
- Show 2FA reset warning as soon as app launches for all accounts on device
- Speed up logins by moving 2FA reset check to background
- Add device size font/button scaling to create account screens
- Show denomination when getting max amount error at exchange screen
- Update to React Native 0.55
- Fix crash when user taps on incoming funds dropdown
- Fix editing of fiat amount in transaction details if using foreign locale
- Add Terms of Service menu button

## 1.3.0

- Add support for ERC20 Tether, Digibyte, Bitcoin Gold, and Vertcoin
- Support buying Litecoin with credit card
- Add toggle to show fiat balances of wallets in Wallet List screen
- Add per transaction PIN spending limits
- Show transaction/event history of Simplex transactions
- Fix occasional error popup on login/logout
- Add onboarding screens for new accounts
- Fix QBO file format bugs causing errored imports
- Fix persistence of category field in transaction details
- Switch to Bugsnag for crash reporting
- Fix sweeping private keys for several currencies
- Fix slow max spend for several currencies
- Fix Cancel of sweeping private key not re-enabling scanner
- Fix several crashes
- Add cards to empty LTC, BTC, ETH, and BCH wallets to show user link to buy with credit card
- Do not show No Amount Specified error when user first scans Monero/XRP QR codes

## 1.2.4

- Add BIP70 support
- Change password reminder logic to step off twice as quickly after correct password
- Fix mint progress bar to be on top of blue region
- Remove IMP fiat currency since we don't have exchange rates for it
- Make show account balance toggle persistent
- Make progress bar start at about 10%
- Change settings for password recovery to show Setup Password Recovery
- Fix dropdown for iPhone X

edge-currency-bitcoin:

- BIP70
- Fix sweeping private keys for QTUM, DASH, LTC, FTC, XZC
- Rename UFO Coin -> UFO

edge-currency-ethereum:

- Update REP contract address

edge-currency-ripple:

- Switch currency name to XRP
- Update block explorer

## 1.2.3

- Bump Monero library 0.0.8
- Check for errors in encodeUri from invalid addresses
- Poll Edge Core for new QR code address if current public address is invalid

## 1.2.2

- Fix bugs with QBO/CSV export
- Add support for uniqueIdentifer (XRP destination tag / Monero payment ID)

## 1.2.1

- Support to hold, send, and receive Monero (XMR)
- Support to hold, send, and receive Ripple (XRP)
- Support for buying and selling Bitcoin using credit card via Simplex integration
- Ability to sweep private keys for Bitcoin, Bitcoin Cash, Litecoin, and Dash.
- Add side menu buttons for send/scan, request, exchange, buy, and sweep
- Remove Share button for view master private key modal
- Change progress bar to horizontally animated line
- Show more decimal places for fiat amounts if needed
- Make entire transaction notes tappable
- Fix Shapeshift order logic to prevent errors and speed up response
- Performance optimizations
- Add tracking of referral link used for install
- App behavior modification per referral link
- Export transaction history to CSV and Quickbooks (QBO) files
- Ability to restore deleted wallets

## 1.1.3

- Add links to ShapeShift order ID in transaction notes field
- Fix errors when switching wallets in Exchange screen
- Change Ethereum add-token URI format to `token-info`

edge-currency-bitcoin:

- Fix timeout errors on iOS due to react-native-tcp
- Improve Electrum server selection
- Improve spending reliability by broadcasting to API services as well as Electrum nodes

## 1.1.2

- Improve performance when selecting a wallet with lots of transactions
- Add support for FTC and XZC blockchains
- Add support for HUR and IND ERC20 tokens
- Utilize ShapeShift “precise” orders for accurate receive amounts
- Add progress indicator for wallet syncing transactions from network
- Fix token still appearing when custom token is deleted
- Use ‘bits’ as the default BTC and BCH denomination for new accounts
- Add ability to scan QR code to add custom token

edge-exchange-plugins

- Add CoinCap as an exchange rate source to cover more coins and tokens

edge-currency-bitcoin:

- Fix persistent timeout errors when sending LTC, BCH, BTC, and Dash

## 1.0.9

- Add BCH to default wallets for new accounts
- Fix hang for offline login
- Enable landscape mode for iOS tablets
- Fix rendering issues in landscape mode

edge-currency-bitcoin:

- Improve networking code to save server status/states more often. Fixes LTC connectivity issues

edge-core-js

- Remove dropped transactions from being reported to GUI

## 1.0.8

- Fix unconfirmed transactions having incorrect date
- Fix incorrect sort order of unconfirmed transactions
- Fix Request screen Copy button when using legacy addresses for BCH/LTC

## 1.0.7

- Significantly improved performance for accounts with large wallets
- Fix occasional crash when uploading logs
- Reduce disk storage requirements for app logs
- Allow displaying of legacy address formats for BCH and LTC
- Use new popup menu library to fix offscreen visibility issues
- Dynamic check of token availability from ShapeShift
- Change wording in wallet option popup
- Change styling of side menu drawer
- Only ask for Contacts permission when needed
- Dynamically size transaction details notes field
- Fix editing fiat value in transation details

edge-currency-ethereum:

- Allow Ethereum token currency codes to be 2-7 characters instead of 3-5
- Allow mixed case Ethereum token contract addresses
- Fix corrupt nativeAmount for some token transactions (ie. EOS)
- Show error when spending a Ethereum token when not enough ETH is available
- Dynamically set gas price using ethgasstation.info

edge-core-js:

- Fix account and wallet data sync while logged in
- Fix corrupt fiat amount in transactions to prevent GUI from crashing
- Improve error handling of TCP connection failures

## 1.0.6

- Fix crash on startup for Samsung Note 8 (update edge-login-ui-rn)
- Fix crash on login and signup on some Android devices (update react-native-fast-crypto)
- Fix missing popup on login when 2FA reset was requested
- Change custom Ethereum gas price to use GWei

## 1.0.5

- Improve handling of failed connection to blockchain nodes

## 1.0.4

- Fix Wallet List dropdown selector on iPhone X
- Use correct Bitcoin Cash logo

## 1.0.3

Improvements

- Add more info to Contact permission popup on use of Contacts information
- Make new Litecoin, Dash, and Bitcoin Cash wallets default to BIP44 mnemonic seeds

Fixes

- Minimize network requests on exchange screen
- Fix input corruption on Exchange screen
- Fix mining fee and max spend on exchange screen
- Fix PIN changes from Settings screen
- Properly show newly added custom tokens
- Make Ethereum spends more reliable
- Fix numeric entry on different locale numpads
- Fix exchange screen to provide spinner feedback while getting order
- Prevent spends to addresses of different format. Ie. LTC to BTC
