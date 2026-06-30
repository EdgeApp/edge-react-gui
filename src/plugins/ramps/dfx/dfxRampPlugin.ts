import { guiPlugins } from '../../../constants/plugins/GuiPlugins'
import type { RampPluginFactory, SettlementRange } from '../rampPluginTypes'
import { createExternalRampPlugin } from '../utils/createExternalRampPlugin'
import { asInitOptions } from './dfxRampTypes'

// DFX settles SEPA bank transfers within a few business days.
const SETTLEMENT_ONE_TO_THREE_DAYS: SettlementRange = {
  min: { value: 1, unit: 'days' },
  max: { value: 3, unit: 'days' }
}

// SEPA region plus Switzerland and Liechtenstein, where DFX operates.
const DFX_COUNTRIES = [
  'AT',
  'BE',
  'BG',
  'CH',
  'CY',
  'CZ',
  'DE',
  'DK',
  'EE',
  'ES',
  'FI',
  'FR',
  'GR',
  'HR',
  'HU',
  'IE',
  'IT',
  'LI',
  'LT',
  'LU',
  'LV',
  'MT',
  'NL',
  'PL',
  'PT',
  'RO',
  'SE',
  'SI',
  'SK'
]

const DFX_FIAT_CURRENCY_CODES = ['EUR', 'CHF']

const DFX_CRYPTO_ASSETS = [
  { pluginId: 'bitcoin', tokenId: null },
  { pluginId: 'ethereum', tokenId: null },
  { pluginId: 'arbitrum', tokenId: null },
  { pluginId: 'optimism', tokenId: null },
  { pluginId: 'polygon', tokenId: null },
  { pluginId: 'base', tokenId: null },
  { pluginId: 'binancesmartchain', tokenId: null },
  { pluginId: 'solana', tokenId: null },
  { pluginId: 'monero', tokenId: null }
]

export const dfxRampPlugin: RampPluginFactory = config => {
  const initOptions = asInitOptions(config.initOptions)
  const deepQuery = {
    wallet: initOptions.wallet,
    lang: 'en'
  }

  return createExternalRampPlugin(
    'dfx',
    {
      guiPlugin: guiPlugins.dfx,
      partnerIcon: initOptions.partnerIcon,
      buy: {
        paymentTypes: ['sepa'],
        countries: DFX_COUNTRIES,
        fiatCurrencyCodes: DFX_FIAT_CURRENCY_CODES,
        cryptoAssets: DFX_CRYPTO_ASSETS,
        settlementRange: SETTLEMENT_ONE_TO_THREE_DAYS,
        deepPath: '/buy',
        deepQuery
      },
      sell: {
        paymentTypes: ['sepa'],
        countries: DFX_COUNTRIES,
        fiatCurrencyCodes: DFX_FIAT_CURRENCY_CODES,
        cryptoAssets: DFX_CRYPTO_ASSETS,
        settlementRange: SETTLEMENT_ONE_TO_THREE_DAYS,
        deepPath: '/sell',
        deepQuery
      }
    },
    config
  )
}
