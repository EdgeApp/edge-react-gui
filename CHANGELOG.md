# edge-react-gui

## 1.3.0

* Add support for ERC20 Tether, Digibyte, Bitcoin Gold, and Vertcoin
* Support buying Litecoin with credit card
* Add toggle to show fiat balances of wallets in Wallet List screen
* Add per transaction PIN spending limits
* Show transaction/event history of Simplex transactions
* Fix occasional error popup on login/logout
* Add onboarding screens for new accounts
* Fix QBO file format bugs causing errored imports
* Fix persistence of category field in transaction details
* Switch to Bugsnag for crash reporting
* Fix sweeping private keys for several currencies
* Fix slow max spend for several currencies
* Fix Cancel of sweeping private key not re-enabling scanner
* Fix several crashes
* Add cards to empty LTC, BTC, ETH, and BCH wallets to show user link to buy with credit card
* Do not show "No Amount Specified" error when user first scans Monero/XRP QR codes

## 1.2.4

* Add BIP70 support
* Change password reminder logic to step off twice as quickly after correct password
* Fix mint progress bar to be on top of blue region
* Remove IMP fiat currency since we don't have exchange rates for it
* Make show account balance toggle persistent
* Make progress bar start at about 10%
* Change settings for password recovery to show "Setup Password Recovery"
* Fix dropdown for iPhone X

edge-currency-bitcoin:
* BIP70
* Fix sweeping private keys for QTUM, DASH, LTC, FTC, XZC
* Rename UFO Coin -> UFO

edge-currency-ethereum:
* Update REP contract address

edge-currency-ripple:
* Switch currency name to XRP
* Update block explorer

## 1.2.3

* Bump Monero library 0.0.8
* Check for errors in encodeUri from invalid addresses
* Poll Edge Core for new QR code address if current public address is invalid

## 1.2.2

* Fix bugs with QBO/CSV export
* Add support for uniqueIdentifer (XRP destination tag / Monero payment ID)

## 1.2.1

* Support to hold, send, and receive Monero (XMR)
* Support to hold, send, and receive Ripple (XRP)
* Support for buying and selling Bitcoin using credit card via Simplex integration
* Ability to sweep private keys for Bitcoin, Bitcoin Cash, Litecoin, and Dash.
* Add side menu buttons for send/scan, request, exchange, buy, and sweep
* Remove Share button for view master private key modal
* Change progress bar to horizontally animated line
* Show more decimal places for fiat amounts if needed
* Make entire transaction notes tappable
* Fix Shapeshift order logic to prevent errors and speed up response
* Performance optimizations
* Add tracking of referral link used for install
* App behavior modification per referral link
* Export transaction history to CSV and Quickbooks (QBO) files
* Ability to restore deleted wallets

## 1.1.3

* Add links to ShapeShift order ID in transaction notes field
* Fix errors when switching wallets in Exchange screen
* Change Ethereum add-token URI format to `token-info`

edge-currency-bitcoin:
* Fix timeout errors on iOS due to react-native-tcp
* Improve Electrum server selection
* Improve spending reliability by broadcasting to API services as well as Electrum nodes

## 1.1.2

* Improve performance when selecting a wallet with lots of transactions
* Add support for FTC and XZC blockchains
* Add support for HUR and IND ERC20 tokens
* Utilize ShapeShift “precise” orders for accurate receive amounts
* Add progress indicator for wallet syncing transactions from network
* Fix token still appearing when custom token is deleted
* Use ‘bits’ as the default BTC and BCH denomination for new accounts
* Add ability to scan QR code to add custom token

edge-exchange-plugins
* Add CoinCap as an exchange rate source to cover more coins and tokens

edge-currency-bitcoin:
* Fix persistent timeout errors when sending LTC, BCH, BTC, and Dash

## 1.0.9

* Add BCH to default wallets for new accounts
* Fix hang for offline login
* Enable landscape mode for iOS tablets
* Fix rendering issues in landscape mode

edge-currency-bitcoin:
* Improve networking code to save server status/states more often. Fixes LTC connectivity issues

edge-core-js
* Remove dropped transactions from being reported to GUI

## 1.0.8

* Fix unconfirmed transactions having incorrect date
* Fix incorrect sort order of unconfirmed transactions
* Fix Request screen Copy button when using legacy addresses for BCH/LTC

## 1.0.7

* Significantly improved performance for accounts with large wallets
* Fix occasional crash when uploading logs
* Reduce disk storage requirements for app logs
* Allow displaying of legacy address formats for BCH and LTC
* Use new popup menu library to fix offscreen visibility issues
* Dynamic check of token availability from ShapeShift
* Change wording in wallet option popup
* Change styling of side menu drawer
* Only ask for Contacts permission when needed
* Dynamically size transaction details notes field
* Fix editing fiat value in transation details

edge-currency-ethereum:
* Allow Ethereum token currency codes to be 2-7 characters instead of 3-5
* Allow mixed case Ethereum token contract addresses
* Fix corrupt nativeAmount for some token transactions (ie. EOS)
* Show error when spending a Ethereum token when not enough ETH is available
* Dynamically set gas price using ethgasstation.info

edge-core-js:
* Fix account and wallet data sync while logged in
* Fix corrupt fiat amount in transactions to prevent GUI from crashing
* Improve error handling of TCP connection failures

## 1.0.6

* Fix crash on startup for Samsung Note 8 (update edge-login-ui-rn)
* Fix crash on login and signup on some Android devices (update react-native-fast-crypto)
* Fix missing popup on login when 2FA reset was requested
* Change custom Ethereum gas price to use GWei

## 1.0.5

* Improve handling of failed connection to blockchain nodes

## 1.0.4

* Fix Wallet List dropdown selector on iPhone X
* Use correct Bitcoin Cash logo

## 1.0.3

Improvements

* Add more info to Contact permission popup on use of Contacts information
* Make new Litecoin, Dash, and Bitcoin Cash wallets default to BIP44 mnemonic seeds

Fixes

* Minimize network requests on exchange screen
* Fix input corruption on Exchange screen
* Fix mining fee and max spend on exchange screen
* Fix PIN changes from Settings screen
* Properly show newly added custom tokens
* Make Ethereum spends more reliable
* Fix numeric entry on different locale numpads
* Fix exchange screen to provide spinner feedback while getting order
* Prevent spends to addresses of different format. Ie. LTC to BTC

