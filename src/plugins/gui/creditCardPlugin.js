// @flow
import { div, eq, gt, toFixed } from 'biggystring'
import { sprintf } from 'sprintf-js'

import s from '../../locales/strings'
import { type EdgeTokenId } from '../../types/types'
import { getPartnerIconUri } from '../../util/CdnUris.js'
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
import { dummyProvider2 } from './providers/dummyProvider2'

// TODO: Allow other fiat currency codes. Hard code USD for now
const providerFactories = [dummyProvider, dummyProvider2]

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
      const allowedFiats: { [fiatCurrencyCode: string]: boolean } = {}
      for (const assetMap of assetArray) {
        if (assetMap == null) continue
        for (const currencyPluginId in assetMap.crypto) {
          const currencyCodeMap = assetMap.crypto[currencyPluginId]
          for (const currencyCode in currencyCodeMap) {
            if (currencyCodeMap[currencyCode]) {
              allowedAssets.push({ pluginId: currencyPluginId, currencyCode })
            }
          }
          for (const fiatCode in assetMap.fiat) {
            allowedFiats[fiatCode] = true
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
      let goodQuotes: FiatProviderQuote[] = []

      const fiatCurrencyCode = coreWallet.fiatCurrencyCode
      const displayFiatCurrencyCode = fiatCurrencyCode.replace('iso:', '')

      let enterAmountMethods: FiatPluginGetMethodsResponse
      // Navigate to scene to have user enter amount
      await showUi.enterAmount({
        headerTitle: sprintf(s.strings.fiat_plugin_buy_currencycode, currencyCode),

        label1: sprintf(s.strings.fiat_plugin_amount_currencycode, displayFiatCurrencyCode),
        label2: sprintf(s.strings.fiat_plugin_amount_currencycode, currencyCode),
        initialAmount1: '500',
        getMethods: (methods: FiatPluginGetMethodsResponse) => {
          enterAmountMethods = methods
        },
        convertValue: async (sourceFieldNum: number, value: string): Promise<string | void> => {
          bestQuote = undefined
          goodQuotes = []
          if (eq(value, '0')) return ''
          const myCounter = ++counter
          let quoteParams: FiatProviderGetQuoteParams
          let sourceFieldCurrencyCode

          if (sourceFieldNum === 1) {
            // User entered a fiat value. Convert to crypto
            sourceFieldCurrencyCode = displayFiatCurrencyCode
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
            goodQuotes.push(quote)
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

          const exchangeRateText = getRateFromQuote(bestQuote, displayFiatCurrencyCode)
          if (enterAmountMethods != null) {
            const poweredByOnClick = async () => {
              // 1. Show modal with all the valid quotes
              const items = goodQuotes.map(quote => {
                let text
                if (sourceFieldNum === 1) {
                  // User entered a fiat value. Show the crypto value per partner
                  text = `(${toFixed(quote.cryptoAmount, 0, 6)} ${quote.tokenId?.tokenId ?? ''})`
                } else {
                  // User entered a crypto value. Show the fiat value per partner
                  text = `(${toFixed(quote.fiatAmount, 0, 2)} ${quote.fiatCurrencyCode.replace('iso:', '')})`
                }
                const out = {
                  text,
                  name: quote.pluginDisplayName,
                  icon: getPartnerIconUri(quote.partnerIcon)
                }
                return out
              })
              const rowName = await showUi.listModal({
                title: 'Providers',
                selected: bestQuote?.pluginDisplayName ?? '',
                items
              })
              if (bestQuote == null) return

              // 2. Set the best quote to the one chosen by user (if any is chosen)
              if (rowName != null && rowName !== bestQuote.pluginDisplayName) {
                bestQuote = goodQuotes.find(quote => quote.pluginDisplayName === rowName)
                if (bestQuote == null) return

                // 3. Set the status text and powered by
                const statusText = getRateFromQuote(bestQuote, displayFiatCurrencyCode)
                enterAmountMethods.setStatusText({ statusText })
                enterAmountMethods.setPoweredBy({ poweredByText: bestQuote.pluginDisplayName, poweredByIcon: bestQuote.partnerIcon, poweredByOnClick })
              }
            }

            enterAmountMethods.setStatusText({ statusText: exchangeRateText })
            enterAmountMethods.setPoweredBy({ poweredByText: bestQuote.pluginDisplayName, poweredByIcon: bestQuote.partnerIcon, poweredByOnClick })
          }
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

const getRateFromQuote = (quote: FiatProviderQuote, fiatCode: string): string => {
  const bestRate = div(quote.fiatAmount, quote.cryptoAmount, 16)
  const exchangeRateText = `1 ${quote.tokenId?.tokenId ?? ''} = ${toFixed(bestRate, 0, 2)} ${fiatCode}`
  return exchangeRateText
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
