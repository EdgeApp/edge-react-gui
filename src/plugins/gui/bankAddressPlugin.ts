import s from '../../locales/strings'
import { EdgeTokenId } from '../../types/types'
import { getTokenId } from '../../util/CurrencyInfoHelpers'
import { fuzzyTimeout } from '../../util/utils'
import { FiatPlugin, FiatPluginFactory, FiatPluginFactoryArgs, FiatPluginFormField, FiatPluginStartParams, FiatSepaInfo } from './fiatPluginTypes'
import { FiatProvider, FiatProviderAssetMap, FiatProviderGetQuoteParams } from './fiatProviderTypes'
import { createStore } from './pluginUtils'
import { bityProvider } from './providers/bityProvider'

const providerFactories = [bityProvider]

export const fiatPluginSepa: FiatPluginFactory = async (params: FiatPluginFactoryArgs) => {
  const pluginId = 'sepaTransfer'
  const { disablePlugins, account, showUi } = params

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

      let sepaInfo: FiatSepaInfo | null = null

      // Grab address/bank info
      await showUi.enterFieldsForm({
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
                inputType: 'text'
              },
              {
                key: 'iban',
                label: s.strings.iban,
                inputType: 'text'
              },
              {
                key: 'swift',
                label: s.strings.swift_code,
                inputType: 'text'
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
                inputType: 'text'
              },
              {
                key: 'address2',
                label: s.strings.address_line_2,
                inputType: 'text'
              },
              {
                key: 'city',
                label: s.strings.city,
                inputType: 'text'
              },
              {
                key: 'state',
                label: s.strings.state_province_region,
                inputType: 'text'
              },
              {
                key: 'postalCode',
                label: s.strings.zip_postal_code,
                inputType: 'text'
              }
            ]
          }
        ],
        onSubmit: async (fieldInputs: FiatPluginFormField[]) => {
          console.debug('onSubmit callback: ' + JSON.stringify(fieldInputs, null, 2))

          const fieldInputsMap = new Map<string, string | undefined>()
          fieldInputs.forEach((fieldInput: FiatPluginFormField) => {
            const { key, value } = fieldInput
            console.debug('setting:' + key + value)
            fieldInputsMap.set(key, value)
          })

          console.debug('fieldInputsMap: ')
          console.debug(fieldInputsMap)

          let isSepaValid = false
          const requiredSepaKeys = ['name', 'iban', 'swift', 'address', 'address2', 'city', 'state', 'postalCode']
          if (requiredSepaKeys.every(requiredSepaKey => Object.keys(fieldInputs).includes(requiredSepaKey))) {
            const fieldInputsObj: any = {}
            for (const [key, value] of fieldInputsMap) Object.assign(fieldInputsObj[key], value)
            const [iban, swift, name, address, address2, city, state, postalCode] = fieldInputsObj

            if (iban != null && swift != null && name != null && address != null && city != null && state != null && postalCode != null) {
              sepaInfo = {
                iban: iban,
                swift: swift,
                ownerAddress: {
                  name: name,
                  address: address,
                  address2: address2 != null ? address2 : '',
                  city: city,
                  country: regionCode.countryCode,
                  state: state,
                  postalCode: postalCode
                }
              }
              isSepaValid = true
              console.debug('sepaInfo 0: ' + JSON.stringify(sepaInfo, null, 2))
            }
          }

          if (!isSepaValid) {
            throw new Error(`Missing sepa fields: ${Object.keys(fieldInputsMap).filter(fieldInputsMapKey => fieldInputsMap.get(fieldInputsMapKey) == null)}`)
          }
        }
      })

      if (sepaInfo == null) return
      console.debug('sepaInfo: ' + JSON.stringify(sepaInfo, null, 2))

      const wallet = account.currencyWallets[walletId]
      const fiatCurrencyCode = 'usd' // TODO: Allow accepted fiat codes
      const currencyPluginId = wallet.currencyInfo.pluginId

      // Get quote from input

      // TODO: Support multiple providers
      const quoteParams: FiatProviderGetQuoteParams = {
        amountType: isBuy ? 'fiat' : 'crypto',
        direction,
        exchangeAmount: '100',
        fiatCurrencyCode,
        paymentTypes,
        regionCode,
        tokenId: { pluginId: currencyPluginId, tokenId: currencyCode },
        sepaInfo
      }
      console.debug('quote params: ' + JSON.stringify(quoteParams, null, 2))

      const quote = await providers[0].getQuote(quoteParams)

      console.debug(JSON.stringify(quote, null, 2))
    }
  }
  return fiatPlugin
}
