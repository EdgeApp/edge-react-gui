# edge-react-gui

## Unreleased

- added: Support for Universal and App Links
- added: A post-install survey asking users how they discovered the app
- added: Support for splitting LTC to BTC wallets for recovering BTC erroneously sent to an LTC address
- added: "Force Light Account Creation" developer mode setting
- added: Allow promoCards to send promoCodes to fiat partners for special pricing
- added: Allow promoCard URLs to specify a currency pluginId to have replaced with a public address
- added: Rango Exchange DEX aggregator support
- added: A spinner next to the total balance to indicate syncing
- changed: Prefer DEX estimate quotes over CEX fixed rate quotes if the DEX quote has a better rate
- changed: Light account backup notification card now persists no matter what while logged in to a light account
- changed: Replaced 'react-native-camera' with 'react-native-vision-camera'
- changed: WalletConnect: Move initial wallet selection to connections list scene
- fixed: Fix for negative total balance due to small numbers and scientific notation
- fixed: Stabilize the account sync bar progress motion.
- fixed: Update Algorand's WalletConnectv2 reference
- fixed: Slight animation stutter when opening the CountryListModal
- fixed: Account-level Default Fiat setting not being correctly used in Markets View Scenes
- fixed: Changing Default Fiat setting does not properly refresh CoinRankingDetailsScene
- fixed: Possible for keyboard to cover input fields in some Android WebViews
- fixed: Call the correct method when rejecting a WalletConnect session
- fixed: "Exchange Rates Loading..." not showing in the balance card
- removed: Wallet-specific fiat currency setting. Account-wide fiat currency setting is now used for app-wide fiat calculation and display

## 4.8.0

- added: "IP Validation Protection Enabled" bottom notification card
- added: useAsyncNavigation hook to prevent duplicate navigation calls
- added: Dynamic height for multiline text inputs
- added: Sentry SDK for crash reporting
- added: Gas requirement warnings for more UX flows
- added: Mainnet code appended to assets in exchange details modal
- changed: Some red Airship alerts deemed unecessary are now hidden from production builds
- changed: Add EUID to Simplex quoting API calls
- changed: Velodrome, cemetery, and masonry staking polcies - insufficient balance errors reduced severity to untracked warnings
- changed: Distinction between disabled and paused wallets
- changed: Wallet menu modal item ordering for "Split Wallet"
- changed: Enable `keysOnlyMode` for Telos
- changed: Increase iOS minimum to 15.6
- fixed: Buy/Sell Scene briefly changes title after selecting payment method if an asset was pre-selected via the "Trade" modal
- fixed: Android Auto Log Off "Disabled" text color
- fixed: Android Auto Log Off "Disabled" selection showing as "0"
- fixed: WalletConnect Smart Contract Call details cut off
- fixed: Buy/Sell Scenes header underline not fully extending to the right
- fixed: Quickly spamming taps on certain buttons resulted in duplicate actions
- fixed: Banxa error due to API removing params
- removed: Bugsnag for crash reporting
- removed: Firebase/Google Analytics
- removed: Light Account Backup Modal A/B/C/D test experiment

## 4.7.0 (2024-05-31)

- added: Add Visa/MC buy support with Paybis
- added: New Asset Setting to manually enable tokens with detected balances across all wallets
- added: MUTE_CONSOLE_OUTPUT environment variable to disable specific console output functions
- added: Performance logging with app start-up time and login time as initial performance metrics
- added: Support geo filtering for "Learn" blog cards on the Home Scene
- changed: (WalletConnect) Handle sessions with 0 required namespaces
- changed: Consistent light account backup modal UI
- changed: Currency icon now shown in wallet picker button in Swap and Transaction List scenes
- changed: Transaction List Scene displays wallet name in title
- changed: Consistent light account backup modal UI
- changed: Consistent margins for modal text inputs
- changed: Remove Florida from Kado support
- fixed: Various React Native debug warnings
- removed: Bitpay deeplink support
- removed: Side menu footer close button
- removed: Disable Piratechain (iOS only)

## 4.6.0 (2024-05-13)

- added: Done button is a part of SimpleTextInput
- added: Ability to add a custom token for any wallet directly from CreateWalletSelectCryptoScene
- added: Ability to migrate during the wallet import flow
- added: Show toast message when there's no provider for buy/sell in selected region
- changed: Better send error message for insufficient gas
- changed: Upgrade to React Native v0.73.6
- changed: "Split" wallet menu options consolidated into one
- changed: Paybis implementation to use SHA signatures and oneTimeToken
- changed: Increase opacity in wallet list gradient for better visibility
- changed: Buy/Sell no longer requires wallet selection when accessing via a wallet's Trade menu
- changed: Enable Moonpay for Louisiana
- fixed: FilledTextInput multi line style squished
- fixed: Swap transactions always showing as received when viewing source asset
- fixed: Swap quote amounts hidden if balances set to hidden in Transaction List
- fixed: Possible to see receive address for a wallet requiring activation when creating the wallet from search
- fixed: Glitch on transaction list scene when starting search
- fixed: Properly set default buy/sell fiat amount for non-USD wallets
- removed: 'X' button on modals
- removed: Hedera account purchases

## 4.5.0 (2024-04-24)

- added: More descriptive 504 transaction failure error message
- added: New `Text`-based components
- added: Light account backup modal text experiments
- added: "Parent Wallet" section when changing wallet from Transaction List while viewing a token
- added: Sell-to-debit support in Europe
- changed: Replace `ModalMessage` with `Paragraph`
- changed: Improved wallet sync indicator bar on top of screen
- changed: Allow light accounts to buy up to $50 worth of crypto at a time
- fixed: Plaid bank linking with Kado
- fixed: Remove red error when deep linking into Edge with no URL path
- fixed: Unstaking tokens from Thorchain savers
- removed: USPs a/b/c/d test experiment - always uses default USPs

## 4.4.0 (2024-04-09)

- added: Add Cardano (ADA)
- added: Add auto-detected tokens section in ManageTokensScene
- added: Display "failed" status for confirmed, but failed, transactions
- changed: Buttons for receive/send/earn/trade in Transaction List Scene
- changed: Renamed analytics parameter "dollarConversionValue" to "dollarRevenue"
- fixed: Reporting negative conversion values
- fixed: Filecoin sync issue caused by missing and necessary GLIF API key
- fixed: FIO handle/domain registration error with MATIC payment
- fixed: Fix duplicate transactions bug and re-enable transaction support in Filecoin FEVM
- fixed: 'tokenId' related crash on Send scene under certain conditions
- fixed: Properly show the Thorchain Savers unstake amount including earned amt
- fixed: Disable RBF for Thorchain Savers transactions
- fixed: Xcode 15 builds. Remove Flipper as it is deprecated anyway
- fixed: Light account reporting

## 4.3.0 (2024-03-25)

- added: Wrapped Touchable\* components to consolidate tap debounce logic
- added: Mt Pelerin for SEPA and Faster Payments
- added: Setting to change default screen on login
- changed: Remove extra spaces and normal capitalization of mnemonic seed input
- changed: 2FA/otp modals moved behind a notification card instead of showing instantly on login
- changed: Password reminder modal only shows after tapping new persistent notification
- changed: Move wallet activation redux values to scenes
- changed: Button width remains constant regardless of content visibility
- changed: Certain deeplinks blocked for light accounts
- changed: 'Sweep Private Key' usage blocked for light accounts
- fixed: FIO name transfer error when sending with no address
- fixed: Bottom notification cards sometimes covering parts of the scene
- fixed: Successfully upload logs, even if a wallet has errors.
- fixed: Wallet picker modal requiring multiple taps to select if keyboard was open

## 4.2.0 (2024-03-12)

- added: Notification status analytics param
- added: @bugsnag/react-native-performance
- added: New deeplink types: 'scene' and 'modal'
- added: 'Fund Your Account' modal
- added: Cosmos IBC transfer plugin
- added: Have users select US state and filter fiat providers by state/province
- changed: Remove extra spaces and normal capitalization of mnemonic seed input
- changed: Allow routing to Receive Scene without visible addresses for light
  accounts
- fixed: Some text inputs not selectable for some Samsung devices
- fixed: Various small visual fixes
- fixed: Improve login performance by only loading account referral info for new accounts
- fixed: Android text fields not hiding text for certain secure fields

## 4.1.1 (2024-02-29)

- fixed: Correctly create and import non-segwit wallets in bip-44 mode.

## 4.1.0 (2024-02-27)

- added: FIO conversion analytics events.
- added: Referral information on all analytics events.
- added: Sell to debit card for UK and AU
- added: ACH buy/sell through Kado
- added: Arbitrum One network support
- added: Base network support
- added: Cosmos Hub (ATOM) support
- added: Axelar (AXL) support
- added: Add WalletConnect support for Cosmos-based chains
- changed: Replace A/B test 'legacyLanding' with A/B/C/D test 'landingType'
- changed: Animate buy/sell scenes
- changed: Require Android 9 or above.
- changed: Reword of the CrashScene to help users to force close (not uninstall) Edge
- changed: Updated swipe-able underlay elements for wallet list rows to match UI4
- changed: Upgrade to Android NDK version 26.1.10909125.
- changed: Re-enable fake signup captcha experiment at 50%
- changed: Adjust Transaction List Scene spacings, remove "Transactions" header
- changed: Add a referral ID to share links
- changed: Use `EdgeAsset` for defaultWallets in app config
- fixed: Fix button placement on wallet activation scene
- fixed: Resolved levitating search bar bug on Android
- fixed: Show a useful, localized error message when device doesn't have an email account
- fixed: Make FilledTextInputs take up constant vertical space
- fixed: Send Recipient Address Modal styling when saved recipients are shown
- fixed: Minor Transaction List spacing adjustments
- fixed: Insufficient Funds error in Thorchain unstaking
- removed: swipeLastUsp experiment (always allow swipes on the last USP)

## 4.0.3 (2024-02-15)

- changed: (FIO) Use a backup balance method for accounts affected by unstake chain data issue
- fixed: Some text inputs not selectable for some Samsung devices

## 4.0.2 (2024-02-13)

- fixed: CAPTCHA image was not draggable on Android.

## 4.0.1 (2024-02-04)

- fixed: Missing background blurred dots on most scenes
- fixed: Missing promo cards when multiple are on info server
- fixed: Hidden Next button on Change PIN scene
- fixed: Disable auto-capitalization of username when creating account

## 4.0.0 (2024-02-02)

- added: `minerTip` to `feeRateUsed` processing
- added: Make the alert drop-down swipeable.
- added: Multi output payments for UTXO currencies
- changed: Update various scenes with UI4 components
- changed: Light account re-enabled at 50% distribution
- changed: Block Buy/Sell/Receive for Light Accounts
- changed: Free FIO handle modal visual design
- changed: New dynamic menu tabs that responds to scene scroll
- changed: New dynamic search drawer above tabs for wallet list, transaction list, and markets list
- changed: Scene layout to support transparent and blurred header and tab-bar
- changed: Bity and Paybis plugins to use EdgeTxAction for sell transactions
- changed: Do not write tx.metadata in fiat sell transactions
- changed: Use new EdgeTransaction.savedAction to show extended transaction info in tx list and tx details
- changed: Use new EdgeTxAction data for Thorchain and Tron stake plugins
- changed: Make useAsyncEffect tags required
- changed: Rettry failed WalletConnect initializations
- changed: Disable RBF for payment protocol transactions
- changed: Show insufficient funds error when sweeping a key that cannot afford the transaction fee
- changed: Add proper error message for sweeping keys that don't contain enough funds to cover transaction fee
- changed: Update GettingStartedScene images and colors
- fixed: Fix the Android date picker appearance in dark mode
- fixed: USP vs legacy landing experiment distribution
- fixed: Paybis sell from Tron USDT
- fixed: Remove `minWidth` style from stake option card
- fixed: Send scene no-longer accesses clipboard immediately
- fixed: Update Glif Pool APY information endpoints to resolve error message
- fixed: Don't pass pendingTxs with spendInfo in migrate flow
- fixed: Fixed title and message handling in AssetStatusCard
- fixed: (dev mode) Copy private seed
- removed: Deposit/Send footer buttons in Wallet/Asset List Scene
- removed: Unused special currency constants

## 3.23.4 (2024-01-30)

- added: Added 5x leverage Tarot Finance pools

## 3.23.3 (2024-01-09)

- fixed: ETC spend error regression caused by EIP-1559 upgrade in EthereumEngine
- fixed: Update Glif Pool APY information endpoints to resolve error message

## 3.23.2 (2024-01-03)

- fixed: Spend regression for non-EIP-1559 transactions

## 3.23.1 (2023-12-22)

- fixed: Paybis sell from Tron USDT
- fixed: Fix accelerate for EIP-1559 transactions

## 3.23.0 (2023-12-20)

- added: Automatically enable tokens with balances
- added: Add Pokt RPCs as option for Fantom
- added: GLIF Infinity Pool staking plugin for Filecoin FEVM currency
- added: New FilledTextInput component
- added: New SimpleTextInput component
- added: Support for Thorchain Savers EVM token deposits
- added: Transaction support for zkSync
- added: Add Solana init options
- added: BSC staking on Thorchain Savers
- added: Ability to clear datastore of fiat providers
- added: 'numAccounts' tracking parameter to report number of locally saved accounts
- added: Ethereum support through Paybis
- changed: USP/Legacy Landing probability set to 50/50
- changed: Use memos for Thorchain Savers withdrawals
- changed: Allow wallet creation in WalletConnect wallet picker
- changed: Improve transition to stake overview scene with preloaded data
- changed: Remove warning dropdown if stake positions fail to load
- changed: 'Create Account' button text always set to "Get Started"
- changed: Token management scene now always sorts enabled tokens on top
- fixed: Various margin styling alignments
- fixed: Long delay updating exchange rates after login
- fixed: Unable to claim unstaked TRX funds in some circumstances
- fixed: Fix duplicate keys in `StakeOverviewScene` allocations list
- fixed: Do not count paused wallets for progress ratio
- fixed: ENS name resolution intermittently failing
- fixed: Error on exchange details from RUNE swaps
- fixed: Remove `minWidth` style from stake option card
- removed: Staking on Fantom

## 3.22.0 (2023-11-26)

- added: Support for Thorchain Savers EVM token deposits
- added: Add THORChain (RUNE)
- added: Posthog analytics support
- added: New 'Lower Send Amount' warning for transaction acceleration
- added: Allow buy/sell plugins local override and info server patching
- changed: Use memos for Thorchain Savers withdrawals
- changed: Disable max-spend for Filecoin wallets
- changed: Disabled signupCaptcha experiment
- changed: Don't show recovery, password, or otp reminders in Maestro
- changed: Disable light accounts temporarily for this release
- fixed: Incorrectly filtering out transactions due to spam/dust filter
- fixed: Performance issue from LoanManagerService running while not in beta
  mode
- fixed: isFirstOpen analytics param reporting the previously saved value
  instead of forcing to false after first open
- fixed: Support for stablecoins in Paybis sell to debit card

## 3.21.1 (2023-11-15)

- fixed: Use allowsInlineMediaPlayback for webview to fix KYC widgets

## 3.21.0 (2023-11-07)

- added: Paybis buy/sell in Brazil, Columbia, and Mexico
- added: EdgeTxAction information to Transaction List
- added: "Paused Wallet" visual indicator on wallet list
- added: Paybis sell to debit card
- added: Signup captcha experiment.
- added: Re-enable Faster Payments buy support
- changed: Change FlipInput styling to make the edit functionality more obvious
- changed: Enable max spend for Filecoin
- changed: Move asset-specific settings into their own settings page
- changed: Experiment config probability distribution support percentage based values
- changed: Added border to Promo Card
- fixed: Write updated experiment configs to disk
- fixed: Auto Logoff picker text color for Android Light OS theme
- fixed: Fallback language selection for Asset Status Card
- fixed: Version-specific targetting for Asset Status Card
- removed: Moonpay sell via ACH
- removed: Banxa buy via Pix

## 3.20.0 (2023-10-20)

- added: Banxa purchase with iDEAL
- added: Asset status card to remotely communicate known issues or important info
- added: Paybis buy with credit card
- added: Support Zcash Spend Before Sync
- added: Zcash transparent funds autoshielding
- changed: 'legacyLanding' experiment config set to 0% probability
- changed: Banxa sell to use new widget
- changed: Replace deprecated memo handling with `EdgeMemo` in SendScene2
- changed: Re-enable Piratechain
- changed: Remove price-change push notification subscriptions for keys-only currencies
- changed: Support Zcash Unified Addresses
- fixed: Crash in react-native-linear-gradient when app built with Xcode 15
- Upgrade edge-core-js to v1.9.0
  - added: Support optimized login syncing, checking to see if our credentials are up-to-date before performing a periodic login.
  - added: Export cleaners for server types and testing data types.
  - deprecated: EdgeContext.listRecoveryQuestionChoices. The GUI provides its own localized strings now.
- Upgrade edge-currency-accountbased to v2.7.2
  - added: Add deprecated memoType to zcashInfo for backwards compatibility
  - added: Add Zcash autoshield support
  - added: EdgeTxAction tagging to TRX freeze/unfreeze contract call transactions
  - added: Support for importing XLM wallets via 12/24-word mnemonic seed phrase
  - changed: Update address explorer url (Zcash)
  - changed: Upgrade react-native-piratechain to v0.4.0
  - changed: Upgrade react-native-zcash to v0.6.2
  - changed: Use Zcash types directly from react-native-zcash
  - fixed: Account for possible 0-date transaction listerner race-condition
  - fixed: Filecoin returns a more stable spendable balance from getMaxSpendable
  - fixed: More accurate Filecoin fee estimation for makeSpend
  - fixed: Set synchronizer to null in killEngine so it can be properly restarted (Zcash)
- Upgrade edge-exchange-plugins to v0.21.11
  - added: Enable Zcash receiving on Godex
  - changed: Restrict ChangeHero trading to whitelisted plugins
  - changed: Replace deprecated currency codes in SwapCurrencyError with requests

## 3.19.0 (2023-10-06)

- added: env.json experiment config override
- added: Experiment config for "Create Account" and "Login" button labels
- added: Experiment config support between gui and login-ui
- added: Toast message when pausing or unpausing wallets
- changed: Always show gas warning when enabling tokens
- changed: Dynamically determine supported Thorchain Savers assets
- changed: Include stake plugin display name in error message on transaction list scene
- changed: Rename on-chain "Note" or "Memo" to "Transaction Note" or "Transaction Memo"
- changed: Replace text 'plugins' with 'providers' in Buy/Sell
- changed: Tweak the boot background color on Android.
- fixed: Deposit/Send footer buttons for native currencies
- fixed: Do not error when recording sends to FIO addresses.
- fixed: Error showing in some cases during auto logout
- fixed: Extra close (x) button on FIO modal
- fixed: Incorrect wording when disabling a token
- fixed: Min/max price label position on the Markets charts
- fixed: Possible balance text overflow in Receive scene
- fixed: Prevent setting invalid spending limits
- fixed: Send all event tracking params to logging servers
- fixed: Stuck showToastSpinner never going away
- fixed: Turning off 'Dark Mode' causes crash
- removed: 'Add/Edit Tokens" option for token rows

## 3.18.0 (2023-09-22)

- added: Velodrome v2 staking poolsdded: Display memos in transaction details scene
- added: Buy PEPE from Simplex
- added: Add ability to launch webview from tab row
- added: Implement "first open" tracking param
- changed: Migrate auto logout modal and wallet activation scene sway from legacy visuals
- changed: Show yield type for Velodrome staking pools
- changed: Add stake plugin name to thrown error messages
- changed: Display network name next to token in wallet create rows
- changed: Show amounts in selected display denomination in FIO Requests scene
- changed: Upgrade react-native-zcash to v0.5.0
- changed: Set minimum supported iOS version to 13
- changed: Set minimum supported Android version to 8.1
- changed: Enable keysOnlyMode for Piratechain
- fixed: Cleanup src/modules files and settings
- fixed: Prevent saving spending limits with no amount
- fixed: Bitwave CSV export fields
- fixed: Blank space at bottom of txdetails
- fixed: Save new categories on row tap
- fixed: Set word capitalization on category entry
- fixed: Align TX Details notes entry to top of OutlineTextInput
- fixed: Set returnKeyType of Notes entry to "return"
- fixed: Crash entering spending limits settings
- Upgrade edge-core-js to v1.7.0
  - added: Add a ChallengeError and related types, which will allow the login server to request CAPTCHA validation.
  - added: Currency-info support for multiple memos per transaction.
  - added: EdgeCurrencyInfo.memoOptions, lists acceptable memo types.
  - added: EdgeCurrencyInfo.multipleMemos, set if a currency supports multiple memos in the same transaction.
  - added: Spending support for multiple memos.
  - added: EdgeSpendInfo.memos
  - added: Transaction history support for on-chain memos.
  - added: EdgeTransaction.memos
  - added: New infoServer and syncServer options for EdgeContextOptions
  - deprecated: EdgeCurrencyInfo.memoMaxLength
  - deprecated: EdgeCurrencyInfo.memoMaxValue
  - deprecated: EdgeCurrencyInfo.memoType. Note: If it is not set correctly, legacy plugins will no longer receive memos. Some buggy plugins forgot to do this, so those plugins will stop receiving memos. This is not a breaking change, though, since this field was always mandatory.
  - deprecated: EdgeSpendTarget.memo
  - deprecated: EdgeTransaction.spendTargets.memo
  - fixed: Correctly pass EdgeSpendTarget.memos through to currency plugins.
  - fixed: Do not let EdgeTransaction.memos be undefined, even for legacy plugins.
  - fixed: Restore "0x" prefix support for legacy hex memos.
- Upgrade edge-currency-accountbased to v2.5.2
  - added: Support the latest core memo API's.
  - changed: Update Zcash address explorer
  - changed: Remove the maximum memo length on Tron
  - changed: Upgrade react-native-zcash to v0.5.0
  - changed: Update Zcash address explorer
  - changed: Update react-native-zcash to v0.4.2
  - changed: Upgrade react-native-zcash to v0.4.1 changed: Split Zcash and Piratechain into their own engines and tools changed: Update Pulsechain explorer URL removed: Disabled all Piratechain synchronizer functionality. This is a temporary removal due to incompatibility between latest react-native-zcash and react-native-piratechain. Engine will still load but it only useful for retrieving private keys.
  - removed: Temporarily disable non-functionaly zcash memos, pending an updated SDK with correct fee math.
  - fixed: Rename Tron memos to "note".
  - fixed: Use EdgeMemo for WalletConnect data payloads
  - fixed: Do not crash if BigInt is not present
  - fixed: Block Filecoin when BigInt is not present
  - fixed: Fixed Zcash transaction memos array handling
  - fixed: Add 0x prefix to EVM data created outside the engine
  - fixed: Roundup fee nativeAmount returned from L1 so it is an integer
- Upgrade edge-currency-plugins to v2.2.1
  - added: Dynamic fudge factors for UTXO fees
  - added: Support the latest core memo API's.
- Upgrade edge-exchange-plugins to v0.21.6
  - changed: Move EVM data from spendTarget otherParams to memo
  - fixed: `gasLimit`` param typo
- Upgrade edge-login-ui-rn to v2.11.1
  - added: Show a CAPTCHA modal when the core returns a ChallengeError for password login.
  - changed: Update translations
  - removed: Redundant recovery question
  - changed: Remove the Account Review Scene from Light Account creation flow
  - fixed: Clean up error handling, particularly for incorrect CAPTCHA solutions.
  - fixed: Remove visual glitches in the CAPTCHA modal.
  - fixed: Testability of "Enter Backup Code" modal tile

## 3.17.3 (2023-09-21)

- fixed: Allow the app to log in again on older OS's (iOS 12.4 and Android 7).

## 3.17.2 (2023-09-15)

- Upgrade edge-currency-plugins to v2.1.1
  - added: Dynamic fudge factors for UTXO fees

## 3.17.1 (2023-09-15)

- Upgrade edge-exchange-plugins to v0.21.5
  - fixed: Fix 'to' quotes in Thorchain using incorrect denomination

## 3.17.0 (2023-09-11)

- added: Add Filecoin support
- added: Add Liberland Dollars (LLD) and Merits (LLM) support
- added: Add BUSD, PAXG, and PYUSD tokens
- added: Add disableSwaps option to app config
- added: Export Bitwave format CSV
- added: Tracking event for "Already have an account? Sign-in" tap
- added: Tracking event for logins
- changed: Modal UI adjustments
- changed: Show date in swap transaction notes
- changed: Allow custom tokens to overwrite built-in tokens
- changed: Show warning when user overrides a built-in token with a custom token
- changed: When sending to a FIO address, and something goes wrong on the FIO chain, don't show the send itself as having failed
- fixed: Send scene crash due to null spending limits
- fixed: Blank space at bottom of txdetails
- fixed: Save new categories on row tap
- fixed: Set word capitalization on category entry
- fixed: Align TX Details notes entry to top of OutlineTextInput
- fixed: Set returnKeyType of Notes entry to "return"
- fixed: Crash entering spending limits settings
- fixed: Updated translations
- fixed: Various text and visual improvements
- removed: Deprecate new BSV wallet creation
- Upgrade edge-currency-accountbased to v2.2.4
  - added: USDT token to Avalanche
  - added: PYUSD token to Ethereum
  - added: Integrate Filfox for Filecoin transaction scanning
  - added: Add new ETH tokens ARB, BUSD, and PAXG
  - added: Add new BSC token BUSD
  - added: Add new RPC server, Pocket Network
  - changed: Use Filfox exclusively for Filecoin transaction querying
  - changed: Revert usage of queryMulti in Polkadot engine balance query
  - changed: Use separate code path for calculating token max spendable (Polkadot)
  - changed: Allow user to spend entire token balance (Polkadot)
  - changed: Add early exit to transaction query (Polkadot)
  - changed: Parameterize apikey replacement in node urls and remove url-specific apikey logic in engines
  - fixed: Bug prevent Filecoin spend transactions from being saved in the wallet (by saveTx)
  - fixed: Filecoin network fee query issue
  - fixed: Incorrectly identifying send-to-self transactions as receives from the network
  - fixed: Use Filscan as the block explorer for Filecoin
  - fixed: Used correct balance in when sending tokens (Polkadot)
  - fixed: Update Liberland length fee cost
  - fixed: Skip Liberland transaction history query if subscan url isn't present
  - fixed: Correctly report transaction history query status for new empty Filecoin wallets
- Upgrade edge-exchange-plugins to v0.21.4
  - fixed: Uniswap plugin uses backup gasLimit in case estimateGas fails
  - fixed: Thorchain failed quotes from ETH>BTC
  - changed: Use RPC gas estimates for Uniswap plugin
  - fixed: Separate Thorchain volatility spreads between streaming and non-streaming
- Upgrade edge-login-ui-rn to v2.8.1
  - fixed: Always show the username in PIN login scene

## 3.16.0 (2023-08-28)

- added: New swap provider XRP Decentralized Exchange
- added: AXL wrapped tokens on Fantom
- added: Support spending to Taproot bech32m addresses
- added: Allow user to update permissions in-app
- added: Monero custom node support
- added: Cancel button to exchange quote processing scene
- changed: Overhauled side menu and help modal UI
- changed: Update AAVE BTC->WBTC swap minimums
- changed: Replace Moonpay logo
- removed: Disabled ETC transaction history
- removed: Removed navigation buttons from new account wallet creation scene
- fixed: Prevent crash when entering Markets scene
- Upgrade edge-core-js to v1.4.1
  - changed: Reduced YAOB throttle to 50ms and apply throttle to return bridge calls
  - added: canBePartial and maxFulfillmentSeconds to EdgeSwapQuote
  - added: skipBlockHeight config option
  - changed: Throttle the react-native bridge to 500ms. This will create some lag, but should improve overall performance.
  - changed: Move the Android namespace definition out of the AndroidMaifest.xml and into the build.gradle file.
- Upgrade edge-currency-accountbased to v1.5.2
  - fixed: Correctly parse more types of Ripple transactions, including DEX transactions.
  - changed: Removed blockscout API server from ETC info (disabling transaction list retrieval)
  - added: Support for XRP OfferCreate txs
  - added: Fantom tokens listed on Axelarscan (AXLUSDC, AXLUSDT, AXLETH, AXLWBTC)
  - Fixed: Bug in FIO causing missing historical transactions (first page of transactions).
  - Fixed: Improve FIO transaction history fetching from history nodes by using the nodes with the highest action sequence number.
- Upgrade edge-currency-monero to v1.1.1
  - fixed: Fixed address transaction cleaner broken for wallets with no transaction history.
  - added: Support custom servers via enableCustomServers and moneroLightwalletServer user settings.
- Upgrade edge-currency-plugins to v2.1.0
  - Changed: Upgraded AltcoinJS to first published version based on BitcoinJS v6.1.3
  - Added: Support for pay-to-taproot address support (P2TR) for Bitcoin wallets.
- Upgrade edge-exchange-plugins to v0.20.2
  - Fixed: XRP DEX max swaps
  - Fixed: LI.FI on-chain transactions no longer revert due to missing bridge fees
  - added: XRP DEX support (Requires minimum of edge-currency-accountbased 1.5.0)
- Upgrade edge-login-ui-rn to v2.7.0
  - added: Tracking event for logins
  - changed: Update translations

## 3.15.0 (2023-08-11)

- added: simplified Maestro scripts and use cleaner-config for testerConfig.json
- changed: updated style sheet caching in the `styled` HOC
- fixed: prevent crash on transaction history scene when custom token is deleted
- fixed: added missing cancel button handler in FIO name confirmation scene
- Upgrade edge-login-ui-rn to v2.6.6
  - changed: Update translations

## 3.14.0 (2023-08-01)

- added: Light account support
- added: PulseChain (PLS)
- added: New animated splash screen logo
- added: Next button on enable token scene
- added: Close button on notification dropdown
- added: Improved Maestro testability
- added: Allow scrolling on wallet creation completion scene
- added: Wallet Birthday Height description on modal for Zcash/Pirate Chain seed import
- changed: Upgrade react-native to 0.71.11
- changed: Rewrite new activation-needed wallet name validation scene
- changed: Reduce bridge traffic by attempting plugin fetches through proxy server
- changed: Reduce excessive FIO plugin calls
- changed: Upgrade GALA token to latest contract
- changed: Disable Firebase AD ID
- changed: Upgrade to ESLint v8
- removed: Unused React-based partner plugins
- fixed: Rename "View Xpub address" to "Private View Key" for Pirate Chain and Zcash
- fixed: Private view key modal warning text for other currencies besides Monero
- fixed: Handle unhandled promises
- fixed: Wallet list row sync circle component recycling
- fixed: Missing wallet migration transaction metadata
- fixed: Enabling tokens from wallet list row now relies on tokenId rather than parent currency code
- fixed: Deleted account name no longer persists on PIN screen
- fixed: Inability to select preferred swap provider in settings
- fixed: Various visual, UX, and text issues
- Upgrade edge-core-js v1.3.6
  - fixed: Interpret HTTP 418 responses from the CORS proxy as errors.
  - changed: Remove fetch fallback logic. No proxy servers will be used.
  - changed: The fetchCors method is no longer deprecated. Use this if CORS might be an issue. Do not use this for any secrets or credentials.
  - fixed: Escape bridge strings closer to serialization, for possibly better performance.
  - fixed: Fallback to CORS-safe fetch functions on all errors to fix inconsistency with error messages across platforms.
  - changed: Add fallback to bridged fetch if request to edge-cors-proxy server fails.
  - changed: Added a fallback to edge-cors-proxy server to fetch method on EdgeIo.
  - fixed: Enable WebView debugging on iOS 16.4+
  - fixed: Correctly return transactions after a resync.
- Upgrade edge-currency-accountbased to v1.4.11
  - fixed: Use io.fetchCors for all requests, instead of io.fetch.
  - fixed: Replace asMaybe and asOptional cleaner default objects with functions that return new objects in otherData cleaners
  - changed: Update XRP explorer url
  - changed: Update checkpoints
  - Optimism: Replace deprecated rpc method rollup_gasPrices with l1BaseFee query
  - EVM: Handle null gas parameter in WalletConnect requests
  - FIO: Treat 403 status code as error
  - Fixed: FIO transaction reliability issues resolved by adding more historical nodes
  - Update GALA token
  - Remove EthGasStation test
- Upgrade edge-currency-plugins to v2.0.4
  - Fixed: Race condition during re-sync causing impartial processor data ("Missing processor address" bug)
  - Fixed: Throw DustSpendError instead of obscure blockbook error message for dust spend transaction broadcasts.
- Upgrade edge exchange plugins to v0.19.8
  - Use EdgeIo.fetchCors for all requests
  - Swapuz/LetsExchange: Disable MATH
  - Fixed: Increased gas limit by 40% for all chains for LI.FI
- Upgrade edge-login-ui-rn to v2.6.5
  - fixed: Correctly handle errors during account creation.
  - fixed: Allow biometric logins for light accounts.
  - changed: Update password login to allow configurable account creation options
  - fixed: Don't clear modals upon unmounting UpgradeUsernameScreen
  - changed: Update translations
  - fixed: Stop returning the incorrect keychain data for light accounts.
  - fixed: Update the wording on the new light account PIN scene, since there is no password.
  - fixed: Update the terms & conditions wording for light accounts, which have no password.
  - fixed: Reinstate login screen back button, conditionalize light username-less vs full account creation
  - added: Accept an initialLoginId prop for the LoginScreen. Use this to select the initial user.
  - deprecated: The username prop for the LoginScreen. Use initialLoginId instead.
  - fixed: Enable the username dropdown for > 0 saved users on the password login scene
  - fixed: Password login scene user list dropdown fade covering last entry
  - fixed: Unnecessary scene scrolling in password login scene
  - fixed: Add missing gradient in Password Login Scene scrollable list
  - fixed: Allow text wrapping in PIN Login Scene account dropdown list
  - changed: Update translations
  - changed: Upgrade to edge-core-js v1.3.2.
  - changed: Support for username-less (light) account.
  - fixed: Correctly handle username deletion on the PIN scene.
  - fixed: Maestro testing targetability of components
  - changed: Update password login scene to use themed text input
  - fixed: Password login scene errors were not localized
  - changed: Allow biometric logins for accounts without usernames.

## 3.13.0 (2023-07-12)

- Add WalletConnect v2 support
- Refactor transaction list scene to reduce redux use and implement streamTransactions method
- Fixed Polkadot sends
- Fix zkSync max send calculation
- Fix exchange settings persistance
- Use SendScene2 for create wallet payments
- Port more scenes and components to use hooks
- Enable long tap to copy Visa card url (beta)
- Fix crash when a gui plugin isn't present
- Add steps to deploy script to faciliate maestro testing
- Various UX and visual fixes
- Upgrade edge-core-js to v1.3.0
  - added: Add an EdgeAccount.getPin method.
  - fixed: Allow the EdgeAccount.username property to update after calling changeUsername.
  - added: Add an EdgeCurrencyWallet.streamTransactions method.
  - deprecated: Pagination options for getTransactions. Use streamTransactions if you need pagination.
  - fixed: Add the correct URI to changeUsername, so it works.
  - fixed: Send a 'transactionsChanged' event when editing metadata.
  - added: Add an EdgeContext.forgetAccount method.
  - deprecated: EdgeContext.deleteLocalAccount. Use EdgeContext.forgetAccount instead.
  - fixed: Do not throw a "No username in reply" error when logging into light accounts via barcode.
- Upgrade edge-currency-accountbased v1.4.4
  - Fixed: Critical bug that is missing data field for native EVM transactions including a memo
  - Disable using TRX for PIX codes
  - Upgrade @polkadot/api to v10.9.1
  - Fixed: Fixed Ethereum broken max-spend for spend info with undefined nativeAmount
  - Added: Add PulseChain (PLS)
  - Fixed: Fix broken max-spend for zkSync
  - Deprecate WalletConnect v1
  - EVM/ALGO: Add parseWalletConnectV2Payload to parse out amounts from WalletConnect v2 payloads
    ZEC: Update checkpoints
- Upgrade edge-login-ui-rn to v2.3.3
  - fixed: Modal close button covering modal submit buttons while Android keyboard is open
  - fixed: Username availability check error would incorrectly show in some cases
  - fixed: Modal close button overlapping submit button in PW Recovery modal
  - fixed: Allow pressing modal buttons without dismissing the keyboard.
  - fixed: Remove an extra close button from the security alerts modal.
  - changed: Simplify the create-account flow internals.
  - changed: Update the Android gradle build file.
  - fixed: Sometimes the username availability check mis-reports availability status
  - added: Add an appconfig prop to LoginScreen.
  - changed: Update routing behavior when onComplete is not passed to LoginScreen.
  - changed: Give scrolling modals a bottom fade-out effect.
  - changed: Make the QR login modal and text input modals scrollable.
  - changed: Allow the PIN scene to log into username-less accounts.
  - removed: Remove OTP support for PIN logins. The login server will never return OTP errors for PIN logins, so this capability is not needed.

## 3.12.0 (2023-07-05)

- Core refactor removes private key properties from EdgeCurrencyWallet
- Add USDC (ETH/MATIC) support for Bitrefill
- Fix Google Pay support with Banxa
- Fix large amount (beyond daily limit) handling for Bity
- Fix FIO transaction history display
- Rewards card design updates (beta)
- Thorchain: Fix unstake amount selection
- Improve error logging
- Show/hide welcome screens via environment variable
- Disable Bitaccess
- Update translations
- Various visual fixes
- Upgrade edge-core-js to v1.0.1
  - changed: Convert createAccount to named parameters
  - changed: Return an array from fetchLoginMessages
  - changed: Fix the listRecoveryQuestionChoices return type
  - changed: Allow usernames to be undefined
  - removed: Ethereum hacks
    - Ethereum address derivation.
    - EdgeAccount.signEthereumTransaction
  - removed: Deprecated client-side token methods
    - EdgeCurrencyEngine.getEnabledTokens (no longer used)
    - EdgeCurrencyEngine.getTokenStatus (no longer used)
    - EdgeCurrencyWallet.addCustomToken
    - EdgeCurrencyWallet.changeEnabledTokens
    - EdgeCurrencyWallet.disableTokens
    - EdgeCurrencyWallet.enableTokens
    - EdgeCurrencyWallet.getEnabledTokens
  - removed: Deprecated display-key properties
    - EdgeCurrencyWallet.displayPrivateSeed
    - EdgeCurrencyWallet.displayPublicSeed
  - removed: Deprecated EdgeAccount.loginKey property
  - removed: Deprecated keys properties on EdgeAccount and EdgeCurrencyWallet
  - removed: Deprecated EdgeTransaction.amountSatoshi
  - removed: Deprecated options prop from the MakeEdgeContext component.
  - removed: Unused EdgeTransaction.wallet
  - removed: Unused getTransactions parameters
  - removed: Unused type definitions
    - EdgeBitcoinPrivateKeyOptions
    - EdgeCreatePrivateKeyOptions
  - removed: No longer allow the OTP key to be passed as EdgeAccountOptions.otp. This parameter only accepts 6-digit OTP codes now. Pass the key as EdgeAccountOptions.otpKey instead.
  - fixed: Do not crash when accessing EdgeAccount.username on an account that has none.
  - deprecated: EdgeContext.pinLoginEnabled. Use EdgeContext.localUsers instead.
  - fixed: Correctly handle startEntries in getTransactions, by always returning the requested number of transactions.
- Upgrade edge-login-ui-rn to v2.1.0
  - added: Validate that the recovery key is valid base58 before submitting the modal.
  - changed: Simplify internal redux and routing logic.
  - fixed: Disable keyboard "next" button if the new-account username has not yet been checked for availability.
  - changed: Upgrade to edge-core-js v1.0.0. Earlier versions will not work.
  - changed: Adjust isTouchEnabled to take an EdgeAccount instead of a username.
  - added: Ability to pass AppConfig to LoginScreen with termsOfServiceSite
  - added: Allow onComplete prop to LoginScreen to be optional
  - added: EdgeAccount.changeUsername.
  - added: EdgeAccount.getLoginKey.
  - deprecated: EdgeAccount.loginKey. Use EdgeAccount.getLoginKey instead.
  - deprecated: EdgeContext.listUsernames. Use EdgeContext.localUsers instead.
  - fixed: Background brand image handling and display.
- Upgrade edge-currency-accountbased to v1.2.13
  - FIO: Fix unstake method insufficient funds checking
  - Update ZEC/ARRR checkpoints
  - EVM: Re-enable token transaction acceleration
  - FIO: Add getMaxSpendable
  - TRX: Fix memo handling
  - Fixed: Added transaction processing for FIO name registration actions

## 3.11.0 (2023-06-07)

- Add in-app A/B testing
- Refresh market scene on default fiat code change
- Hide send scene scam warning if first send is initiated from partner plugin
- (beta) Visa card functionality changes:
  - Support card deletion (Visa card beta)
  - Add DOGE support (Visa card beta)
- Refactor Fiat Plugin `enterAmount` API
- Set default self transfer address to bech32
- Fix token transaction acceleration
- Fix PIX transactions
- Fix FIO max stake and unstake amount calculation
- Fix a broken NaN check for fiat metadata
- Fix transaction metadata for Bitrefill purchases
- Add Maestro bootstrap shell script
- Various text, visual, and usability fixes
- Upgrade edge-core-js to v0.21.4
  - added: EdgeAccount.changeUsername.
  - added: EdgeAccount.getLoginKey.
  - deprecated: EdgeAccount.loginKey. Use EdgeAccount.getLoginKey instead.
  - deprecated: EdgeContext.listUsernames. Use EdgeContext.localUsers instead.
- Upgrade edge-currency-accountbased v1.2.13
  - EVM: Re-enable token transaction acceleration
  - FIO: Add getMaxSpendable
  - FIO: Fix unstake method insufficient funds checking
  - TRX: Fix memo handling
  - Fixed: Added transaction processing for FIO name registration actions
  - Update ZEC/ARRR checkpoints
- Upgrade edge-login-ui-rn to v1.4.7
  - added: Accessibility hints to logo and button

## 3.10.0 (2023-05-25)

- Add Pepe (PEPE)
- Added Visa® Debit Card (beta)
- Add ZEC/ARRR import wallet support
- Add Tron Stake v2 support
- Add default fiat support to Markets scene
- Fix Wallet Connect personal_sign method
- Fix background audio pause while playing send/receive chimes
- Refactor Request Scene to use ExchangedFlipInput2
- Cleanup SEPA details input scene
- Remove deprecated allowed/excluded currencyCode props from WalletListModal
- Deprecate Tomb Finance v1/v2 staking
- Deprecate Tron Stake v1
- Fix sync circle discrepancy between wallet list and transaction list view
- Fix section header date display in FIO requests lists
- Lock Next button in fiat plugin while amounts are fetched
- Update translations
- Various visual fixes
- Upgrade edge-core-js to v0.21.3
  - fixed: Return transactions from getTransactions, even if they have no on-disk metadata
  - changed: Remove deprecated methods in unit tests
  - fixed: Return transactions from getTransactions, even if they have no on-disk metadata
  - added: EdgeUserInfo.username.
  - added: Provide EdgeAccount methods for reading public and private keys:
    - getDisplayPrivateKey
    - getDisplayPublicKey
    - getRawPrivateKey
    - getRawPublicKey
  - added: Matching EdgeCurrencyTools methods for getting display keys.
  - deprecated: EdgeCurrencyEngine methods for getting display keys.
  - deprecated: EdgeAccount and EdgeCurrencyWallet key properties.
- Upgrade edge-currency-accountbased to v1.2.9
  - FIO: Handle empty otherParams objects as null
  - Add Pepe token
  - Tron: Pass nativeAmount directly to TRC20 encoder
  - Tron: Make fee optional in asTRC20TransactionInfo cleaner
  - EVM: Fix null gas price handling in txRpcParamsToSpendInfo
  - Ripple: Fix api reconnect logic
  - Fixed: Find XLM memos in all three makeSpend API locations
  - ZEC/ARR: Add import private key birthdayHeight option handling
  - FIO: Replace public key with recipient public key
  - Rename files to the network name, not the currency code
  - Use uppercase names for files that export classes and use loweracse names for files that export types and utilities
  - Fix: Added dynamic gas limit calculation for zkSync
  - Add Tron Stake v2
  - Algorand: Support signing multiple transactions in wallet connect request
- Upgrade edge-exchange-plugins to v0.19.5
  - Fixed: Fix swapuz refund address
  - Fixed: Prevent Thorchain swaps that would receive negative amount
  - Changed: Update exolix to v2 api
- Upgrade edge-login-ui-rn to v1.4.6
  - Fixed: Background brand image handling and display.

## 3.9.0 (2023-05-10)

- Add zkSync
- Simplex: Add ALGO, OP-ETH and OP asset support
- Add Google Play in-app reviews API
- Banxa: Fix buy flow
- Add many new ERC20 tokens: AMP, APE, CRO, ENJ, LRC, PLA, QNT, SUKU, SHIB, SOLVE, STRK, GRT, SAND, GAME, and GALA
- Add Algorand Wallet Connect support
- Display EVM Checksum Address in as default in Receive scene
- Fix scene header side button display alignment issues
- Fix login lag on slow networks caused by notification registration
- Fix EVM wallet connect payload parsing
- Fix edited transaction metadata saving
- Monero: Rename "View Xpub Address" to "Private View Key"
- Use 'isSend' flag on transactions for display
- Support checking parsedUri.minNativeAmount
- Cleanup FiatPlugin implementation
- Android: Fix 'Confirm and Email'
- Android: Fix image caching issues by downgrading fresco:animated-gif
- Port TransactionListScene to hooks
- Upgrade edge-core-js to v0.21.1-1
  - fixed: Return transactions from getTransactions, even if they have no on-disk metadata
  - added: Log any swap plugins that time out.
  - added: EdgeParsedUri.minNativeAmount. Note: This is not a breaking change, but we incorrectly updated the version number as if it were.
  - fixed: Stop incorrectly writing metadata for sends. This should make editing metadata more stable.
  - fixed: Remove check that spentTargets.length > 0 in makeSpend
  - changed: Removed private keys from walletInfo for makeCurrencyEngine
  - added: Add an EdgeTransaction.isSend flag.
- Upgrade edge-currency-accountbased to v1.2.2-3
  - FIO: Fix pubkey in request and obt data
- Fix: Added dynamic gas limit calculation for zkSync
  - Fix: Precision bug in min gas price checks for EVM currencies
  - Change: Lower zkSync minGasPrice to 0.01 gwei
- Removed non-checksum addresses for EVM-based currencies (legacyAddress)
  - Add: ALGO 'appl' transaction type processing
- Fix: Properly handle ALGO wallet connect payloads with multiple transactions
  - FIO: Update node list
  - ZEC/ARRR: Prevent sending overlapping queries to synchronizer
  - Fix accessing already deleted wallet connector
  - ZEC/ARRR: Update checkpoints
  - Add WalletConnect v1 support to Algorand
  - Update EVM WalletConnect call_request response to include nativeAmount and networkFee
  - Break out WalletConnect types to common folder
  - Update ZEC checkpoints
  - fixed: Parse URIs as Tron addresses first before PIX addresses to prevent incorrect parsing of Tron addresses as a PIX address
  - Added: ERC-55 checksum address returned by getFreshAddress for ethereum plugin
  - fixed: Parse URIs as Tron addresses first before PIX addresses to prevent incorrect parsing of Tron addresses as a PIX address
  - Upgrade edge-currency-monero v1.0.0
  - fixed: Return the correct walletId on EdgeTransaction instances.
  - fixed: Add a missing await to saveTx, ensuring the transaction is on-disk.
  - changed: Upgrade to react-native-mymonero-core v0.3.0.
  - changed: Allow engine to run without private keys. This requires edge-core-js v0.19.47 or greater.
- Upgrade edge-exchange-plugins to v0.19.3
  - Lifi: Fix passing gasLimit as a float
  - Fixed: Fix zkSync mainnet code transcription for LetsExchange.
  - Fixed: Disable zkSync explicitly for Swapuz.
  - Fixed: Lifi gasLimit calculation for ETH
  - Changed: Transcribe zkSync mainnet code to ZKSYNC
  - Upgrade edge-login-ui-rn to v1.4.5
  - Changed: Reword IP OTP warning text
  - fixed: Broken 'Confirm and Email' Recovery setup button
- react-native-mymonero-core to v0.3.0
  - changed: Do not allow multiple parallel calls to createTransaction. Instead, wait for the previous call to complete before starting the next one.
  - changed: Simplify and document the relationship between the React Native bridge and the CppBridge object.

## 3.8.1 (2023-04-25)

- Upgrade edge-currency-accountbased to v1.0.1
  - fixed: Parse URIs as Tron addresses first before PIX addresses to prevent incorrect parsing of Tron addresses as a PIX address

## 3.8.0 (2023-04-24)

- Add Algorand (ALGO) and standard asset support
- Add Velodrome DEX support
- Simplex: Add Goole Pay support
- Bity: Migrate to new fiat plugin buy/sell flow
- Added Ethereum ERC20 tokens: (Amp, ApeCoin, Cronos Coin, EnjinCoin, Gala, Game Coin, Graph Token, Healthcare Administration Token, LoopringCoin V2, PlayDapp Token, Quant, SAND, SHIBA INU, Strike Token, SUKU, and Wrapped FIO)
- Move permission checking to end of create flow
- Add live username availability lookup
- Hide balance on request scene if main balance is hidden
- Fix usability issues on FIO onboarding scenes
- Fix eth_signTypedData_v4 support
- Fix corner case that showed incorrect wallet balances display for new wallets
- Fix fiat plugin region restricted error message
- Allow routing to GettingStartedScene from LoginScene
- Add sticky message to row for compromised wallets
- Change default strings export to named export
- Fix unresolved getHistoricalRate promises
- Enable the following lint rules: @typescript-eslint/no-var-requires, typescript-eslint/return-await, and react-hooks/exhaustive-deps
- Fix various visual and usability issues
- Upgrade edge-core-js to v0.19.50
  - fixed: Remove check that spentTargets.length > 0 in makeSpend
- Upgrade edge-currency-accountbased to v1.0.1
  - fixed: Parse URIs as Tron addresses first before PIX addresses to prevent incorrect parsing of Tron addresses as a PIX address
  - PIX: Support minimum amount
  - ETH: Add ERC20 tokens
  - FIO: Fix new account balance object
  - Audit and fix noisy unused address logging
  - HBAR/EOS: Fix balance and tx query for new accounts
  - Upgrade edge-core-js to v0.21.0
  - Replace asMaybe and asOptional cleaner default objects with functions that return new objects
  - Upgrade cleaners to v0.3.14
  - Add zkSync wallet type
  - EVM: Update node lists
  - ZEC/ARRR: Update checkpoint files
  - Add Algorand (ALGO)
  - OP: Add WETH and VELO tokens
  - BNB Beacon Chain: Fix transaction date handling
  - ARRR: Add unsafeBroadcastTx to info
  - EVM: Query info server fees by pluginId
  - EVM: Save network fees to engine rather than to disk
- Upgrade edge-currency-plugins to v2.0.2
  - Query networkFees endpoint with pluginId instead of currencyCode
- Upgrade edge-login-ui-rn to v1.4.3
  - added: OutlinedTextInput prop allowing user edits while spinner is active
  - changed: Reduce delay for checking username availability to 400ms
  - fixed: Add missing mount check to the first setState in the timeout to check username availability
  - fixed: Back on NewAccountPinScene
  - fixed: New account username input defocuses when auto-checking for availability
  - fixed: Username persistence on back button
  - removed: Too much space above brand image on PinLoginScene
  - fixed: Reinstate onComplete handling from 1.3
  - changed: Update translations
  - fixed: Calculation of minLength for legacy recovery questions in login scene
  - fixed: Calculation of minLength for legacy recovery questions
  - changed: Move "Security Alerts" notification prompt to after account creation is completed
  - changed: Update username availability check to be on a per-character-input basis
  - added: Add an onComplete prop to the LoginScene component
  - changed: Add a back button to the PasswordLoginScene
  - changed: Move Help button to the top-right corner for all scenes
- Upgrade edge-exchange-plugins to v0.18.0
  - added: Add Velodrome DEX exchange

## 3.7.0 (2023-04-11)

- Engine now run with just public keys and are passed private keys only when necessary
- Reimplement EdgeProvider using JSON-RPC instead of YAOB
- Fix navigation issue when completing BitRefill purchase
- Fix password recovery for passwords created before new stricter requirements
- Migrate FIO functionality to use tx flow instead of otherMethods
- Migrate EVM wallet connect functionality to use tx flow instead of otherMethods
- Use signMessage core API for EdgeProvider
- Fix EOS wallet creation
- Remove legacy PLATFORM variables
- Fix missing LiFi icon
- Various visual fixes
- Update translations
- Upgrade edge-core-js to v0.19.49
  - fixed: Incorrectly formed privateKeys argument for signTx call to the engine
  - fixed: Passing only the private keys to EdgeEnginePrivateKeyOptions['privateKeys'] for syncNetwork, instead of the entire EdgeWalletInfo
  - added: Pass private keys to EdgeCurrencyEngine.signTx and similar functions.
  - changed: Only accept base-10 integer balances from currency engines, and ignore all other balance strings.
  - removed: Make deprecated token methods optional on EdgeCurrencyEngine, so they can be removed.
- Upgrade edge-currency-accountbased to v0.23.2-1
  - changed: Refactor all engines to only deal with private keys directly from privileged function
  - Refactor FIO use makeSpend, signTx, and broadcastTx instead of ambiguous otherMethods
  - changed: Remove wcRequestResponse and all WalletConnect signing methods
  - added: Support for signMessage core API for Ethereum engines to be used for Wallet Connect integrations
  - fixed: Crash in createPrivateKey for EosTools
  - ARRR: Fix unsafeBroadcastTx flag
  - FIO: Fix syncNetwork private key handling
  - FIO: Use promiseNy for balance checking
  - FIO: Fix promiseNy error handling
  - EVM: Update node lists
  - ZEC/ARRR: Update checkpoint files
- Upgrade edge-currency-plugins to v2.0.1
  - changed: Upgrade security access to private keys in EdgeWalletInfo
  - changed: Add signMessage API to replace signMessageBase64 in otherMethods
  - Improve log detail in order to better troubleshoot spending issues.
- Upgrade edge-login-ui-rn to v1.2.4
  - fixed: Calculation of minLength for legacy recovery questions

## 3.6.0 (2023-03-28)

- Add new Getting Started flow
- Add Smartpay PIX support
- EOS: Add PowerUp support
- Support deep linking to buy/sell providers
- Prevent sending to unactivated accounts (XRP, DOT, and XLM)
- Show expiration time from parsed URI, if provided
- Add user's receiving address to advanced transaction details scene
- Fix navigation issue when attempting to leave partner plugins
- Fix potential crash when migrating custom tokens
- Replace FlatList with FlashList
- Fix safe area display issues with iPhone 14
- Prevent Optimism from appearing as HBAR activation currency
- Android: Fix occasional crash when refocusing app
- Add event tracking to logs
- Move notification registration to Services
- Various visual fixes
- Update translations
- Upgrade edge-core-js to v0.19.46
  - added: Add expireDate to EdgeParsedUri
- Upgrade edge-currency-accountbased to v0.22.21
  - Fix fallback value returned when recipient min balance check fails
  - XRP: Add additional broadcast error code handling
  - EOS: Fix address parsing
  - EOS: Replace address regex with greymass sdk regex
  - removed: Do not use EdgeCurrencyInfo.defaultSettings to store network info for most chains.
  - changed: Upgrade EOS to have power-up support. This will make spending EOS work again.
  - changed: Do not allow sending funds to XRP or Polkadot addresses if they would fail to meet activation the reserve requirement.
- Upgrade edge-exchange-plugins to v0.17.7
  - Lifi: Use built-in gas limit estimator for Ethereum transactions and not Lifi's
- Upgrade edge-login-ui-rn to v1.2.2
  - changed: Change 'new-account' value for initialRoute prop to route to the username screen
  - changed: Updated password description verbaige
  - changed: Don't require showing acct creds to continue acct creation
  - changed: Change wording to not require writing down password on acct creation

## 3.5.0 (2023-03-12)

- Add LiFi DEX aggregator
- Add Optimism
- Update Account Recovery to UI2 theme
- Allow single character currency codes
- Fix AnyPay parsing on send scene
- Fix potential crash when connecting addresses to FIO names
- Fix swap settings not getting saved consistently
- Create a FakeProvider to provide redux to test components
- Change activation payment currencies to use pluginIds
- Change split wallet functionality to use pluginIds instead of currency codes
- Show engine failure error in currency row on failure to load
- Disable Paynow support in SG
- Various visual and text fixes
- Upgrade edge-core-js to v0.19.45
  - fixed: Update denominationToNative and nativeToDenomination to look at allTokens, instead of the legacy token lists.
- Upgrade edge-currency-accountbased to v0.22.18
  - Fix: Lower Optimism minGasPrice
  - HBAR: Update explorer URL
  - added: Parse/quote Smartpay PIX QR codes for Tron/USDT
  - EVM: Add L1 gas price multiplier
  - EVM: Fix nativeAmount calculation when paying an L1 fee
  - Add optional checkEnvironment method to OuterPlugin to allow a plugin to fail after loading and during initialization
  - EVM: Fix race condition of undefined balance for ETH-based currencies
  - ARRR: Update checkpoint files
- Upgrade edge-exchange-plugins to v0.17.6
  - added: Add LI.FI DEX exchange.
  - added: Add Optimism support across swap plugins
  - added: Add default mainnet transcription map
  - Lifi: Allow gas price lower than 1 gwei
  - LetsExchange: Audit and add special case mainnet codes
- Upgrade edge-login-ui-rn to v1.2.0
  - fixed: Missing back button on password recovery login
  - added: PublicLoginScreen takes a initialRoute prop to allow for control over the scene that it will initially show
  - added: Accessibility hint to Edge logo
  - fixed: Safe area for iPhone 14+
  - added: Depend on the native @react-native-community/datetimepicker library, which must be installed manually.
  - changed: Re-theme the recovery login scenes to match the rest of the app.
  - removed: Scene components no longer accept a showHeader prop. With the final scene being themed, this prop no longer does anything.

## 3.4.0 (2023-03-03)

- added: Safety check to see if keys have been uploaded to Edge infrastructure.
- added: Sweep-to-self feature to migrate funds to new keys.
- added: Ability to view logs through the "share" feature.
- changed: Disable the "Upload logs" feature if the logs contain things that look like keys.

## 3.3.1 (2023-02-20)

- fixed: Stop writing private keys to logs when visiting the GUI plugin WebView.

## 3.3.0 (2023-02-08)

- Add XRP Tokens support
- Add Markets and Asset View
- Add Tron staking support for bandwidth and energy
- Add Intuitive UI for transferring assets between wallets
- Fix gradient background throughout app
- Fix Thorchain swaps
- Fix crash when staking or unstaking FIO
- Add support for new recovery token URI
- Change default XRP wallet name to "My XRP"
- Allow for currency plugins that support tokens without custom tokens
- Refactor selectWallet to allow for token activation
- Audit and fix unsafe React component keys in lists
- Other improvements and minor visual fixes
- Update translations
- Upgrade edge-core-js to v0.19.42
  - added: Support for token activation
  - changed: Convert source code to TypeScript internally. No changes should be visible externally, aside from some file locations.
- Upgrade edge-currency-accountbased to v0.22.11
  - fixed: Correctly report ETHW balances.
  - Fix: Include per token reserve in calculation of getMaxSpendable and makeSpend
  - Add: Built in tokens for BSC, ETHW, and ETC to allow for custom tokens
  - Fix: Missing XRP token transactions
  - Improve hexToDecimal safety
  - Fix: BNB Beacon Chain missing setOtherData method causing login errors
  - TRX: Add bandwidth and energy staking support
  - Add XRP token support
  - Add native builtinTokens support and deprecate metaTokens
  - Use patch-package to fix @tronscan/client errors
- Upgrade edge-exchange-plugins to v0.17.2
  - Fix: Send Ninerealms client-id when doing Thorchain queries
  - Fix: Use Thornode servers instead of Midgard for inbound_addresses
  - Godex: Check min amount before supported networks
- Upgrade edge-login-ui-rn to v0.10.21
  - changed: Re-format the new-account username screen to work better on small screens.
  - added: Instructions to Terms of Use
  - added: Conversion event tracking to login and account creation

## 3.2.0 (2023-02-02)

- Add max swap support
- Banxa: Add Google Pay support
- Change "Request" text to "Receive"
- Tron: Add note support
- HBAR: Fix balance syncing
- HBAR: Update block explorer
- XMR: Add max send
- Use SendScene2 for deeplink and EdgeProvider payments
- Add exit button to side menu
- Add marketing notification opt-out switch
- Round amounts for fiat conversion in SendScene/ExchangedFlipInput instead of truncating
- Lock send scene slider until all makeSpend requests are resolved
- Fix treatment of EdgeTransaction confirmations in TransactionRow
- Fix using label param in URI to tag transactions
- Fix spending previously entered amount
- Add edge-currency-accountbased as native module
- Add background gradient orientation to theme
- Replace Actions usage with navigation
- Show "Delete Account" option when settings are locked
- Update translations
- Various visual and performance fixes
- Upgrade edge-core-js to v0.19.40
  - added: New 'syncing' to confirmations API
  - fixed: Bug in validateConfirmations function incorrectly inferring a transaction as 'dropped'
  - fixed: Re-publish with missing files.
  - changed: Make sensitive account & wallet properties, like keys, non-enumerable.
  - changed: Use the pluginId as the wallet logging prefix, instead of the currency code.
- Upgrade edge-currency-accountbased to v0.22.4

  - Convert library to React Native Module
    - This package will automatically install itself using React Native autolinking and no longer requires Webpack for integration
    - Plugins are broken out and can be loaded individually
    - Move checkpoint files to android folder
    - Stub away unwanted USB modules
    - Cleanup old and redundant dependency resolutions
  - Changed: Implement accelerate transaction feature using new core API
  - fixed: Adjust build settings to provide better support for iPhone 12.
  - fixed: Track EVM wallet connections at the EdgeCurrencyTools level, to prevent active connections from disappearing.
  - ARRR: Remove address explorer url
  - EVM: Revert getMaxSpendable simplification changes in favor of recursion due to sliding standard fee scale
  - DOT: Update @polkadot/api to v9.11.3
  - DOT: Improve type safety and various code cleanups
  - DOT: Add hard limit of 1 to transaction query progress

  - TRX: Add note support
  - TRX: Update derivation path to industry standard
  - XRP: Replace use of autofill with local transaction creation
  - XRP: Replace currency settings with networkInfo
  - XRP: Clean up code for type-safety
  - XRP: Add broadcast failure handling
  - Replace forked ethereumjs-wallet library
  - EOS: Fix destructure error when attempting to spend
  - EVM: Remove recursion from getMaxSpendable
  - Replace remaining json-schema usage with cleaners
  - Update checkpoint files

- Upgrade edge-currency-monero to v0.5.5
  - Add getMaxSpendable
  - Upgrade edge-core-js to v0.19.36
- Upgrade edge-currency-plugins to v1.3.6
  - Fixed: Reduce the KEEP_ALIVE_MS blockbook server heartbeat time
- Upgrade edge-exchange-plugins to v0.17.0
  - Add 'max' support across all swap plugins
  - Remove legacy address fallback
  - Godex: Add early exit for unsupported chains
  - Remove Switchain
  - Upgrade edge-core-js to v0.19.37
- Upgrade edge-login-ui-rn to v0.10.19
  - Upgrade Changed: Orient background gradient using Theme
  - Added: A new RequestPermissionsModal with toggles to opt-in for marketing and/or price notifications.

## 3.1.0 (2023-01-13)

- Add Bech32 address support
- Add support for non-segwit DGB and LTC
- Thorchain Savers: Show estimate fees and estimate break-even time
- Show current APR on Earn button
- Split swap providers into centralized and decentralized (DEX) groups
- Allow user to prefer provider type
- Show error when attempting to unstake small (lower than tx fee) amounts
- Show staked amounts to the wallet transaction history scene
- Add shortcut to Exchange Settings by tapping on Powered By logo
- Deprecate Wyre
- Upgrade edge-core-js to v0.19.37
  - added: Always-enabled tokens. The currency engine checks these for balances and transactions, but they do not appear in the per-wallet enabled token lists.
    - EdgeCurrencyConfig.alwaysEnabledTokenIds
    - EdgeCurrencyConfig.changeAlwaysEnabledTokenIds
  - added: EdgeCurrencyTools.checkPublicKey, which provides a mechanism for currency plugins to refresh their cached public keys if necessary.
  - added: EdgeSwapInfo.isDex and EdgeSwapRequestOptions.preferType, to always prefer DEX swaps over centralized swaps.
  - changed: Always select the "transfer" plugin if it returns a quote, regardless of price.
  - added: Accelerate Transaction API
- Upgrade edge-currency-plugins to v1.3.5
  - Fixed: Incorrect types path in package.json
  - Added: Support bech32 addresses as segwitAddress for EdgeFreshAddress
  - Added: RBF flags for Bitcoin and Litecoin
- Upgrade edge-exchange-plugins to v0.16.17
  - Add: isDex and swapPlugType to plugins and quotes

## 3.0.0 (2023-01-06)

- Updated dark mode theme:
  - New asset icons
  - Enhanced contrast
  - Haptic feedback
- Enhanced Thorchain Savers interface and usability fixes
- Add optional spam filter to hide low fiat value (>0.001) transactions
- Add confirmation toast to Delete Account
- Allow changing fees for payment protocol payments
- Add ability to wipe local logs from device
- Prevent infinite hanging on loading screen if there are no active wallets
- Only set necessary amounts when calling Approve (erc20)
- Notify Bugsnag after displaying warning/error airship messages
- Fix incorrect modal size when returning to app from webview
- Disable FoxExchange
- Disable Switchain
- Update translations
- Various visual fixes
- Upgrade edge-core-js to v0.19.35
  - fixed: Clean swap quotes before logging to prevent circular reference error
  - fixed: Export more accurate TypeScript definitions for our React Native components.
- Upgrade edge-currency-accountbased to v0.21.0
  - Add Piratechain (ARRR)
  - ZEC: Add getBirthdayHeight plugin method
  - Revamp checkpoint creation script to query treestate directly from lightwalletd nodes
  - Upgrade react-native-zcash to v0.3.2
- Upgrade edge-currency-plugins to v1.3.3
  - fix: Upgrade dependencies to fix vulnerabilities and some data-layer issues.
  - fix: Report the correct balance for old Airbitz-created addresses.
- Upgrade edge-exchange-plugins to v0.16.16
  - LetsExchange: Update asInfoReply cleaner to support numbers or strings
  - Add BTC/ARRR tests
  - LetsExchange: Fix max amount logic
  - Fix: Transfer plugin throwing error
  - Change: Allow per asset spreads to be specified by currency code
  - Fix: Remove extra slash in path to Thorswap API to prevent 301 redirects
  - Change: Limit Thorchain token approvals to amount needed for deposit
  - Change: Add ability to tweak Thorchain volatility % based on asset pair via info server
  - TombSwap: Restrict token allowances to only what is needed for each smart contract call.
- Upgrade edge-login-ui-rn to v0.10.17
  - Fixed: Add flexGrow to username dropdown in PasswordLoginScene
  - Fixed: No longer allow a user to bypass password requirements with an empty password

## 2.28.0 (2022-12-18)

- Add Tron (TRX) with TRC20 support
- Add Thorchain DEX Aggregator
- Add Thorchain Savers Vaults
- Add KNCv2 (ETH)
- Fix BCH splitting
- Add option to disable token from wallet menu
- Add additional context modal to password change function
- ChangeHero: Re-enable token swaps
- Deprecate FoxExchange
- Add alpha-3 country codes to country list modal search results
- Various visual fixes
- Upgrade edge-core-js to v0.19.33
  - added: New options for getReceiveAddress
  - change: Upgrade biggystring to 4.0.0
  - change: Increase BCH replay protection transaction value amount
  - change: Upgrade redux to 4.2.0
  - change: Upgrade redux-keto to 0.3.5
  - fix: Login server override testing
- Upgrade edge-currency-accountbased to v0.20.5
  - TRX: Make sure to check the total native asset cost in makeSpend
  - FIO: Update server list
  - EVM: Only cache gas limit if retrieved from network
  - EVM: Fail makeSpend for contract transactions if unable to estimate gas limit
  - EVM: Rework gasLimit calculation to double any estimate for transaction that interacts with a contract
  - Update default Polygon BUSD address from Paxos (0xdab529f40e671a1d4bf91361c21bf9f0c9712ab7) to Binance (0x9c9e5fd8bbc25984b178fdce6117defa39d2db39)
  - TRX: Fix missing timestamp on broadcasted transactions
  - ETH: Add new KNC token and rename old token to KNCV1
  - Fix Ethereum and builtin token handling
  - Various code cleanups
  - Lay ground work for future dynamically imported currencies by breaking plugins into 'inner' and 'outer' portions
    - 'outer' plugins contain currency details, network info, and list to optional plugin methods
    - 'inner' plugins contain heavy lifting code to create wallets and interact with networks
  - TRX: Fix walletType check in derivePublicKey
  - Add Tron (TRX) with TRC20 token support
  - Fix getTokenId logic error
  - Fix balance checking in makeSpendCheck
  - Rename Plugin to Tools
  - Make URI helpers standalone
  - Add type definitions for core globals and third-party modules
  - Various code cleanups
- Upgrade edge-currency-monero to v0.5.4
  - Reduce transaction changed callbacks on wallet initialization
- Upgrade edge-currency-plugins to v1.3.1
  - add: forceIndex option to getReceiveAddress to get specific derivation index
  - add: Return balance of address with getReceiveAddress
  - add: utxoSourceAddress option to makeSpend to only use UTXOs from a specific address
  - add: forceChangeAddress option to makeSpend to force change to go to specific address
  - fix: Enable and fix BCH to BSV splitting
- Upgrade edge-exchange-plugins to v0.16.10
  - Add Thorchain DEX aggregator
  - ChangeHero: Re-enable 'to' quotes
  - ChangeHero: Re-enable token swaps
  - Thorchain DA: Update cleaners
  - Deprecate FoxExchange
- Upgrade edge-login-ui-rn to v0.10.15
  - Add warning message to change password modal

## 2.27.01 (2022-11-24)

- Update Ionia Rewards URL

## 2.27.0 (2022-11-23)

- Add Ionia gift card rewards program
- AVAX: Add USDC
- Add long press on transaction row to share
- Fix wallet name consistency
- Fix FIO request handling of BSC chain code
- Replace wallet in EdgeTransaction with walletId
- Various visual fixes
- Various code cleanups
- Upgrade edge-core-js to v0.19.32
  - added: EdgeTransaction.walletId.
  - added: Add the swap request to the quote object as EdgeSwapQuote.request.
  - changed: Change login server to login.edge.app, and filter which domains we allow.
  - deprecated: EdgeTransaction.wallet. Use EdgeTransaction.walletId instead.
  - added: Specifying token spends by their ID, instead of their imprecise currency code:
    - EdgeSpendInfo.tokenId
    - EdgeSwapRequest.fromTokenId
    - EdgeSwapRequest.toTokenId
  - deprecated: Spending tokens by their currency code.
    - EdgeSpendInfo.currencyCode
    - EdgeSwapRequest.fromCurrencyCode
    - EdgeSwapRequest.toCurrencyCode
- Upgrade edge-currency-accountbased to v0.18.10
  - AVAX: Add USDC token
  - Extend makeSpend to support token amount metadata for smart-contract calls
  - Fix Travis builds
  - Fix prepare scripts
  - Make Polkadot types visible in Typescript
  - Enable remaining ESLint rule
- Upgrade edge-exchange-plugins to v0.16.8
  - Sideshift: Update to API v2
  - ChangeHero: Prevent 'to' quotes due to over-precise amounts breaking data encoding.
  - Add testing framework to run plugins in Node
- Upgrade edge-login-ui-rn to v0.10.14
  - Update password error display rules
  - Conditionally show character limit counter in password input field
  - Update translations

## 2.26.0 (2022-11-10)

- Add swap provider Swapuz
- Add wallet selection scene to new account flow
- Deprecate REPv1 trading for REPv2
- FIO: Fix crash when user has no remaining bundled transactions
- Introduce withWallet to prevent crashes on some scenes
- Android: Fix broken category picker
- Show scam warning on first visit to Send Scene
- Redux type cleanups
- Various code cleanups
- Cleanup unit tests and make them more maintainable
- Upgrade react-native to v0.67.5
- Upgrade edge-currency-accountbased to v0.18.8
  - ZEC: Throw error when attempting to send before wallet is synced
  - ZEC: Update checkpoints
- Upgrade edge-currency-plugins to v1.2.3
  - Rewrite wallet balance update algorithm
  - Change ADDRESS_BALANCE_CHANGED event to take an array of balances
  - Emit address balance update event after initializing addresses
  - Add metadataState to dumpData
- Upgrade edge-exchange-plugins to v0.16.6
  - Implement Swapuz
  - Thorchain: Use Midgard API to calculate Thorchain network fees
  - Thorchain: Fix minimum quotes
  - Thorchain: Remove minAmount support
  - Swapuz: Implement TO quotes for like-kind assets
  - ChangeHero: Reimplement restricted currency codes
  - Sideshift: Replace safeCurrencyCodes helper function with getCodesWithTranscription
  - Block REPv1 trading across all partners
  - Change helper function name and expand ability to accept currency code transcription map
  - Fix missing 'to' identifiers on min/max errors
  - Turn on remaining linting rules and fix issues
- Upgrade edge-login-ui-rn to v0.10.12
  - Increase touch area of password login screen dropdown button

## 2.25.0 (2022-10-28)

- Add EthereumPoW (ETHW)
- Create multiple wallets/assets at the same time
- ETH: Add Origin (OGN) token
- Dash: Add InstantSend detection
- Fix ENS address detection
- Add number formatting to credit card buy flow
- Fix occasional metadata display issue in transaction history scene
- Add unique wallet names for new wallets
- Remove pluginId check from search results
- Continue cleanup from Typescript conversion
- Upgrade edge-currency-accountbased to v0.18.7
  - EVM: Split up eth_getTransactionCount into separate evmscan and rpc methods
  - ETH: Add Origin (OGN)
  - EVM: Add RPC balance query
  - EVM: Return empty transaction arrays if evmscan server list is empty
- Upgrade edge-currency-plugins v1.2.2
  - Dash: Add InstantSend detection
- Upgrade edge-exchange-plugins v0.15.4
  - fixed: Do not allow swaps to Tezos using Fox Exchange or Switchain, which rely on dummy addresses.
  - Fix Godex API by updating cleaners
- Upgrade edge-login-ui-rn v0.10.11
  - Allow Powered By icon to be disabled by info server

## 2.24.0 (2022-10-17)

- Thorchain: Enable AVAX swaps
- MoonPay: Enable sell to bank account with ACH
- Add ability to add assets from main scene search
- Add wallet option button in transaction history scene
- Fix Celo transaction query
- Fix potential crash on transaction details scene
- Disable core rates plugins
- Thorchain: Disable same asset swaps
- Deprecate Safello plugins
- Disable Wyre account creation
- Don't throw price-change errors when launching app from security notification
- Various visual fixes
- Allow GUI plugins to be configured by info server per appId
- Add additional optional tab button
- Upgrade edge-core-js to v0.19.30
  - fixed: Correctly pass EdgeSpendInfo.pendingTxs to the currency plugin
- Upgrade edge-currency-accountbased to v0.18.5
  - CELO: Fix server url
  - ZEC: Update checkpoints
- Upgrade edge-exchange-plugins to v0.15.2
  - Thorchain: Reject swap quotes between the same assets
  - Add AVAX support to Thorchain
  - Update Changehero plugin to support arbitrary chains and tokens with reverse quoting

## 2.23.0 (2022-09-28)

- Convert project to Typescript
- Add price change notification modal to buy/sell/trade
- Add scam warning to send scene
- Add historical exchange rate fetching for transactions with incorrect saved amount
- Send metadata on quote.approve()
- Support sweep WIF private key format or 5 address private keys for BTC
- Reduce fetch calls and add spinner for Stake button and Overview scene
- Enable IP Validation for loginIds with no createdApiKey
- Fix double password modal
- Add Firebase configs to prepare script
- Update unit tests
- Various visual fixes
- Upgrade edge-currency-accountbased to v0.18.4
  - BNB: Fix Beacon Chain transaction processing
  - XLM: Add dynamic fee support
  - Fix parseUriCommon protocol parsing
  - EVM: Fix broken baseFee from accidental boolean coercion
  - SOL: Update explorer URLs
  - CELO: Update server list
  - ZEC: update checkpoints
- Upgrade edge-currency-plugins v1.2.1
  - Fix: Correctly import uncompressed WIFs
- Upgrade edge-exchange-plugins v0.14.0
  - Convert project to Typescript
  - Update Changehero plugin to support arbitrary chains and tokens with reverse quoting
- Upgrade edge-core-js to v0.19.29
  - Plugins will receive metadata as part of their approve method in include in the tx object
- Upgrade edge-login-ui-rn v0.10.10
  - Add a spinner to ChangePasswordSceneComponent to prevent double submission

## 2.22.0 (2022-09-19)

- Add new swap provider Thorchain
- FTM: Add L3USD pools
- Upgrade to react-native-mymonero-core v0.2.5
- Fix Polkadot sends
- Re-implement price change notifications to use Push Server v2
- Add ability to filter promo cards by device characteristics and Wyre account status
- Remove Newsagent support
- Allow all local accounts to edit device price notification settings
- Prevent stale swap quotes from reappearing on confirmation scene
- Change swap timeout to 60s
- Remove react-native-fast-crypto
- Upgrade edge-core-js to v0.19.29
- Upgrade edge-currency-accountbased to #aab0c48
  - ETH: Fix spending with empty memo field
  - FTM: Add L3USD token
  - Update ZEC checkpoints
  - Allow EVM data to be passed through memo field
  - Rename engine.js:makeSpend to makeSpendCheck since it has a different return signature than the asset specific makeSpend
  - Restore internal transaction support for etherscan providers. Remove transaction queries from blockbook providers since they don't support internal txs
  - Fix broken ethEngine skipChecks
  - Upgrade @polkadot/api SDK to v9.3.3
- Upgrade edge-currency-plugins to v1.2.0
  - Add: outputSort param for makeSpend to allow for sorting outputs
- Upgrade edge-exchange-plugins to v0.13.10
  - Add Thorchain
- Upgrade edge-login-ui-rn to v0.10.8
  - Fix off center alert error text
  - Enforce 100 character max password length
  - Fix >4 digit pin length
  - Update translations

## 2.21.0 (2022-09-05)

- Wyre: Fix Ethereum purchases
- Make it easier to choose provider in buy scenes
- Upgrade edge-core-js to v0.19.27
  - fixed: Correctly pass EdgeSpendInfo.skipChecks to the currency plugin.
  - added: EdgeContext.clientId.
  - added: EdgeSpendInfo.pendingTxs and EdgeSpendInfo.skipChecks flags.
  - fixed: Show useful information when logging errors, instead of just {}.
- Upgrade edge-currency-accountbased to v0.17.5
  - Implement new skipChecks and pendingTxs API from EdgeSpendInfo for ETH engines
  - Allow specifying only gasPrice or gasLimit for custom fees
  - Remove useless broken dependencies usb and node-hid before building
  - ZEC: update checkpoint script and checkpoint files
  - FIO: Update server list
  - Fix blockbook query txs return object initialization
  - Only record parent network fee on outgoing transactions
  - ETH: Update blockbook server list
  - XRP: Fix API disconnect
  - ETH: Add NOW Token
  - Remove unused values from transactions

## 2.20.2 (2022-08-26)

- Update MyMonero SDK to fix spending after V16 hard fork
- Fix detection of incoming transactions from taproot addresses

## 2.20.1 (2022-08-22)

- Disable swaps for Monero and allow dynamic disabling of swaps for any asset
- Fix missing UTXOs after spend for BTC and other UTXO currencies

## 2.20.0 (2022-08-13)

- Update MyMonero SDK for Monero V15 hard fork

## 2.19.0 (2022-08-01)

- Add Polkadot (DOT)
- Add new swap provider ChangeHero
- Wyre: add USDC (MATIC) sell support
- New Fiat Plugin framework
- Add additional TOMB Cemetary pools
- Banxa: Add Turkey
- Rename Paxos to Pax Dollar
- Fix crash on deeplink
- Fix crash when tapping on wallet very shortly after login
- EdgeProvider: Harden supported currency code formats
- Replace `react-native-blur` with `rn-id-blurview`
- Tighten sweep private key wallet list filtering
- Upgrade to Webpack v5
- Add supportEmail to AppConfig
- Upgrade edge-core-js to v0.19.25
  - changed: Allow individual plugins to resist being loaded by returning undefined instead of an EdgeCurrencyPlugin object.
  - changed: Randomly generate loginIds so recycled usernames don't cause conflicts
  - fixed: Upgrade edge-sync-client to include patch
- Upgrade edge-currency-accountbased to v0.17.2
  - Add Polkadot (DOT)
  - FTM: Add new default tokens: AVAX, BNB, BTC, CRV, DAI, ETH, FUSD, LIF3, LINK, LSHARE, MIM, TREEB, ZOO
  - ETH: Calculate and store feeRateUsed in transactions
- Upgrade edge-currency-plugins to v1.1.2
  - Fix: Upgrade edge-sync-client to include patch
- Upgrade edge-exchange-plugins to v0.13.6
  - Add ChangeHero
- Upgrade edge-currency-monero to v0.4.2
  - Set `addressesChecked` to `false` on resync

## 2.18.1 (2022-07-28)

- Android: Disable Google AdID

## 2.18.0 (2022-07-13)

- Allow account deletion
- Fix possible broadcast error on fourth consecutive send
- Fix swept funds not immediately showing in balance
- Fix bitcoin-related wallets load failure on airplane mode
- Fix send/receive/stake button alignment
- Re-enable Feathercoin
- Display feeRateUsed for incoming bitcoin transactions
- Update Change Pin and Password scenes to UI2
- Add warning on PIN screen about needing password on first login
- Fix incorrect currency code shown in min and max amount swap error messages
- Live refresh users list in login scenes
- Fix token amount calculation in transaction details scene
- Rename existing 'delete' account features to 'forget'
- Refactor the contents of the WalletListCurrencyRow into CurrencyRow for reuse
- Modify scene wrapper to get rid of the white space at the bottom
- Fix crash when tapping on a wallet that is still loading
- Add skip button to Change Password after denying access to account
- Show/hide the password fields at the same time
- Replace all scene key constants with strings
- Update translations
- Various visual fixes
- Upgrade edge-core-js to v0.19.23
  - added: Add optional from/to parameter to min and max swap errors
  - upgrade: yaob dependency to include error serialization fix
  - added: New deleteRemoteAccount function to the EdgeAccount object
- Upgrade edge-currency-accountbased to v0.16.3
  - ETH: Fix network fee calculation
  - Add: All AAVE token for kovan
  - Change: Rename PAX token to USDP for ethereum
- Upgrade edge-currency-plugins v1.1.1
  - Fix: Add feathercoin blockbook server
  - Fix: Engine crashs on fetching server list network failure
  - Fix: Spend issues caused by not saving UTXOs locally without needing a network event
  - Change: Computes the sat/vByte used for a given transaction, and adds feeRateUsed object to the EdgeTransaction output.
- Upgrade edge-exchange-plugins v0.13.4
  - Godex: Fix min amount currency display
  - Exolix: Fix min amount currency display
  - LetsExchange: Update apiKey config
  - LetsExchange: Fix min amount currency display
  - Upgrade edge-core-js to v0.19.23
- Upgrade edge-login-ui-rn v0.10.7
  changed: Update forget account description text
  - changed: Update PIN description text
  - changed: Add titles for resecure password/pin scenes
  - changed: Add SKIP button for resecure password and pin scenes
  - changed: Move this library to its own Git repository.
  - fixed: Correctly document the native dependencies this library requires.
  - fixed: Automatically update the user list when it changes.
  - removed: No longer depend on @react-native-community/art.
  - rn: Create a UI2 ChangePinScene and reuse it for creating, changing and resecuring the pin code
  - rn: Create a UI2 ChangePasswordScene and reuse it for creating, changing and resecuring the password
  - rn: Sync password eyes
  - rn: remove unused strings
  - rn: remove unused redux states
  - rn: Update "react-redux" to version 7.2.4
  - rn: Add properly typed redux hooks
  - rn: Add the useHandler hook from edge-react-gui

## 2.17.0 (2022-06-22)

- Replace edge-currency-bitcoin with more performant edge-currency-plugins v1.0.0 based on bitcoin.js
- Replace Electrum backend with Blockbook
- Add Litecoin and Dash as default wallets
- Add import seed for bitcoin-based currencies
- Deprecate Changelly swap plugin
- Deprecate SMART, EBST, and FTC
- Improve list-scrolling performance
- Refactor the Scan Modal
- Refactor the WalletListSortModal to use the ListModal
- Refactor the SceneHeader into a memoized functional component
- Refactor CurrencySettingsScene to pull directly from plugin currencyInfos
- Update ExchangeQuoteComponent and remove unused DataRow and CardContent
- Use theme hooks instead of higher order components
- Fix deep link listener instability
- Fix incorrect fiat display until restart for new wallets
- Fix Invalid Password text alignment
- Switch BSV block explorer to WhatsOnChain.com
- Decrease swipeable row sensitivity
- Remove edge-currency-bitcoin
- Upgrade edge-core-js to v0.19.20
  - fixed: Loosen constraint for checking tx confirmation status in 'getTransaction' and Make the condition identical to the condition in onBlockHeightChanged.
  - added: New Confirmations API on EdgeTransaction type
- Upgrade edge-exchange-plugins to v0.13.2
  - Deprecate Changelly

## 2.16.2 (2022-06-10)

- ZEC: Add NU5 support
- Remove Edge Mastercard support
- Upgrade edge-currency-accountbased to v0.16.1
  - ETH: Break out testnets into their own plugins
  - ZEC: Upgrade react-native-zcash to v0.2.2
  - ETH: Remove internal transaction queries

## 2.16.0 (2022-06-07)

- Add Edge Mastercard support
- Replace Slider with SmartSlider component to prevent accidental duplicate sends
- Add `useHandler` hook as an optimized version of `useCallback`
- Fix manual wallet sort not saving order
- Minor visual and text fixes

## 2.15.0 (2022-06-01)

- Massive performance improvements and reduced resource usage
- Rewrite account callback management
- Add new swap partner LetsExchange
- MoonPay: Enable MATIC
- MoonPay: Enable Google Pay support
- Many theming customizations and improvements
- Deprecate exchange rate plugins and use new rates2 server
- Move token management to the core
- Re-Enable Spooky for TOMB Staking
- Implement Request for Payment Address (RPA) Protocol
- Implement new hook useCryptoText
- Implement new FiatText, CryptoText and TickerText components
- FIO: Update Binance Smart Chain currency code
- Always show flash, album, and enter address buttons on scan modal
- Increase number of simultaneous wallets loading on login
- Re-theme edge-login-ui-rn security modals
- FIO: Fix request list order
- Pass branding to password recovery and OTP repair scenes
- Re-theme CreateWalletOptionsScene
- Re-theme DefaultFiatSettingScene
- Redesign the Preferred Exchange modal
- Banxa: Re-enable PayID and POLi payment methods
- Changelly: Disable KNC
- Simplex: Hardcode $50-$20k min and max amounts
- Fix startup crash on Android 12
- Fix Buy Cryptocurrency button possible undefined label
- Add workaround for old Android device PBKDF2 failures
- Update several components to use tokenId
- Various text and visual fixes
- Update translations
- Upgrade edge-core-js to v0.19.18
  - added: EdgeCurrencyConfig.allTokens.
  - added: EdgeCurrencyWallet.currencyConfig.
  - added: EdgeCurrencyConfig.addCustomToken.
  - added: EdgeCurrencyConfig.changeCustomToken.
  - added: EdgeCurrencyConfig.removeCustomToken.
  - added: EdgeCurrencyWallet.changeEnabledTokenIds
  - added: EdgeCurrencyWallet.enabledTokenIds
  - added: Optional EdgeCurrencyEngine.changeCustomTokens
  - added: Optional EdgeCurrencyEngine.changeEnabledTokenIds
  - added: Optional EdgeCurrencyTools.getTokenId
  - changed: Save custom tokens to disk.
  - changed: Save enabled tokens to disk.
  - changed: Update the token API for currency plugins. Plugins should implement the new methods, then turn the old methods to no-ops.
  - fixed: Do not uselessly re-save the custom tokens on every login.
  - fixed: Correctly load custom tokens (regression from last release).
  - fixed: Correctly load tokens from the legacy settings file.
  - fixed: Correctly report errors when adding invalid custom tokens.
  - fixed: Do not erroneously enable tokens when editing their currency codes.
  - fixed: Never return undefined for EdgeCurrencyConfig.customTokens.
  - fixed: Handle token edits that change the tokenId or currencyCode.
  - deprecated: EdgeCurrencyWallet.addCustomToken.
  - deprecated: EdgeCurrencyWallet.changeEnabledTokens
  - deprecated: EdgeCurrencyWallet.disableTokens
  - deprecated: EdgeCurrencyWallet.enableTokens
  - deprecated: EdgeCurrencyWallet.getEnabledTokens
  - deprecated: EdgeCurrencyEngine.addCustomToken
  - deprecated: EdgeCurrencyEngine.disableTokens
  - deprecated: EdgeCurrencyEngine.enableTokens
  - deprecated: EdgeCurrencyEngine.getEnabledTokens
  - deprecated: EdgeCurrencyEngine.getTokenStatus
  - removed: Do not treat parent currencies as tokens. This logic was unused, so update the documentation.
- Upgrade edge-currency-accountbased to v0.16.0
  - Remove the enabledTokens from the cached data (walletLocalData) and filter unknown tokens out
  - Remove RPC node that returns false zero balances
  - Add getTokenId to ethereum and eos plugins
- Upgrade edge-core-js to v0.19.15
  - Upgrade @binance-chain/javascript-sdk to v4.2.0
  - Replaced eos checkAddress internal loop with regex
  - Fix XRP disconnect method
  - Fix tests
  - Fix plugin imports
  - Always initialize FIO sdk with a baseUrl
  - Fix FTM network fees test
  - Fix ftmInfo.js filename
  - Add timeout to getSupportedCurrencies test to prevent hanging
    Upgrade edge-currency-bitcoin to v4.9.23
  - DASH: Recognize the Instantlock for incoming Dash transactions
  - Work around Android PBKDF2 failures
- Upgrade edge-currency-monero to v0.4.1
  - Fix syncing when the user settings are empty
- Upgrade edge-login-ui-rn to v0.10.2
  - rn: Accept Branding props in OtpRepairScreen and PasswordRecoveryScreen to populate appName
  - rn: Allow passing a Theme object to the LoginUiProvider to provide custom theming of colors and fonts.
  - rn: Remove hardcoded uses of "Edge" and use appName parameter
  - rn: Upgrade to cleaners 0.3.12
  - rn: Upgrade Airship to 0.2.9
  - rn: Add dependency on react-native-svg which needs to be installed in parent application
  - rn: Fix incorrect logic for when Notification and Background App Refresh permissions as requested
  - rn: Fix the pin-login error message height

## 2.14.1 (2022-05-02)

- Use explicit gasPrice value for all transactions in stake workflow
- Add 'pending' blocktag to getTransactionCount for stake plugin
- Wallet Connect: Fix hex value handling
- Add Edge Provider utility to convert currency code array to EdgeTokenIdExtended array
- Upgrade edge-currency-accountbased to v0.15.9
  - Fix assignment of network fees from info server
  - Merge info server fees response with local data instead of overwriting
  - Round gas price values to ints before converting to hex
  - Prioritize the queried minGasLimit and minGasPrice over the default values
  - Add logging of fees
  - Add feeUpdateFrequency override and change FTM to 1 min
  - Change preference of fee providers
  - Do not overwrite baseFeeMultiplier coming from settings
  - Fix hex number handling
  - Update ZEC checkpoints

## 2.14.0 (2022-04-26)

- Add Tomb Swap
- Add yield farming on Tomb Finance
- Simplex: Add support for additional blockchains and tokens
- Add MAI token (Fantom)
- Add ability to show/hide password in text fields
- Change high fee modal layout
- Move exchange partner icons to CDN
- Allow easier theming
- Fix crash when checking if localized amount is equal to zero
- FIx security vault GIF
- Fix parent token icon overlay on flipinput
- Fix for race condition that resulted in setting the local token file multiple times with and and then without tokens
- Fix denominations and currency code issue in exchange details of transactions details modal
- Use the default wallet name when creating a wallet from create wallet row
- Various visual fixes
- Upgrade edge-currency-accountbased to v0.15.6
  - Add MAI token (miMATIC) to FTM (Fantom)
- Upgrade edge-currency-bitcoin v4.9.21
  - Round up fees for segwit transactions
- Upgrade edge-exchange-plugins to v0.13.0
  - Add new swap partner TombSwap
  - Add new swap partner LetsExchange
  - Coingecko: Add miMATIC (MAI)

## 2.13.1 (2022-04-15)

- Disabled SpookySwap

## 2.13.0 (2022-04-11)

- Add Tomb Finance's Masonry and Cemetery platforms
- New swap provider SpookySwap
- Upgrade React Native to v0.67.2
- Convert wallet list scenes and components to use React hooks
- Overlay parent currency icon on top of token icons
- New animated sync circle
- New animated wallet swipe list/row/buttons
- Refactor wallet list components to remove `GuiWallet` and unnecessary renders
- Fix wallet list swipe button navigation
- Split transfer transactions into two (QBO export)
- Anypay: Add support for multiple outputs and payment submission
- Fix crash related to wallet files and logout race condition
- Update FIO strings
- Development: Edge can now be built natively on M1 Macs without Rosetta
- Development: Add copy button to seed modals
- EdgeCoreWebView: Fix compiler errors on older Java versions
- EdgeCoreWebView: Unify the iOS & Andriod WebView message passing with `dispatchViewManagerCommand`
- EdgeCoreWebView: Move string manipulation off the main UI thread
- Removed unused util functions
- Address various deprecation warnings
- Various visual fixes
- Update translations
- Upgrade edge-core-js to v0.19.12
  - fixed: Avoid an internal crash on logout while reloading addresses.
  - fixed: Make our code compatible with older Java versions again.
  - fixed: Use the correct React dependency in the iOS podspec.
  - changed: Allow individual log sources to be set to silent.
  - changed: Move some string manipulations off of the main Java thread.
  - changed: Perform React Native disk accesses on their own threads.
- Upgrade edge-currency-accountbased to v0.15.3
  - Add etherscan fee sources across EVM chains
  - FTM: Add new tokens WFTM, TSHARE, TOMB, TBOND, and xBOO
  - FTM: Add additional rpc servers
  - Add blockbook broadcast method
  - Fix networkFees object initialization on resync
  - Fix checkTxsBlockbook so it doesn't break on unused addresses
  - Reduce some duplicate blockbook code
  - EOS/TLOS/WAX: Remove parent currency from metaTokens array
  - Add backwards-compatible apikey helper function
  - Update ZEC checkpoints
  - added: EdgeCurrencyInfo.canReplaceByFee
- Upgrade edge-exchange-plugins to v0.12.17
  - Add SpookySwap exchange plugin
  - Coingecko: Add TSHARE, TOMB, and MAI exchange rates
  - Transfer: Don't allow transfers if the currency code doesn't match
- Upgrade edge-currency-monero to v0.4.0
  - added: Move the forked code out of mymonero-core-js directly into this repo.
  - changed: Require react-native-mymonero-core ^0.1.2
- Upgrade react-native-fast-crypto to v2.2.0
  - changed: Compile secp256k1 as an XCFramework, making it compatible with the iOS simulator on M1 Macs.

## 2.12.1 (2022-03-29)

- Add Bitpay v2 to send scene
- Add wallet balance to request scene
- Fix flip input modal balance display
- Disable font scaling
- Remove Transak
- Upgrade edge-login-ui-rn to v0.9.31
  - rn: Remove allowFontScaling from text components
  - rn: Update dependency of react-native-keyboard-aware-scroll-view to 0.9.5 to fix an issue with react-native >= 0.65

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
  - _Breaking change_: This release contains a breaking change that was not indicated in the minor version update:
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
- **_BREAKING CHANGE_** Upgrade edge-core-js to v0.17.0

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
