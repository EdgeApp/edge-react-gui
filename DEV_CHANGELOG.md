# edge-react-gui

## 1.12.1 (2020-04-17)

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

- Upgrade edge-exchange-plugins to v0.10.1
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

- Add FIO currency support
  - Includes new screens to view and register new FIO addresses
- Upgrade edge-currency-accountbased to v0.7.1
  - FIO currency
  - XLM transaction history fix
- Upgrade edge-core-js to v0.16.25
  - Prioritize swap providers with active promo codes.

## 1.11.10 (2020-04-01)

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

- Add priority setting for exchange rate providers
- Fix white screen crash on settings screen
- Enhanced deeplink support
- Upgrade edge-login-ui-rn to v0.6.8
  - Added auto-scroll on terms and conditions screen
- Upgrade edge-currency-accountbased to v0.6.9
  - Add response error checking to fetch() calls
  - Fixed crash when Etherscan API returned text rather than a number by adding decimal and hex regex to response validation
