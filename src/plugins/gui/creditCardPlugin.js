// @flow
import { div, eq, gt, toFixed } from 'biggystring'
import { sprintf } from 'sprintf-js'

import s from '../../locales/strings'
import { type EdgeTokenId } from '../../types/types'
import { fuzzyTimeout } from '../../util/utils'
import { type FiatPlugin, type FiatPluginFactory, type FiatPluginFactoryArgs, type FiatPluginGetMethodsResponse } from './fiatPluginTypes'
import {
  type FiatProviderGetQuoteParams,
  type FiatProviderQuote,
  type FiatProviderQuoteError,
  type FiatProviderQuoteErrorTypes,
  FiatProviderError
} from './fiatProviderTypes'
import { dummyProvider } from './providers/dummyProvider'

// TODO: Allow other fiat currency codes. Hard code USD for now
const FIAT_SUPPORTED = 'USD'
const providerFactories = [dummyProvider]

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
    assetPromises.push(provider.getSupportedAssets())
  }
  // const store = createStore(account.dataStore, pluginId)

  const fiatPlugin: FiatPlugin = {
    pluginId,
    startPlugin: async () => {
      const assetArray = await fuzzyTimeout(assetPromises, 5000).catch(e => [])

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

      let enterAmountMethods: FiatPluginGetMethodsResponse
      // Navigate to scene to have user enter amount
      await showUi.enterAmount({
        headerTitle: sprintf(s.strings.fiat_plugin_buy_currencycode, currencyCode),

        label1: sprintf(s.strings.fiat_plugin_amount_currencycode, FIAT_SUPPORTED),
        label2: sprintf(s.strings.fiat_plugin_amount_currencycode, currencyCode),
        initialAmount1: '500',
        getMethods: (methods: FiatPluginGetMethodsResponse) => {
          enterAmountMethods = methods
        },
        convertValue: async (sourceFieldNum: number, value: string): Promise<string | void> => {
          bestQuote = undefined
          if (eq(value, '0')) return ''
          const myCounter = ++counter
          let quoteParams: FiatProviderGetQuoteParams
          let sourceFieldCurrencyCode

          if (sourceFieldNum === 1) {
            // User entered a fiat value. Convert to crypto
            sourceFieldCurrencyCode = FIAT_SUPPORTED
            quoteParams = {
              tokenId: { pluginId: currencyPluginId, tokenId: currencyCode },
              exchangeAmount: value,
              fiatCurrencyCode: coreWallet.fiatCurrencyCode,
              amountType: 'fiat',
              direction: 'buy'
            }
          } else {
            // User entered a crypto value. Convert to fiat
            sourceFieldCurrencyCode = currencyCode
            quoteParams = {
              tokenId: { pluginId: currencyPluginId, tokenId: currencyCode },
              exchangeAmount: value,
              fiatCurrencyCode: coreWallet.fiatCurrencyCode,
              amountType: 'crypto',
              direction: 'buy'
            }
          }

          const quotePromises = providers.map(p => p.getQuote(quoteParams))
          let errors = []
          let quotes = []
          quotes = await fuzzyTimeout(quotePromises, 5000).catch(e => {
            errors = e
            return []
          })

          // Only update with the latest call to convertValue
          if (myCounter !== counter) return

          let bestQuoteRatio = '0'
          for (const quote of quotes) {
            if (quote.direction !== 'buy') continue
            const quoteRatio = div(quote.cryptoAmount, quote.fiatAmount, 16)
            if (gt(quoteRatio, bestQuoteRatio)) {
              bestQuoteRatio = quoteRatio
              bestQuote = quote
            }
          }

          if (bestQuote == null) {
            // Find the best error to surface
            const bestErrorText = getBestError(errors, sourceFieldCurrencyCode) ?? s.strings.fiat_plugin_buy_no_quote
            if (enterAmountMethods != null) enterAmountMethods.setStatusText({ statusText: bestErrorText, options: { textType: 'error' } })
            return
          }

          const bestRate = div(bestQuote.fiatAmount, bestQuote.cryptoAmount, 16)
          const exchangeRateText = `1 ${currencyCode} = ${toFixed(bestRate, 0, 2)} ${FIAT_SUPPORTED}`
          if (enterAmountMethods != null) enterAmountMethods.setStatusText({ statusText: exchangeRateText })
          if (sourceFieldNum === 1) {
            return toFixed(bestQuote.cryptoAmount, 0, 6)
          } else {
            return toFixed(bestQuote.fiatAmount, 0, 2)
          }
        }
      })

      showUi.popScene()
      if (bestQuote == null) {
        return
      }
      await bestQuote.approveQuote({ showUi })
    }
  }
  return fiatPlugin
}

const ERROR_PRIORITIES: { [errorType: FiatProviderQuoteErrorTypes]: number } = {
  underLimit: 1,
  overLimit: 2,
  regionRestricted: 3,
  assetUnsupported: 4
}

const ERROR_TEXT = {
  underLimit: s.strings.fiat_plugin_buy_amount_under_limit,
  overLimit: s.strings.fiat_plugin_buy_amount_over_limit,
  regionRestricted: s.strings.fiat_plugin_buy_region_restricted,
  assetUnsupported: s.strings.fiat_plugin_asset_unsupported
}

export const getBestError = (errorQuotes: FiatProviderError[], currencyCode: string): string | void => {
  let bestError: FiatProviderQuoteError | void
  for (const eq of errorQuotes) {
    const errorQuote = eq.quoteError
    if (errorQuote == null) continue
    if (bestError == null) {
      bestError = errorQuote
      continue
    }
    if (ERROR_PRIORITIES[errorQuote.errorType] < ERROR_PRIORITIES[bestError.errorType]) {
      bestError = errorQuote
      continue
    }
    if (ERROR_PRIORITIES[errorQuote.errorType] === ERROR_PRIORITIES[bestError.errorType]) {
      if (errorQuote.errorType === 'overLimit' && bestError.errorType === 'overLimit') {
        if (errorQuote.errorAmount > bestError.errorAmount) {
          bestError = errorQuote
        }
      } else if (errorQuote.errorType === 'underLimit' && bestError.errorType === 'underLimit') {
        if (errorQuote.errorAmount < bestError.errorAmount) {
          bestError = errorQuote
        }
      }
    }
  }
  if (bestError == null) return
  let errorText = ERROR_TEXT[bestError.errorType]
  if (bestError.errorType === 'underLimit' || bestError.errorType === 'overLimit') {
    errorText = sprintf(errorText, bestError.errorAmount.toString() + ' ' + currencyCode)
  }
  return errorText
}
