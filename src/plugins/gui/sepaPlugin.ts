import { eq, toFixed } from 'biggystring'
import { sprintf } from 'sprintf-js'

import { formatNumber, isValidInput } from '../../locales/intl'
import s from '../../locales/strings'
import { getDisplayDenomination } from '../../selectors/DenominationSelectors'
import { FormFieldProps } from '../../types/FormTypes'
import { EdgeTokenId } from '../../types/types'
import { getPartnerIconUri } from '../../util/CdnUris'
import { getTokenId } from '../../util/CurrencyInfoHelpers'
import { getAnyRate } from '../../util/exchangeRates'
import { logEvent } from '../../util/tracking'
import { fuzzyTimeout } from '../../util/utils'
import {
  asFiatSepaInfo,
  FiatPlugin,
  FiatPluginFactory,
  FiatPluginFactoryArgs,
  FiatPluginGetMethodsResponse,
  FiatPluginStartParams,
  FiatSepaInfo
} from './fiatPluginTypes'
import { FiatProvider, FiatProviderAssetMap, FiatProviderGetQuoteParams, FiatProviderQuote } from './fiatProviderTypes'
import { createStore, getBestError, getRateFromQuote } from './pluginUtils'
import { bityProvider } from './providers/bityProvider'

const providerFactories = [bityProvider]
const INITIAL_AMOUNT_FIAT = '500'

export const fiatSepaPlugin: FiatPluginFactory = async (params: FiatPluginFactoryArgs) => {
  const pluginId = 'sepaTransfer'
  const { disablePlugins, account, showUi, dispatch, state } = params

  // Initialize provider(s)
  const assetPromises: Array<Promise<FiatProviderAssetMap>> = []
  const providerPromises: Array<Promise<FiatProvider>> = []

  for (const providerFactory of providerFactories) {
    if (disablePlugins[providerFactory.pluginId]) continue
    const store = createStore(providerFactory.storeId, account.dataStore)
    providerPromises.push(providerFactory.makeProvider({ io: { store } }))
  }
  if (providerPromises.length === 0) throw new Error('No enabled fiatSepaPlugin providers')

  const providers = await Promise.all(providerPromises)
  for (const provider of providers) {
    assetPromises.push(provider.getSupportedAssets())
  }

  const fiatPlugin: FiatPlugin = {
    pluginId,
    startPlugin: async (params: FiatPluginStartParams) => {
      const { direction, regionCode, paymentTypes } = params
      const isBuy = direction === 'buy'
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

      let sepaInfo: FiatSepaInfo | undefined

      // Grab address/bank info
      await showUi.addressForm({
        countryCode: regionCode.countryCode,
        headerIconUri: '',
        headerTitle: s.strings.enter_bank_info
        onSubmit: async (fieldInputs: FormFieldProps[]) => {
          // Validate user input
          const rawSepaInfoInput: any = fieldInputs.reduce(
            (acc: any, { key, value }) => {
              if (key === 'iban' || key === 'swift') acc[key] = value
              else acc.ownerAddress[key] = value
              return acc
            },
            {
              iban: '',
              swift: '',
              ownerAddress: {
                name: '',
                address: '',
                address2: '',
                city: '',
                country: regionCode.countryCode,
                state: '',
                postalCode: ''
              }
            }
          )
          try {
            console.debug('rawSepaInfoInput ' + JSON.stringify(rawSepaInfoInput, null, 2))
            sepaInfo = asFiatSepaInfo(rawSepaInfoInput)
            console.debug('sepaInfo ', JSON.stringify(sepaInfo, null, 2))
          } catch (e: any) {
            const requiredSepaKeys = ['name', 'iban', 'swift', 'address', 'city', 'country', 'state', 'postalCode']
            throw new Error(
              `Missing sepa fields: ${requiredSepaKeys.filter(
                requiredSepaKey => rawSepaInfoInput[requiredSepaKey] == null && rawSepaInfoInput.ownerAddress[requiredSepaKey] == null
              )}`
            )
          }

          // Get quote from user amount input
          if (sepaInfo == null) return

          const coreWallet = account.currencyWallets[walletId]
          const currencyPluginId = coreWallet.currencyInfo.pluginId
          const displayDenomination = getDisplayDenomination(state, currencyPluginId, currencyCode)
          const displayDenomMult = displayDenomination.multiplier
          const fiatCurrencyCode = 'iso:EUR' // TODO: Allow other accepted fiat codes
          const displayFiatCurrencyCode = fiatCurrencyCode.replace('iso:', '')
          let enterAmountMethods: FiatPluginGetMethodsResponse
          let counter = 0
          let bestQuote: FiatProviderQuote | undefined
          const initialAmountCrypto = await getAnyRate(fiatCurrencyCode, currencyCode, INITIAL_AMOUNT_FIAT, displayDenomMult)

          await showUi.enterAmount({
            headerTitle: isBuy
              ? sprintf(s.strings.fiat_plugin_buy_currencycode_s, currencyCode)
              : sprintf(s.strings.fiat_plugin_sell_currencycode_s, currencyCode),
            direction,

            label1: sprintf(s.strings.fiat_plugin_amount_currencycode, displayFiatCurrencyCode),
            label2: sprintf(s.strings.fiat_plugin_amount_currencycode, currencyCode),
            initialAmount1: isBuy ? INITIAL_AMOUNT_FIAT : undefined,
            initialAmount2: isBuy ? undefined : initialAmountCrypto,
            getMethods: (methods: FiatPluginGetMethodsResponse) => {
              enterAmountMethods = methods
            },
            convertValue: async (sourceFieldNum: number, value: string): Promise<string | undefined> => {
              if (!isValidInput(value)) {
                if (enterAmountMethods != null)
                  enterAmountMethods.setStatusText({ statusText: s.strings.create_wallet_invalid_input, options: { textType: 'error' } })
                return
              }
              if (eq(value, '0')) return ''
              const myCounter = ++counter

              const amountType = sourceFieldNum === 1 ? 'fiat' : 'crypto'
              const quoteParams: FiatProviderGetQuoteParams = {
                tokenId: { pluginId: currencyPluginId, tokenId: currencyCode },
                exchangeAmount: value,
                fiatCurrencyCode,
                amountType,
                direction,
                paymentTypes,
                regionCode,
                sepaInfo
              }

              const quotePromises = providers.map(async p => p.getQuote(quoteParams))
              let errors: unknown[] = []
              const quotes = await fuzzyTimeout(quotePromises, 5000).catch(e => {
                errors = e
                return []
              })

              // Only update with the latest call to convertValue
              if (myCounter !== counter) return

              if (quotes.length === 0) {
                // Find the best error to surface
                const bestErrorText =
                  getBestError(errors as any, amountType === 'fiat' ? displayFiatCurrencyCode : currencyCode) ?? isBuy
                    ? s.strings.fiat_plugin_buy_no_quote
                    : s.strings.fiat_plugin_sell_no_quote
                if (enterAmountMethods != null) enterAmountMethods.setStatusText({ statusText: bestErrorText, options: { textType: 'error' } })
                return
              }

              // Find best quote factoring in pluginPriorities
              bestQuote = quotes[0]

              const exchangeRateText = getRateFromQuote(bestQuote, displayFiatCurrencyCode)
              if (enterAmountMethods != null) {
                const poweredByOnClick = async () => {
                  // 1. Show modal with all the valid quotes
                  const items = quotes.map(quote => {
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
                    bestQuote = quotes.find(quote => quote.pluginDisplayName === rowName)
                    if (bestQuote == null) return

                    // 3. Set the status text and powered by
                    const statusText = getRateFromQuote(bestQuote, fiatCurrencyCode)
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

              console.debug('bestQuote', JSON.stringify(bestQuote, null, 2))
              if (amountType === 'fiat') {
                return toFixed(bestQuote.cryptoAmount, 0, parseInt(displayDenomMult))
              } else {
                return toFixed(bestQuote.fiatAmount, 0, 2)
              }
            }
          })

          if (bestQuote == null) {
            return
          }
          await bestQuote.approveQuote({ showUi, displayDenomination, coreWallet })
          showUi.popScene()
        }
      })
    }
  }
  return fiatPlugin
}
