import { eq, toFixed } from 'biggystring'
import { sprintf } from 'sprintf-js'

import { subscribeToExchangeRates, updateExchangeRates } from '../../actions/ExchangeRateActions'
import { formatNumber, isValidInput } from '../../locales/intl'
import s from '../../locales/strings'
import { convertCurrency, convertCurrencyFromState } from '../../selectors/WalletSelectors'
import { FormFieldProps } from '../../types/FormTypes'
import { EdgeTokenId } from '../../types/types'
import { getPartnerIconUri } from '../../util/CdnUris'
import { getTokenId } from '../../util/CurrencyInfoHelpers'
import { logEvent } from '../../util/tracking'
import { fuzzyTimeout, snooze } from '../../util/utils'
import { FiatPlugin, FiatPluginFactory, FiatPluginFactoryArgs, FiatPluginGetMethodsResponse, FiatPluginStartParams, FiatSepaInfo } from './fiatPluginTypes'
import { FiatProvider, FiatProviderAssetMap, FiatProviderGetQuoteParams, FiatProviderQuote } from './fiatProviderTypes'
import { createStore, getBestError, getRateFromQuote } from './pluginUtils'
import { bityProvider } from './providers/bityProvider'

const providerFactories = [bityProvider]

async function getOrders() {
  try {
    const ordersResponse = await fetch('https://exchange.api.bity.com/v2/orders', {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      }
    })

    if (!ordersResponse.ok) {
      throw new Error('Failed to retrieve orders')
    }

    const orders = await ordersResponse.json()
    console.debug(JSON.stringify(orders, null, 2))
    return orders.orders
  } catch (e) {
    console.error(`Error getting orders: ${e.message}`)
    throw e
  }
}

async function cancelOpenOrders() {
  try {
    const orders = await getOrders()
    const openOrders = orders

    if (openOrders.length === 0) {
      console.debug('No open orders to cancel')
      return
    }

    const cancelOrderPromises = openOrders.map(async order => {
      console.debug('cancelling ' + order.id)
      try {
        const cancelResponse = await fetch(`https://exchange.api.bity.com/v2/orders/${order.id}/cancel`, {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json'
          }
        })

        if (!cancelResponse.ok) {
          throw new Error('Failed to cancel order')
        }

        console.debug(`Order ${order.id} cancelled successfully`)
      } catch (e) {
        console.error(`Error cancelling order ${order.id}: ${e.message}`)
      }
    })

    await Promise.all(cancelOrderPromises)
  } catch (e) {
    console.error(`Error cancelling orders: ${e.message}`)
    throw e
  }
}

export const sepaPlugin: FiatPluginFactory = async (params: FiatPluginFactoryArgs) => {
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
  if (providerPromises.length === 0) throw new Error('No enabled fiatPluginSepa providers')

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
      await showUi.enterFieldsForm({
        countryCode: regionCode.countryCode,
        headerIconUri: '',
        headerTitle: s.strings.enter_bank_info_title,
        forms: [
          {
            title: s.strings.bank_info_label,
            key: 'sepaForm',
            formType: 'sepaForm',
            fields: [
              // TODO: autofill map
              {
                key: 'name',
                label: s.strings.account_owner,
                dataType: 'text'
              },
              {
                key: 'iban',
                label: s.strings.iban,
                dataType: 'text'
              },
              {
                key: 'swift',
                label: s.strings.swift_code,
                dataType: 'text'
              }
            ]
          },
          {
            title: s.strings.home_address_title,
            key: 'addressForm',
            formType: 'addressForm',
            fields: [
              // TODO: Localize format based on selected country.
              // For now, use a "generic Amazon.com" format
              {
                key: 'address',
                label: s.strings.address_line_1,
                dataType: 'address'
              },
              {
                key: 'address2',
                label: s.strings.address_line_2,
                dataType: 'text'
              },
              {
                key: 'city',
                label: s.strings.city,
                dataType: 'text'
              },
              {
                key: 'state',
                label: s.strings.state_province_region,
                dataType: 'text'
              },
              {
                key: 'postalCode',
                label: s.strings.zip_postal_code,
                dataType: 'text'
              }
            ]
          }
        ],
        onSubmit: async (fieldInputs: FormFieldProps[]) => {
          console.debug('onSubmit callback: ' + JSON.stringify(fieldInputs, null, 2))

          // Validate user input
          const rawSepaInfoInput: any = fieldInputs.reduce(
            (acc: any, { key, value }) => {
              if (key === 'iban' || key === 'swift') acc[key] = value
              else acc.ownerAddress[key] = value
              return acc
            },
            {
              // iban: undefined,
              // swift: undefined,
              // ownerAddress: {
              //   name: undefined,
              //   address: undefined,
              //   address2: undefined,
              //   city: undefined,
              //   country: regionCode.countryCode,
              //   state: undefined,
              //   postalCode: undefined
              // }
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
          console.debug('rawSepaInfoInput: ' + JSON.stringify(rawSepaInfoInput, null, 2))
          try {
            // sepaInfo = asFiatSepaInfo(rawSepaInfoInput)
            sepaInfo = {
              iban: 'IT21G0300203280333113817227',
              swift: 'ICBBITMM',
              ownerAddress: {
                name: 'Jon Tzeng',
                address: '2404 C St',
                address2: '',
                city: 'San Diego',
                country: 'IT',
                state: 'CA',
                postalCode: '92102'
              }
            }
          } catch (e: any) {
            console.debug(e)
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
          const fiatCurrencyCode = 'iso:EUR' // TODO: Allow other accepted fiat codes
          const displayFiatCurrencyCode = fiatCurrencyCode.replace('iso:', '')
          const currencyPluginId = coreWallet.currencyInfo.pluginId
          let enterAmountMethods: FiatPluginGetMethodsResponse
          let counter = 0
          let bestQuote: FiatProviderQuote | undefined

          await showUi.enterAmount({
            headerTitle: sprintf(s.strings.fiat_plugin_buy_currencycode, currencyCode),
            direction,

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
              if (eq(value, '0')) return ''
              const myCounter = ++counter
              let quoteParams: FiatProviderGetQuoteParams

              if (sourceFieldNum === 1) {
                // User entered a fiat value.
                quoteParams = {
                  tokenId: { pluginId: currencyPluginId, tokenId: currencyCode },
                  exchangeAmount: value,
                  fiatCurrencyCode,
                  amountType: isBuy ? 'fiat' : 'crypto',
                  direction,
                  paymentTypes,
                  regionCode,
                  sepaInfo
                }
              } else {
                // User entered a crypto value. Convert to fiat since only fiat
                // quotes supported
                let exchangeAmount = isBuy ? toFixed(convertCurrency(state, currencyCode, fiatCurrencyCode, value), 0, 2) : value
                // let exchangeAmount = isBuy ? toFixed(dispatch(convertCurrencyFromState(currencyCode, fiatCurrencyCode, value))
                if (isBuy && exchangeAmount === '0') {
                  await dispatch(subscribeToExchangeRates([`${fiatCurrencyCode}_${currencyCode}`]))
                  updateExchangeRates()
                  while (exchangeAmount === '0') {
                    await snooze(1000)
                    exchangeAmount = toFixed(dispatch(convertCurrencyFromState(currencyCode, fiatCurrencyCode, value)), 0, 2)
                    // exchangeAmount = toFixed(convertCurrency(state, currencyCode, fiatCurrencyCode, value), 0, 2)
                  }
                }

                quoteParams = {
                  tokenId: { pluginId: currencyPluginId, tokenId: currencyCode },
                  exchangeAmount,
                  fiatCurrencyCode,
                  amountType: isBuy ? 'fiat' : 'crypto',
                  direction,
                  paymentTypes,
                  regionCode,
                  sepaInfo
                }
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
                const bestErrorText = getBestError(errors as any, displayFiatCurrencyCode) ?? s.strings.fiat_plugin_buy_no_quote
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

                    logEvent(direction === 'buy' ? 'Buy_Quote_Change_Provider' : 'Sell_Quote_Change_Provider')

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

          if (bestQuote == null) {
            return
          }
          await bestQuote.approveQuote({ showUi, coreWallet })
          showUi.popScene()
        }
      })

      // // TODO: Support multiple providers
      // const quoteParams: FiatProviderGetQuoteParams = {
      //   amountType: isBuy ? 'fiat' : 'crypto',
      //   direction,
      //   exchangeAmount: '100',
      //   fiatCurrencyCode,
      //   paymentTypes,
      //   regionCode,
      //   tokenId: { pluginId: currencyPluginId, tokenId: currencyCode },
      //   sepaInfo
      // }
      // console.debug('quote params: ' + JSON.stringify(quoteParams, null, 2))

      // const quote = await providers[0].getQuote(quoteParams)

      // console.debug('bestQuote' + JSON.stringify(bestQuote, null, 2))
    }
  }
  return fiatPlugin
}
