import { div, eq, gt, round, toFixed } from 'biggystring'
import { asNumber, asObject } from 'cleaners'
import { sprintf } from 'sprintf-js'

import { getFirstOpenInfo } from '../../actions/FirstOpenActions'
import { formatNumber, isValidInput } from '../../locales/intl'
import { lstrings } from '../../locales/strings'
import { EdgeAsset } from '../../types/types'
import { getPartnerIconUri } from '../../util/CdnUris'
import { getCurrencyCode } from '../../util/CurrencyInfoHelpers'
import { getHistoricalRate } from '../../util/exchangeRates'
import { infoServerData } from '../../util/network'
import { logEvent } from '../../util/tracking'
import { getUkCompliantString } from '../../util/ukComplianceUtils'
import { DECIMAL_PRECISION, fuzzyTimeout, removeIsoPrefix } from '../../util/utils'
import { FiatPlugin, FiatPluginFactory, FiatPluginFactoryArgs, FiatPluginStartParams } from './fiatPluginTypes'
import { FiatProvider, FiatProviderAssetMap, FiatProviderGetQuoteParams, FiatProviderQuote } from './fiatProviderTypes'
import { StateManager } from './hooks/useStateManager'
import { BestError, getBestError, getRateFromQuote } from './pluginUtils'
import { banxaProvider } from './providers/banxaProvider'
import { bityProvider } from './providers/bityProvider'
import { kadoProvider } from './providers/kadoProvider'
import { moonpayProvider } from './providers/moonpayProvider'
import { mtpelerinProvider } from './providers/mtpelerinProvider'
import { paybisProvider } from './providers/paybisProvider'
import { simplexProvider } from './providers/simplexProvider'
import { EnterAmountState, FiatPluginEnterAmountParams } from './scenes/FiatPluginEnterAmountScene'
import { initializeProviders } from './util/initializeProviders'

// A map keyed by provider pluginIds, and values representing preferred priority
// for that provider.
// Higher numbers are preferred over lower. If a provider is not listed or is
// marked with a priority of 0, it is not considered for quoting.
const asProviderPriorityMap = asObject(asNumber)
type ProviderPriorityMap = ReturnType<typeof asProviderPriorityMap>

// A map keyed by supported payment types and values of ProviderPriorityMap
const asPaymentTypeProviderPriorityMap = asObject(asProviderPriorityMap)
type PaymentTypeProviderPriorityMap = ReturnType<typeof asPaymentTypeProviderPriorityMap>

type PriorityArray = Array<{ [pluginId: string]: boolean }>

interface ConvertValueInternalResult {
  stateManagerUpdate?: Partial<EnterAmountState>
  bestError?: BestError
  value?: string
}
type InternalFiatPluginEnterAmountParams = FiatPluginEnterAmountParams & {
  convertValueInternal: (sourceFieldNum: number, value: string, stateManager: StateManager<EnterAmountState>) => Promise<ConvertValueInternalResult>
}

const providerFactories = [banxaProvider, bityProvider, kadoProvider, moonpayProvider, mtpelerinProvider, paybisProvider, simplexProvider]

const DEFAULT_FIAT_AMOUNT = '500'
const DEFAULT_FIAT_AMOUNT_LIGHT_ACCOUNT = '50'

/**
 * Amount that we will attempt to get a quote for if the user presses the MAX button
 * This is an arbitrary large number that should be larger than any reasonable quote
 * in either fiat or crypto
 */
const MAX_QUOTE_VALUE = '10000000000'

const NO_PROVIDER_TOAST_DURATION_MS = 10000

/** Pick a default fiat amount in the foreign fiat amount that is roughly equal
 to the default USD fiat amount. Prioritizes rounding up/down to a nice looking
 whole number. */
async function getInitialFiatValue(date: string, startingFiatAmount: string, isoFiatCurrencyCode: string) {
  let initialValue1: string | undefined
  if (isoFiatCurrencyCode !== 'iso:USD') {
    const ratePair = `${isoFiatCurrencyCode}_iso:USD`
    const rate = await getHistoricalRate(ratePair, date)
    initialValue1 = div(startingFiatAmount, String(rate), DECIMAL_PRECISION)

    // Round out all decimals
    initialValue1 = round(initialValue1, 0)

    // Keep only the first decimal place
    initialValue1 = round(initialValue1, initialValue1.length - 1)
  } else {
    initialValue1 = startingFiatAmount
  }
  return initialValue1
}

export const amountQuoteFiatPlugin: FiatPluginFactory = async (params: FiatPluginFactoryArgs) => {
  const { account, guiPlugin, longPress = false, pluginUtils, showUi } = params
  const { pluginId } = guiPlugin
  const isLightAccount = account.username == null

  const assetPromises: Array<Promise<FiatProviderAssetMap>> = []

  if (longPress) {
    const rowText = await showUi.listModal({
      title: 'Clear Provider Data Store',
      items: providerFactories.map(f => ({ icon: '', name: f.providerId }))
    })
    if (rowText != null) {
      const factory = providerFactories.find(pf => pf.providerId === rowText)
      if (factory != null) {
        const { storeId } = factory
        await account.dataStore.deleteStore(storeId)
        const result = await showUi.buttonModal({
          buttons: {
            delete: { label: lstrings.string_delete, type: 'primary' },
            cancel: { label: lstrings.string_cancel, type: 'secondary' }
          },
          title: 'Clear Data Store',
          message: `Are you sure you want to clear data store of provider ${rowText}??\n\nThis cannot be undone.`
        })
        if (result === 'delete') {
          await showUi.buttonModal({
            buttons: {
              ok: { label: lstrings.string_ok, type: 'primary' }
            },
            title: 'Data Store Cleared',
            message: `Provider ${rowText} data store has been cleared`
          })
        }
      }
    }
  }

  const providers = await initializeProviders(providerFactories, params)
  if (providers.length === 0) throw new Error('No enabled amountQuoteFiatPlugin providers')

  const fiatPlugin: FiatPlugin = {
    pluginId,
    startPlugin: async (params: FiatPluginStartParams) => {
      const { defaultIsoFiat, direction, defaultFiatAmount, forceFiatCurrencyCode, regionCode, paymentTypes, pluginPromotion, providerId } = params
      const { countryCode } = await getFirstOpenInfo()

      // TODO: Address 'paymentTypes' vs 'paymentType'. Both are defined in the
      // buy/sellPluginList.jsons.
      if (paymentTypes.length === 0) console.warn('No payment types given to FiatPlugin: ' + pluginId)

      let providerPriority: PaymentTypeProviderPriorityMap = {}
      let priorityArray: PriorityArray = [{}]
      if (paymentTypes.length === 1) {
        // Fetch provider priorities from the info server based on the payment
        // type
        try {
          if (infoServerData.rollup?.fiatPluginPriority != null) {
            providerPriority = infoServerData.rollup.fiatPluginPriority
            priorityArray = createPriorityArray(providerPriority[paymentTypes[0]])
          }
        } catch (e: any) {
          console.warn('Failed to fetch provider priorities:', e)
          // This is ok. We will use all configured providers at equal priority.
        }
      } else {
        throw new Error('Multiple paymentTypes not implemented')
      }

      const paymentProviderPriority = providerPriority[paymentTypes[0]] ?? {}
      const priorityProviders = providers.filter(p => paymentProviderPriority[p.providerId] != null && paymentProviderPriority[p.providerId] > 0)

      if (priorityProviders.length === 0) {
        const msg = direction === 'buy' ? lstrings.fiat_plugin_no_buy_providers : lstrings.fiat_plugin_no_sell_providers
        await showUi.showToast(msg, NO_PROVIDER_TOAST_DURATION_MS)
        return
      }

      // Fetch supported assets from all providers, based on the given
      // paymentTypes this plugin was initialized with.
      for (const provider of priorityProviders) {
        assetPromises.push(provider.getSupportedAssets({ direction, regionCode, paymentTypes }))
      }

      const ps = fuzzyTimeout(assetPromises, 5000)

      const assetArray = await showUi.showToastSpinner(lstrings.fiat_plugin_fetching_assets, ps)

      const requireAmountFiat: { [providerId: string]: boolean } = {}
      const requireAmountCrypto: { [providerId: string]: boolean } = {}

      const allowedAssets: EdgeAsset[] = []
      const allowedFiats: { [fiatCurrencyCode: string]: boolean } = {}
      const allowedProviders: { [providerId: string]: boolean } = {}
      for (const assetMap of assetArray) {
        if (assetMap == null) continue
        allowedProviders[assetMap.providerId] = true
        requireAmountCrypto[assetMap.providerId] = false
        requireAmountFiat[assetMap.providerId] = false
        if (assetMap.requiredAmountType === 'fiat') {
          requireAmountFiat[assetMap.providerId] = true
        } else if (assetMap.requiredAmountType === 'crypto') {
          requireAmountCrypto[assetMap.providerId] = true
        }

        for (const currencyPluginId in assetMap.crypto) {
          const providerTokens = assetMap.crypto[currencyPluginId]
          for (const { tokenId } of providerTokens) {
            console.log('Adding asset:', assetMap.providerId, currencyPluginId, tokenId)
            allowedAssets.push({ pluginId: currencyPluginId, tokenId })
          }
          for (const fiatCode in assetMap.fiat) {
            allowedFiats[fiatCode] = true
          }
        }
      }

      const allowedProvidersArray = priorityProviders.filter(p => allowedProviders[p.providerId])
      const fiatAmountProviders = allowedProvidersArray.filter(p => !requireAmountCrypto[p.providerId])
      const cryptoAmountProviders = allowedProvidersArray.filter(p => !requireAmountFiat[p.providerId])
      const hasProviderWithoutRequire = allowedProvidersArray.some(p => !requireAmountFiat[p.providerId] && !requireAmountCrypto[p.providerId])

      // Filter out providers that have a required amount type if there are ANY providers
      // that do not have a required amount type.
      let requireCrypto = false
      let requireFiat = false
      if (!hasProviderWithoutRequire) {
        // We don't have a fully flexible provider that can take fiat or crypto inputs
        // Validate if we need to force a specific input type
        for (const p of allowedProvidersArray) {
          if (requireAmountFiat[p.providerId] && requireAmountCrypto[p.providerId]) {
            throw new Error('Provider must not require both fiat and crypto amounts')
          }
          if (requireAmountFiat[p.providerId]) {
            requireFiat = true
          } else if (requireAmountCrypto[p.providerId]) {
            requireCrypto = true
          }
        }
        // We prefer fiat input so in a pinch where some providers require crypto and
        // another requires fiat, we'll force fiat
        if (requireFiat) requireCrypto = false
      }

      // Pop up modal to pick wallet/asset
      // TODO: Filter wallets according to fiats supported by allowed providers
      const walletListResult = await showUi.walletPicker({
        headerTitle: direction === 'buy' ? lstrings.fiat_plugin_select_asset_to_purchase : lstrings.fiat_plugin_select_asset_to_sell,
        allowedAssets,
        showCreateWallet: direction === 'buy'
      })

      if (walletListResult == null) return
      const { walletId, tokenId } = walletListResult
      const coreWallet = account.currencyWallets[walletId]
      const currencyCode = getCurrencyCode(coreWallet, tokenId)
      const currencyPluginId = coreWallet.currencyInfo.pluginId
      if (!coreWallet) return await showUi.showError(new Error(`Missing wallet with ID ${walletId}`))

      let counter = 0
      let bestQuote: FiatProviderQuote | undefined
      let goodQuotes: FiatProviderQuote[] = []
      let lastSourceFieldNum: number

      const isoFiatCurrencyCode = forceFiatCurrencyCode ?? defaultIsoFiat
      const displayFiatCurrencyCode = removeIsoPrefix(isoFiatCurrencyCode)
      const isBuy = direction === 'buy'
      const disableInput = requireCrypto ? 1 : requireFiat ? 2 : undefined

      logEvent(isBuy ? 'Buy_Quote' : 'Sell_Quote')

      const startingFiatAmount = isLightAccount ? DEFAULT_FIAT_AMOUNT_LIGHT_ACCOUNT : defaultFiatAmount ?? DEFAULT_FIAT_AMOUNT
      const isoNow = new Date().toISOString()
      const initialValue1 = requireCrypto ? undefined : await getInitialFiatValue(isoNow, startingFiatAmount, isoFiatCurrencyCode)

      // Navigate to scene to have user enter amount
      const enterAmount: InternalFiatPluginEnterAmountParams = {
        disableInput,
        headerTitle: isBuy ? getUkCompliantString(countryCode, 'buy_1s', currencyCode) : getUkCompliantString(countryCode, 'sell_1s', currencyCode),
        initState: {
          value1: initialValue1,
          statusText: initialValue1 == null ? { content: lstrings.enter_amount_label } : { content: '' }
        },
        label1: sprintf(lstrings.fiat_plugin_amount_currencycode, displayFiatCurrencyCode),
        label2: sprintf(lstrings.fiat_plugin_amount_currencycode, currencyCode),
        swapInputLocations: requireCrypto,
        async onChangeText() {},
        async onMax(sourceFieldNum, stateManager) {
          /** Helper function to get a quote or error for the value specified */
          const getMaxQuoteOrError = async (
            fieldNum: number,
            quoteValue: string
          ): Promise<{ value1: string; value2: string } | ConvertValueInternalResult | undefined> => {
            // First try getting a quote using the requested value
            const result = await enterAmount.convertValueInternal(fieldNum, quoteValue, stateManager)
            if (result.bestError?.quoteError != null) {
              const { quoteError } = result.bestError
              // We're only interested in overLimit errors to help find the max value
              if (quoteError.errorType === 'overLimit' && quoteError.errorAmount != null) {
                const { errorAmount, displayCurrencyCode } = quoteError

                // We can only get a new quote if the displayCurrencyCode is specified since
                // we have to know what type of quote to query
                if (displayCurrencyCode != null) {
                  if (displayCurrencyCode === displayFiatCurrencyCode) {
                    // Re-query for a quote using the error amount as a fiat value which is fieldNum=1.
                    // This 'should' succeed since the API told us this is the max value.
                    const value1 = String(errorAmount)
                    const value2 = await enterAmount.convertValue(1, value1, stateManager)
                    if (value2 == null) return
                    return { value1, value2 }
                  } else if (displayCurrencyCode === currencyCode) {
                    // Re-query for a quote using the error amount as a crypto value which is fieldNum=2.
                    // This 'should' succeed since the API told us this is the max value.
                    const value2 = String(errorAmount)
                    const value1 = await enterAmount.convertValue(2, value2, stateManager)
                    if (value1 == null) return
                    return { value1, value2 }
                  }
                }
              }
              // We could not get a quote for the max value so return undefined. This happens as some APIs
              // do not return a max value in their error, or they return a value without telling us which
              // asset the amount is denominated in.
            } else {
              // If there was no error, then return the result which includes the opposite value needed
              return result
            }
          }

          if (direction === 'buy') {
            // Try to get an error by requesting a massive quote
            const result = await getMaxQuoteOrError(1, MAX_QUOTE_VALUE)
            if (result == null) {
              stateManager.update({ statusText: { content: lstrings.fiat_plugin_max_buy_quote_error, textType: 'error' } })
            } else if ('value1' in result) {
              // We got a max quote for both fiat and crypto fields, update the UI to show it
              stateManager.update(result)
            } else {
              // Wow. Can we really buy this much?
              stateManager.update({ value1: MAX_QUOTE_VALUE, value2: result.value })
            }
          } else {
            // Get the max amount of the wallet's currency
            const publicAddress = dummyAddressMap[currencyPluginId]
            if (publicAddress == null) {
              stateManager.update({ statusText: { content: sprintf(lstrings.fiat_plugin_max_sell_quote_error_1s, currencyCode), textType: 'error' } })
            }
            const maxAmount = await coreWallet.getMaxSpendable({ tokenId, spendTargets: [{ publicAddress }] })
            const exchangeAmount = await coreWallet.nativeToDenomination(maxAmount, currencyCode)

            const result = await getMaxQuoteOrError(2, exchangeAmount)
            if (result == null) {
              stateManager.update({ statusText: { content: lstrings.fiat_plugin_max_sell_quote_error, textType: 'error' } })
            } else if ('value1' in result) {
              // We got a max quote for both fiat and crypto fields, update the UI to show it
              stateManager.update(result)
            } else {
              // The amount in the user's wallet is within the range of what the provider can
              // support.
              stateManager.update({ value1: result.value, value2: exchangeAmount })
            }
          }
        },

        async convertValue(sourceFieldNum, value, stateManager) {
          const out = await enterAmount.convertValueInternal(sourceFieldNum, value, stateManager)
          if (out.stateManagerUpdate != null) stateManager.update(out.stateManagerUpdate)
          return out.value
        },

        async convertValueInternal(sourceFieldNum, value, stateManager) {
          if (!isValidInput(value)) {
            return { stateManagerUpdate: { statusText: { content: lstrings.create_wallet_invalid_input, textType: 'error' } } }
          }
          bestQuote = undefined
          goodQuotes = []
          lastSourceFieldNum = sourceFieldNum

          if (eq(value, '0')) {
            return {
              stateManagerUpdate: {
                statusText: { content: lstrings.enter_amount_label },
                poweredBy: undefined
              },
              value: ''
            }
          }

          const myCounter = ++counter
          let quoteParams: FiatProviderGetQuoteParams
          let sourceFieldCurrencyCode

          // TODO: Design UX that supports quoting fiatCurrencyCodes that differ
          // from the the selected wallet's fiatCurrencyCode
          let finalProvidersArray: FiatProvider[]
          if (sourceFieldNum === 1) {
            // User entered a fiat value. Convert to crypto
            finalProvidersArray = fiatAmountProviders
            sourceFieldCurrencyCode = displayFiatCurrencyCode
            quoteParams = {
              pluginId: currencyPluginId,
              displayCurrencyCode: currencyCode,
              pluginUtils,
              tokenId,
              exchangeAmount: value,
              fiatCurrencyCode: isoFiatCurrencyCode,
              amountType: 'fiat',
              direction,
              paymentTypes,
              regionCode
            }
          } else {
            // User entered a crypto value. Convert to fiat
            finalProvidersArray = cryptoAmountProviders
            sourceFieldCurrencyCode = currencyCode
            quoteParams = {
              pluginId: currencyPluginId,
              displayCurrencyCode: currencyCode,
              pluginUtils,
              tokenId,
              exchangeAmount: value,
              fiatCurrencyCode: isoFiatCurrencyCode,
              amountType: 'crypto',
              direction,
              paymentTypes,
              regionCode
            }
          }

          const quotePromises = finalProvidersArray
            .filter(p => (providerId == null ? true : providerId === p.providerId))
            .map(async p => {
              const providerIds = pluginPromotion?.providerIds ?? []
              const promoCode = providerIds.some(pid => pid === p.providerId) ? pluginPromotion?.promoCode : undefined
              return await p.getQuote({ ...quoteParams, promoCode })
            })
          let errors: unknown[] = []
          const quotes = await fuzzyTimeout(quotePromises, 5000).catch(e => {
            errors = e
            console.error(errors)
            return []
          })

          // Only update with the latest call to convertValue
          if (myCounter !== counter) return {}

          for (const quote of quotes) {
            if (quote.direction !== direction) continue
            if (providerPriority[pluginId] != null && providerPriority[pluginId][quote.providerId] <= 0) continue
            goodQuotes.push(quote)
          }

          const noQuoteText = direction === 'buy' ? lstrings.fiat_plugin_buy_no_quote : lstrings.fiat_plugin_sell_no_quote
          if (goodQuotes.length === 0) {
            // Find the best error to surface
            const bestError = getBestError(errors as any, sourceFieldCurrencyCode, direction)
            return { bestError, stateManagerUpdate: { statusText: { content: bestError.errorText ?? noQuoteText, textType: 'error' } } }
          }

          // Find best quote factoring in pluginPriorities
          bestQuote = getBestQuote(direction, goodQuotes, priorityArray ?? [{}])
          if (bestQuote == null) {
            return { stateManagerUpdate: { statusText: { content: noQuoteText, textType: 'error' } } }
          }

          const exchangeRateText = getRateFromQuote(bestQuote, displayFiatCurrencyCode)

          const out: ConvertValueInternalResult = {
            stateManagerUpdate: {
              statusText: { content: exchangeRateText, textType: bestQuote.isEstimate ? 'warning' : undefined },
              poweredBy: { poweredByText: bestQuote.pluginDisplayName, poweredByIcon: bestQuote.partnerIcon }
            }
          }

          if (sourceFieldNum === 1) {
            return { ...out, value: toFixed(bestQuote.cryptoAmount, 0, 6) }
          } else {
            return { ...out, value: toFixed(bestQuote.fiatAmount, 0, 2) }
          }
        },
        async onPoweredByClick(stateManager) {
          // 1. Show modal with all the valid quotes
          const items = goodQuotes.map(quote => {
            let text
            if (lastSourceFieldNum === 1) {
              // User entered a fiat value. Show the crypto value per partner
              const localeAmount = formatNumber(toFixed(quote.cryptoAmount, 0, 6))
              text = `(${localeAmount} ${quote.displayCurrencyCode})`
            } else {
              // User entered a crypto value. Show the fiat value per partner
              const localeAmount = formatNumber(toFixed(quote.fiatAmount, 0, 2))
              text = `(${localeAmount} ${removeIsoPrefix(quote.fiatCurrencyCode)})`
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
            stateManager.update({
              statusText: { content: statusText },
              poweredBy: { poweredByText: bestQuote.pluginDisplayName, poweredByIcon: bestQuote.partnerIcon }
            })

            logEvent(isBuy ? 'Buy_Quote_Change_Provider' : 'Sell_Quote_Change_Provider')

            if (lastSourceFieldNum === 1) {
              stateManager.update({ value2: bestQuote.cryptoAmount })
            } else {
              stateManager.update({ value1: bestQuote.fiatAmount })
            }
          }
        },
        async onSubmit(_event, stateManager) {
          if (bestQuote == null) {
            return
          }

          // Restrict light accounts from buying more than $50 at a time
          if (isLightAccount && isBuy) {
            const quoteFiatCurrencyCode = bestQuote.fiatCurrencyCode

            if (initialValue1 != null && gt(bestQuote.fiatAmount, initialValue1)) {
              stateManager.update({
                statusText: {
                  content: sprintf(lstrings.fiat_plugin_purchase_limit_error_2s, initialValue1, removeIsoPrefix(quoteFiatCurrencyCode)),
                  textType: 'error'
                }
              })
              return
            }
          }

          logEvent(isBuy ? 'Buy_Quote_Next' : 'Sell_Quote_Next')
          await bestQuote.approveQuote({ showUi, coreWallet })
        }
      }
      showUi.enterAmount(enterAmount)
    }
  }
  return fiatPlugin
}

// Returns an array with a sort index according to the desired priority in
// showing the quotes.
// TODO: conflict: also defines whether or not to accept a quote from the
// provider
export const createPriorityArray = (providerPriority: ProviderPriorityMap): PriorityArray => {
  const priorityArray: PriorityArray = []
  if (providerPriority != null) {
    const temp: Array<{ pluginId: string; priority: number }> = []
    for (const pluginId in providerPriority) {
      temp.push({ pluginId, priority: providerPriority[pluginId] })
    }
    temp.sort((a, b) => b.priority - a.priority)
    let currentPriority = Infinity
    let priorityObj: PriorityArray[number] = {}
    for (const t of temp) {
      if (t.priority < currentPriority) {
        priorityArray.push({})
        currentPriority = t.priority
        priorityObj = priorityArray[priorityArray.length - 1]
      }
      priorityObj[t.pluginId] = true
    }
  }
  return priorityArray
}

export const getBestQuote = (direction: 'buy' | 'sell', quotes: FiatProviderQuote[], priorityArray: PriorityArray): FiatProviderQuote | undefined => {
  let bestQuote
  let bestQuoteRatio = '0'
  for (const p of priorityArray) {
    for (const quote of quotes) {
      if (!p[quote.providerId]) continue
      let quoteRatio: string
      if (direction === 'buy') {
        quoteRatio = div(quote.cryptoAmount, quote.fiatAmount, 16)
      } else {
        quoteRatio = div(quote.fiatAmount, quote.cryptoAmount, 16)
      }

      if (gt(quoteRatio, bestQuoteRatio)) {
        bestQuoteRatio = quoteRatio
        bestQuote = quote
      }
    }
    if (bestQuote != null) return bestQuote
  }
}

const evm = '0x0d73358506663d484945BA85D0cd435ad610B0A0'

/**
 * Dummy addresses from Edge internal account used for creating a dummy
 * EdgeSpendInfo only for calculating the max spendable amount
 */
const dummyAddressMap: { [pluginId: string]: string } = {
  arbitrum: evm,
  avalanche: evm,
  binancesmartchain: evm,
  celo: evm,
  fantom: evm,
  filecoinfevm: evm,
  ethereum: evm,
  polygon: evm,
  pulsechain: evm,
  optimism: evm,
  zksync: evm,
  rsk: evm,

  bitcoin: 'bc1qk4crv4cuahw3k5c07pjnt5ld6wqd3mfdarxegk',
  bitcoincash: 'qpqhtl4prfwtzr3nh6u6tc9pmspdnwx7c5g8zuy9l6',
  ripple: 'rfuESo7eHUnvebxgaFjfYxfwXhM2uBPAj3',
  dogecoin: 'D9NYBLA3pviqwZxEtK9CAmWNMgKN9CxFak',
  litecoin: 'ltc1q6myyx2h0zm6784ycnads54l2zqx6f9m84w0v4f',
  dash: 'XeLLbGLQWQfvpqMrhozfYkFhZsQP65nvJY',
  hedera: '0.0.498055',
  polkadot: '1oUs7ZvTs1mVrtsz25D4c8kQBzvUAtptcEKAnFwWkUrMXzE',
  tron: 'TVNi7wRX7zPVxKmKzTJFEfVxEb3aNRdGbY',
  tezos: 'tz1cVgSd4oY25pDkH7vdvVp5DfPkZwT2hXwX',
  cosmos: 'cosmos17vjuuz0qjh5ga3ckk272lna63g9r47hgduvgrz',
  coreum: 'core13vct004glmk7empapqqw0vlh2n88el2apkq35l'
}
