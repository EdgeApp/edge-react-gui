import { guiPlugins } from '../../../constants/plugins/GuiPlugins'
import type {
  RampPluginFactory,
  RampQuoteRequest,
  SettlementRange
} from '../rampPluginTypes'
import {
  createExternalRampPlugin,
  type DirectionSupportData
} from '../utils/createExternalRampPlugin'
import { asInitOptions } from './dfxRampTypes'
import { DFX_SESSION_CHAINS, fetchDfxSessionQuery } from './dfxSession'

// DFX settles SEPA bank transfers within a few business days.
const SETTLEMENT_ONE_TO_THREE_DAYS: SettlementRange = {
  min: { value: 1, unit: 'days' },
  max: { value: 3, unit: 'days' }
}

// EEA countries plus Switzerland where DFX accepts bank transfers. Bulgaria
// is left out: DFX's country list (api.dfx.swiss/v1/country) disallows IBAN,
// bank and KYC there.
const DFX_COUNTRIES = [
  'AT',
  'BE',
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
  'IS',
  'IT',
  'LI',
  'LT',
  'LU',
  'LV',
  'MT',
  'NL',
  'NO',
  'PL',
  'PT',
  'RO',
  'SE',
  'SI',
  'SK'
]

const DFX_FIAT_CURRENCY_CODES = ['EUR', 'CHF']

// Session-login chains plus the chains that open the plain deep link.
const DFX_CRYPTO_ASSETS = [
  ...Object.keys(DFX_SESSION_CHAINS),
  'solana',
  'monero'
].map(pluginId => ({ pluginId, tokenId: null }))

export const dfxRampPlugin: RampPluginFactory = config => {
  const initOptions = asInitOptions(config.initOptions)
  const support: Omit<DirectionSupportData, 'deepPath'> = {
    paymentTypes: ['sepa'],
    countries: DFX_COUNTRIES,
    fiatCurrencyCodes: DFX_FIAT_CURRENCY_CODES,
    cryptoAssets: DFX_CRYPTO_ASSETS,
    settlementRange: SETTLEMENT_ONE_TO_THREE_DAYS,
    deepQuery: {
      wallet: initOptions.wallet,
      lang: 'en'
    }
  }

  // Opens DFX logged in with the selected wallet's address where the chain
  // supports a signature login, otherwise the plain deep link.
  const resolveDeepQuery = async (
    request: RampQuoteRequest
  ): Promise<Record<string, string> | undefined> =>
    await fetchDfxSessionQuery({
      direction: request.direction,
      wallet: request.wallet,
      walletName: initOptions.wallet
    })

  return createExternalRampPlugin(
    'dfx',
    {
      guiPlugin: guiPlugins.dfx,
      partnerIcon: initOptions.partnerIcon,
      buy: { ...support, deepPath: '/buy', resolveDeepQuery },
      sell: { ...support, deepPath: '/sell', resolveDeepQuery }
    },
    config
  )
}
