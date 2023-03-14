import { div, eq, gt, toFixed } from 'biggystring'
import { asMap, asNumber } from 'cleaners'
import { sprintf } from 'sprintf-js'

import { ENV } from '../../env'
import { formatNumber, isValidInput } from '../../locales/intl'
import s from '../../locales/strings'
import { config } from '../../theme/appConfig'
import { EdgeTokenId } from '../../types/types'
import { getPartnerIconUri } from '../../util/CdnUris'
import { getTokenId } from '../../util/CurrencyInfoHelpers'
import { fetchInfo } from '../../util/network'
import { logEvent } from '../../util/tracking'
import { fuzzyTimeout } from '../../util/utils'
import { FiatPlugin, FiatPluginFactory, FiatPluginFactoryArgs, FiatPluginGetMethodsResponse, FiatPluginStartParams } from './fiatPluginTypes'
import { FiatProvider, FiatProviderAssetMap, FiatProviderGetQuoteParams, FiatProviderQuote } from './fiatProviderTypes'
import { createStore, getBestError, getRateFromQuote } from './pluginUtils'
import { banxaProvider } from './providers/banxaProvider'
import { moonpayProvider } from './providers/moonpayProvider'
import { simplexProvider } from './providers/simplexProvider'

const asFiatPluginPriorities = asMap(asMap(asNumber))

interface FiatPluginPriority {
  [pluginId: string]: number
}
type PriorityArray = Array<{ [pluginId: string]: boolean }>

// TODO: Allow other fiat currency codes. Hard code USD for now
const providerFactories = [simplexProvider, moonpayProvider, banxaProvider]

export const creditCardPlugin: FiatPluginFactory = async (params: FiatPluginFactoryArgs) => {
  const pluginId = 'creditcard'
  const { disablePlugins, showUi, account } = params

  const assetPromises: Array<Promise<FiatProviderAssetMap>> = []
  const providerPromises: Array<Promise<FiatProvider>> = []
  let priorityArray = [{}]
  let pluginPriority = {}

  for (const providerFactory of providerFactories) {
    if (disablePlugins[providerFactory.pluginId]) continue
    // @ts-expect-error
    priorityArray[0][providerFactory.pluginId] = true
    // @ts-expect-error
    const apiKeys = ENV.PLUGIN_API_KEYS[providerFactory.pluginId]
    if (apiKeys == null) continue
    const store = createStore(providerFactory.storeId, account.dataStore)
    providerPromises.push(providerFactory.makeProvider({ io: { store }, apiKeys }))
  }
  if (providerPromises.length === 0) throw new Error('No enabled creditCardPlugin providers')

  const providers = await Promise.all(providerPromises)
  for (const provider of providers) {
    assetPromises.push(provider.getSupportedAssets())
  }

  try {
    const response = await fetchInfo(`v1/fiatPluginPriority/${config.appId ?? 'edge'}`)
    pluginPriority = asFiatPluginPriorities(await response.json())
    // @ts-expect-error
    priorityArray = createPriorityArray(pluginPriority[pluginId])
  } catch (e: any) {
    console.log(e.message)
    // This is ok. We just use default values
  }

  const fiatPlugin: FiatPlugin = {
    pluginId,
    startPlugin: async (params: FiatPluginStartParams) => {
      const { isBuy, regionCode, paymentTypes, providerId } = params
      const ps = fuzzyTimeout(assetPromises, 5000).catch(e => [])
      const assetArray = await showUi.showToastSpinner(s.strings.fiat_plugin_fetching_assets, ps)

      const allowedAssets: EdgeTokenId[] = []
      const allowedFiats: { [fiatCurrencyCode: string]: boolean } = {}
      for (const assetMap of assetArray) {
        if (assetMap == null) continue
        for (const currencyPluginId in assetMap.crypto) {
          const currencyCodeMap = assetMap.crypto[currencyPluginId]
          for (const currencyCode in currencyCodeMap) {
            if (currencyCodeMap[currencyCode]) {
              try {
                const currencyTokenId = getTokenId(account, currencyPluginId, currencyCode)
                allowedAssets.push({ pluginId: currencyPluginId, tokenId: currencyTokenId })
              } catch (e: any) {
                // This is ok. We might not support a specific pluginId
              }
            }
          }
          for (const fiatCode in assetMap.fiat) {
            allowedFiats[fiatCode] = true
          }
        }
      }

      // Pop up modal to pick wallet/asset
      const walletListResult: { walletId: string | undefined; currencyCode: string | undefined } = await showUi.walletPicker({
        headerTitle: s.strings.fiat_plugin_select_asset_to_purchase,
        allowedAssets,
        showCreateWallet: true
      })

      const { walletId, currencyCode } = walletListResult
      if (walletId == null || currencyCode == null) return

      const coreWallet = account.currencyWallets[walletId]
      const currencyPluginId = coreWallet.currencyInfo.pluginId
      if (!coreWallet) return showUi.showError(new Error(`Missing wallet with ID ${walletId}`))

      let counter = 0
      let bestQuote: FiatProviderQuote | undefined
      let goodQuotes: FiatProviderQuote[] = []

      const fiatCurrencyCode = coreWallet.fiatCurrencyCode
      const displayFiatCurrencyCode = fiatCurrencyCode.replace('iso:', '')

      let enterAmountMethods: FiatPluginGetMethodsResponse
      // Navigate to scene to have user enter amount
      await showUi.enterAmount({
        headerTitle: sprintf(s.strings.fiat_plugin_buy_currencycode, currencyCode),
        isBuy,

        label1: sprintf(s.strings.fiat_plugin_amount_currencycode, displayFiatCurrencyCode),
        label2: sprintf(s.strings.fiat_plugin_amount_currencycode, currencyCode),
        initialAmount1: '500',
        getMethods: (methods: FiatPluginGetMethodsResponse) => {
          enterAmountMethods = methods
        },
        convertValue: async (sourceFieldNum: number, value: string): Promise<string | undefined> => {
          if (!isValidInput(value)) {
            if (enterAmountMethods != null)
              enterAmountMethods.setStatusText({ statusText: s.strings.create_wallet_invalid_input, options: { textType: 'error' } })
            return
          }
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
              direction: 'buy',
              paymentTypes,
              regionCode
            }
          } else {
            // User entered a crypto value. Convert to fiat
            sourceFieldCurrencyCode = currencyCode
            quoteParams = {
              tokenId: { pluginId: currencyPluginId, tokenId: currencyCode },
              exchangeAmount: value,
              fiatCurrencyCode: coreWallet.fiatCurrencyCode,
              amountType: 'crypto',
              direction: 'buy',
              paymentTypes,
              regionCode
            }
          }

          const quotePromises = providers.filter(p => (providerId == null ? true : providerId === p.pluginId)).map(async p => p.getQuote(quoteParams))
          let errors: unknown[] = []
          const quotes = await fuzzyTimeout(quotePromises, 5000).catch(e => {
            errors = e
            return []
          })

          // Only update with the latest call to convertValue
          if (myCounter !== counter) return

          for (const quote of quotes) {
            if (quote.direction !== 'buy') continue
            // @ts-expect-error
            if (pluginPriority[pluginId] != null && pluginPriority[pluginId][quote.pluginId] <= 0) continue
            goodQuotes.push(quote)
          }

          if (goodQuotes.length === 0) {
            // Find the best error to surface
            const bestErrorText = getBestError(errors as any, sourceFieldCurrencyCode) ?? s.strings.fiat_plugin_buy_no_quote
            if (enterAmountMethods != null) enterAmountMethods.setStatusText({ statusText: bestErrorText, options: { textType: 'error' } })
            return
          }

          // Find best quote factoring in pluginPriorities
          bestQuote = getBestQuote(goodQuotes, priorityArray)
          if (bestQuote == null) {
            if (enterAmountMethods != null) enterAmountMethods.setStatusText({ statusText: s.strings.fiat_plugin_buy_no_quote, options: { textType: 'error' } })
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
                  const localeAmount = formatNumber(toFixed(quote.cryptoAmount, 0, 6))
                  text = `(${localeAmount} ${quote.tokenId?.tokenId ?? ''})`
                } else {
                  // User entered a crypto value. Show the fiat value per partner
                  const localeAmount = formatNumber(toFixed(quote.fiatAmount, 0, 2))
                  text = `(${localeAmount} ${quote.fiatCurrencyCode.replace('iso:', '')})`
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

                logEvent(isBuy ? 'Buy_Quote_Change_Provider' : 'Sell_Quote_Change_Provider')

                if (sourceFieldNum === 1) {
                  enterAmountMethods.setValue2(bestQuote.cryptoAmount)
                } else {
                  enterAmountMethods.setValue1(bestQuote.fiatAmount)
                }
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
      await bestQuote.approveQuote({ showUi, coreWallet })
    }
  }
  return fiatPlugin
}

export const createPriorityArray = (pluginPriority: FiatPluginPriority): PriorityArray => {
  const priorityArray: PriorityArray = []
  if (pluginPriority != null) {
    const temp: Array<{ pluginId: string; priority: number }> = []
    for (const pluginId in pluginPriority) {
      temp.push({ pluginId, priority: pluginPriority[pluginId] })
    }
    temp.sort((a, b) => b.priority - a.priority)
    let currentPriority = Infinity
    let priorityObj = {}
    for (const t of temp) {
      if (t.priority < currentPriority) {
        priorityArray.push({})
        currentPriority = t.priority
        priorityObj = priorityArray[priorityArray.length - 1]
      }
      // @ts-expect-error
      priorityObj[t.pluginId] = true
    }
  }
  return priorityArray
}

export const getBestQuote = (quotes: FiatProviderQuote[], priorityArray: PriorityArray): FiatProviderQuote | undefined => {
  let bestQuote
  let bestQuoteRatio = '0'
  for (const p of priorityArray) {
    for (const quote of quotes) {
      if (!p[quote.pluginId]) continue
      const quoteRatio = div(quote.cryptoAmount, quote.fiatAmount, 16)

      if (gt(quoteRatio, bestQuoteRatio)) {
        bestQuoteRatio = quoteRatio
        bestQuote = quote
      }
    }
    if (bestQuote != null) return bestQuote
  }
}
