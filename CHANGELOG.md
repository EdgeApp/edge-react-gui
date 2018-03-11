# edge-react-gui

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

