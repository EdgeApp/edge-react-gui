# edge-currency-bitcoin

# 4.6.3 (2019-10-30)

- Add 'sats' as denomination for BTC and TBTC

# 4.6.2 (2019-09-25)

- Revert modification of `InsufficientFundsError` import

# 4.6.1 (2019-09-25)

- Fix `InsufficientFundsError` import issue

# 4.6.0 (2019-09-19)

- Enable Bitcoin testnet

# 4.5.5 (2019-09-18)

- Fix the message-signing feature (for real this time).

# 4.5.4 (2019-09-06)

- Fix the message-signing feature.
- Make signatures compatible with the standard p2pkh format.
- Move the feature to a standalone API method.

# 4.5.3 (2019-09-03)

- Fix Dogecoin block parsing

# 4.5.2 (2019-08-22)

- Clean up yarn audit dependencies
- Remove max fee from plugins (handled in GUI instead)
- Fix CORS issue for Blockchain.info transaction broadcasting

# 4.5.1 (2019-08-02)

- Ad-hoc version bump

# 4.5.0 (2019-08-02)

- Implementation of websockets for stratum connections

# 4.4.0 (2019-07-25)

- Allow more currencies to be broadcast by Blockchair: BTC, BCH, LTC, BSV, DASH, GRS

# 4.3.1 (2019-07-24)

- Remove Insight (BitPay) as broadcaster for BCH to fix broadcast errors

# 4.3.0 (2019-07-22)

- Include input and output information in `debugInfo` property of transaction `otherParams`

# 4.2.9 (2019-07-19)

- Use blockChair API for DOGE transaction broadcasting

# 4.2.8 (2019-07-17)

- Make lastScoreUpTime_ global
- Limit reconnectCounter (electrum) to 5 seconds instead of 30

# 4.2.7 (2019-07-12)

- Upgrade GRS to use BlockChair
- Execute "score up" (no point increase) upon electrum hash subscribe
- Disable BlockCypher for transactions broadcsts

# 4.2.6 (2019-07-09)

- Fix disconnection issue while phone is sleeping.
- Fix "UTXO not synced yet" error while spending after clearing caches.

# 4.2.5 (2019-06-10)

- Throw actual `InsufficientFundsError` instances.

# 4.2.4 (2019-06-06)

- Change Ravencoin block explorer

# 4.2.3 (2019-05-30)

- Fix fee-estimation algorithm to properly use vendor data

# 4.2.2 (2019-05-28)

- Implementation of Ravencoin (RVN)

# 4.2.1 (2019-05-23)

- Fix eBoost parameters.
- Change Dogecoin block explorers.
- Do not broadcast Dash transactions through blockcypher.

# 4.2.0 (2019-05-21)

- Add Dogecoin

# 4.1.0 (2019-05-03)

- Add support for Stratum v1.4

# 4.0.11 (2019-05-01)

- Modify score of re-added servers to -10 to help prioritize them over dropped servers.

# 4.0.10 (2019-04-24)

- Change Earn.com Bitcoin mining fee API URL
- Remove blocking mining fee fetch from makeSpend

# 4.0.9 (2019-04-24)

- Change Vertcoin block explorer

# 4.0.8 (2019-04-22)

- Fix Litecoin electrum server algorithm

# 4.0.7 (2019-04-18)

- Fix console logging

# 4.0.6-alpha (2019-04-15)

- Fix more mining fee issues

# 4.0.5 (2019-04-04)

- Avoid outrageous mining fees found in the next-block confirmation window.

# 4.0.4 (2019-04-02)

- Change LTC explorer to blockchair.com.
- Fix BCH -> BSV splitting.

# 4.0.3 (2019-03-22)

- Fix fee estimation for P2WPKH nested inside of P2SH

# 4.0.2 (2019-03-21)

- Report unconfirmed transaction block height as 0
- Throttle network calls (external servers)

# 4.0.1 (2019-02-26)

- Disable `derivePublicKeys`, which never quite worked right to begin with.

# 4.0.0 (2019-02-19)

- Upgrade to the edge-core-js v0.15.0 and adapt to breaking changes.

## 3.8.0 (2019-02-18)

- Change BSV explorer to blockchair.com
- Fix failing unit tests
- Prevent connections from being permanently dropped
- Update the build system to match edge-core-js
- Update to edge-core-js v0.14.0 & make use of new Disklet API

## 3.7.11

- Fix error when 2 makeSpends are done back to back and previous one is used for signTx

## 3.7.10

- Adjust BTC mining fees to target higher range

## 3.7.9

- Sanitize edgeTransaction returned from makeSpend to make it bridge compatible

## 3.7.8

- Fix Groestlcoin spelling

## 3.7.7

- Fixed the issue with sending Digibyte.
- Fixed the issue with sending Segwit transaction from a currency with a custom txHash (Like groestlcoin)
- Changed some comments to have better wording and less junk in them
- Removed some dependencies that were unused for faster build times

## 3.7.6

- Use new colored icons

## 3.7.5

- Fix sigHash for segwit transactions

## 3.7.4

- Fix smartcash icons

## 3.7.3

- Add Groestlcoin
- Add SmartCash
- Fix Flow compatibility with edge-core-js v0.13.0

## 3.7.2

- Fix BSV Block Explorer URL

## 3.7.1

- Rewrote the custom scripts part to allow for much much more flexebility when creating the scripts.
  Allows to almost use the full power or bitcoin scripting.
- Some flow fixes.
- Updated dependencies.

## 3.7.0

- Add BitcoinSV.
- Add a way to pass in custom scripts (currently used for replay protection) into makespend.
- Fix some meaningless error messages.
- Add support for Stratum v1.2 & v1.3.

## 3.6.1

- Fixed issue where as saveTX wouldn't call onTransactionsChanged.
- Round up the fee we get from bitpay incase since we work in sat/byte and not sat/kb
- privateKey.toPublic had an issue where it would bassicly create a null valued public key. now it works as it should and gives the correct key.

## 3.6.0

- Do not call onTransactionsChanged at startEngine or makeEngine. edge-core-js will query getTransactions when needed
- Reduce concurrent server connections from 3 to 2
- Change testing electrum server and give 10s timeout
- Prevent calling unaccelerated publicToPrivate when logging in. Saves 200ms per wallet on slower devices (LG V20)
- Give up JS tick between calls to getTransaction so GUI can render in between a long sync call to getTransactions
- Properly save header/server cache when progress hits 100%

## 3.5.1

- When server override is enabled, do not broadcast to any other servers
- Tweak fee estimates to target 2-8 blocks

## 3.5.0

- Update the Path from which to get the Digibyte electrum servers.
  Previous versions won't be able to get the server list so they won't be able to sync.

## 3.4.1

- Fix eboost logo file names
- Remove BIP70 support and make all payment protocol request use Bitpay JSON protocol
- Fix payment protocol requests for React Native Android to use custom native module fetch to fix issue
  with RN's fetch not being compatible with Bitpay

## 3.4.0

- Use pluginName as unique currency ID and leave currencyName as human readable
- Change currencyName for BitcoinCash -> Bitcoin Cash
- Remove support for parsing xpriv/seeds (untested)
- Add eboost support
- Implement changeSettings endpoint

## 3.3.2

- Remove non-standard elvis operator

## 3.3.1

- Using Bitpay Proprietary API for bip70 payments

## 3.3.0

- bip70 is working for both Bitcoin and Bitcoin cash (in fact it should work for ALL coins now)
- Change Digibyte symbol from `Ð` to `Ɗ`
- All of the dependencies are now up to date
- Improved Jenkinsfile

## 3.2.9

- Fixed an issue when trying to send money to a network that has both Segwit and a legacy address format (like Litecoin or UFO).

## 3.2.8

- Fixed issues when sweeping bitcoin gold
- Fixed an issues with sweeping private keys from non compressed private keys

## 3.2.7

- Fix a param on digibyte
- Fix issues with sweeping private keys on networks without segwit

## 3.2.6

- fix a bug in the throttling of updateFee

## 3.2.5

- fixed minor bitcoin gold issues
- disable support for bip70 for bitcoincash for now

## 3.2.4

- Made all currency query the infoServer for electrum servers and fee info.

## 3.2.3

- Allow get headers electrum call to return nonce of number or string

## 3.2.2

- changed dogecoin icon to an URI
- updated edge-core-js

## 3.2.1

- reordered the walletTypes before we will completely remove them

## 3.2.0

- Add Vertcoin
- Add Dodgecoin
- Add Digibyte

## 3.1.1

- Add missing default wallet type to QTUM

## 3.1.0

- Pass in optional params to createPrivateKeys
- Add legacy address to UFO coin
- Generelize the legacy and cashAddress mechanisms

## 3.0.1

- allow `forks` to be optional inside bcoinInfo

## 3.0.0

### BREAKING CHANGES

- Stop supporting receiving the wallet format as type of the wallet type.
  For example, `wallet:bitcoin-bip44` is not supported anymore.
  The CORRECT way to pass in the wallet format is inside the keys object which is in the walletInfo.
  Example:

  ```js
  walletInfo = {
    keys: {
      seed: "whatever whatever whatever whatever whatever whatever whatever",
      format: "bip49"
    }
  };
  ```

- Split each currency Info into 3 different config objects depends on the where and how they are going to be used:

  1. bcoinInfo - The data needed to extend Bcoin into supporting the currency
  2. engineInfo - The hard coded data needed to configure the engine for the currency
  3. currencyInfo - The original EdgeCurrencyInfo needed to be passed on to core/gui according to the API specs - This got ALOT cleaner

  Also typed everything so no more using `defaultSettings` which was typed as Any as a garbage hole where we stuffed everything we didn't know where to put.
  Everything is now strongly typed so keep it like that.

### New Features

- `getSplittableTypes` API to the plugin.
- bip84 wallet type as default to the networks that supports it.
- Settings and factories for `BitcoinGold` and `BitcoinGoldTestnet`.

### Fix

- Two Way Replay Protection scheme.
- `sweepPrivateKey` only signed with a key corresponding to the wallet type. Now we try all possible combinations.

## 2.22.0

- Full support for the SIGHASH_FORKID two-way replay protection scheme (For forks like bcash and bgold)
- Full support for bip84 wallets.
- Removed all of the \$FlowFixMe (except for the one for 'buffer-hack') from the code.
- Refactored the code so that almost all (around 90%) of the references to bcoin and its' implementation details are hidden inside a utility function (in the utils folder) and not spread all over the code base.

## 2.21.9

- Use a different network specific header for fetching paymentRequests

## 2.21.8

- Changed currency name for ufo from 'UFO Coin' to 'UFO'

## 2.21.7

- Fix headers for bip70 payment request

## 2.21.6

- update the lock file to get the new bcoin with bip70

## 2.21.3

- Re-enable support for Bip70

## 2.21.2

- Fix sweepPrivKey for the following coins: Dash, Litecoin, Feathercoin, Zcoin

## 2.21.1

- Update icons and explorers

## 2.21.0

- Add support for Bip70

## 2.20.1

- Re-order bitcoin wallet types to put segwit up top

## 2.18.0

- Add private key sweeping.

## 2.17.1

- Add broadcast APIs for BTC, BCH, LTC, and DASH
- Improve serverCache usage by depleting all servers returned for getServers before asking for new servers

## 2.17.0

- Add support for FTC and XZC
- Fix crash when no info server is specified for a coin

## 2.16.3

- Set the response time if serverScoreDown() is called. This prevents this server from being considered "new" and being tried again in the future at the top of the list.
- Fix port numbers for zcoin electrum servers
- Fix zcoin block explorer urls
- Completely ignore electrums: urls for now

## 2.16.2

- Catch errors from stratum servers

## 2.16.1

- Fix unhandled exception due to LTC transactions with bech32 outputs

## 2.16.0

- Allow for Parse Uri to recognize legacy address

## 2.15.0

- Add Zcoin support
- Fix throw in getTransaction when tx has an OP_RETURN

## 2.14.11

- Filter uncofimred UTXO's the pendingTxids list for servers that return uncofimred UTXO's as part of the tx history.
- Better caching mechanism
- Use the "onAddressesChecked" callback to return a value between 0 and 1 for how "synced" the engine is.
- Styling fixes
- Flow fixes
- Tests fixes

## 2.14.10

- Return Transaction date in seconds and not miliseconds

## 2.14.9

- Fix .flowconfig to include all src files
- Fix flow errors from possibly undeclared vars
- Upgrade edge-core-js to 0.6.3 which includes Flow def for EdgeEncodeUri.legacyAddress

## 2.14.8

- Fix Flow errors

## 2.14.7

- Use edge-core-js instead of edge-login
