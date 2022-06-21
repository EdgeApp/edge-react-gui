// @flow
import { div, eq, gt, toFixed } from 'biggystring'
import { sprintf } from 'sprintf-js'

import s from '../../locales/strings'
import { type EdgeTokenId } from '../../types/types'
import { type FiatPlugin, type FiatPluginFactory, type FiatPluginFactoryArgs } from './fiatPluginTypes'
import { type FiatProviderGetQuoteParams, type FiatProviderQuote } from './fiatProviderTypes'
import { dummyProvider } from './providers/dummyProvider'

const providerFactories = [dummyProvider]

const promiseWithTimeout = <T>(promise: Promise<T>, timeoutMs: number = 5000): Promise<T> | Promise<void> =>
  Promise.race([promise, new Promise((resolve, reject) => setTimeout(() => resolve(undefined), timeoutMs))])

const safePromise = <T>(promise: Promise<T>): Promise<T> | Promise<void> => promise.catch(e => undefined)

export const creditCardPlugin: FiatPluginFactory = async (params: FiatPluginFactoryArgs) => {
  const pluginId = 'creditcard'
  const { showUi, account } = params

  const assetPromises = []
  const providerPromises = []
  for (const providerFactory of providerFactories) {
    providerPromises.push(providerFactory.makeProvider({ io: {} }))
  }
  const providers = await Promise.all(providerPromises)
  for (const provider of providers) {
    assetPromises.push(promiseWithTimeout(safePromise(provider.getSupportedAssets())))
  }
  // const store = createStore(account.dataStore, pluginId)

  const fiatPlugin: FiatPlugin = {
    pluginId,
    startPlugin: async () => {
      const assetArray = await Promise.all(assetPromises)

      const allowedAssets: EdgeTokenId[] = []
      for (const assetMap of assetArray) {
        if (assetMap == null) continue
        for (const currencyPluginId in assetMap) {
          const currencyCodeMap = assetMap[currencyPluginId]
          for (const currencyCode in currencyCodeMap) {
            if (currencyCodeMap[currencyCode]) {
              allowedAssets.push({ pluginId: currencyPluginId, currencyCode })
            }
          }
        }
      }

      // Pop up modal to pick wallet/asset
      const walletListResult: { walletId: string | void, currencyCode: string | void } = await showUi.walletPicker({
        headerTitle: s.strings.fiat_plugin_select_asset_to_purchase,
        allowedAssets,
        showCreateWallet: true
      })

      const { walletId, currencyCode } = walletListResult
      if (walletId == null || currencyCode == null) return

      const coreWallet = account.currencyWallets[walletId]
      const currencyPluginId = coreWallet.currencyInfo.pluginId
      if (!coreWallet) return showUi.errorDropdown(new Error(`Missing wallet with ID ${walletId}`))

      let counter = 0
      let bestQuote: FiatProviderQuote | void

      // Navigate to scene to have user enter amount
      await showUi.enterAmount({
        headerTitle: sprintf(s.strings.fiat_plugin_buy_currencycode, currencyCode),

        // TODO: Allow other fiat currency codes. Hard code USD for now
        label1: sprintf(s.strings.fiat_plugin_amount_currencycode, 'USD'),
        label2: sprintf(s.strings.fiat_plugin_amount_currencycode, currencyCode),
        initialAmount1: '500',
        convertValue: async (sourceFieldNum: number, value: string): Promise<string | void> => {
          if (eq(value, '0')) return ''
          const myCounter = ++counter
          let quoteParams: FiatProviderGetQuoteParams

          if (sourceFieldNum === 1) {
            // User entered a fiat value. Convert to crypto
            quoteParams = {
              tokenId: { pluginId: currencyPluginId, tokenId: currencyCode },
              exchangeAmount: value,
              fiatCurrencyCode: coreWallet.fiatCurrencyCode,
              amountType: 'fiat',
              direction: 'buy'
            }
          } else {
            // User entered a crypto value. Convert to fiat
            quoteParams = {
              tokenId: { pluginId: currencyPluginId, tokenId: currencyCode },
              exchangeAmount: value,
              fiatCurrencyCode: coreWallet.fiatCurrencyCode,
              amountType: 'crypto',
              direction: 'buy'
            }
          }

          const quotePromises = providers.map(p => promiseWithTimeout(safePromise(p.getQuote(quoteParams))))
          const quotes = await Promise.all(quotePromises)

          // Only update with the latest call to convertValue
          if (myCounter !== counter) return

          let bestQuoteRatio = '0'
          for (const quote of quotes) {
            if (quote == null) continue
            if (quote.direction !== 'buy') continue
            const quoteRatio = div(quote.cryptoAmount, quote.fiatAmount, 16)
            if (gt(quoteRatio, bestQuoteRatio)) {
              bestQuoteRatio = quoteRatio
              bestQuote = quote
            }
          }
          if (bestQuote == null) return

          if (sourceFieldNum === 1) {
            return toFixed(bestQuote.cryptoAmount, 0, 6)
          } else {
            return toFixed(bestQuote.fiatAmount, 0, 2)
          }
        }
      })

      if (bestQuote == null) showUi.popScene()
      showUi.popScene()
    }
  }
  return fiatPlugin
}
