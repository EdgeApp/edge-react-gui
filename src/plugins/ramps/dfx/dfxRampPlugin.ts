import { guiPlugins } from '../../../constants/plugins/GuiPlugins'
import { locale } from '../../../locales/intl'
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

// Languages DFX's app offers through its `lang` parameter.
const DFX_LANGUAGES = ['en', 'de', 'fr', 'it']

// Session-login chains plus the chains that open DFX without a login, keyed
// by Edge pluginId with DFX's blockchain and native asset names.
const DFX_CHAINS: Readonly<
  Record<string, { readonly blockchain: string; readonly asset: string }>
> = {
  ...DFX_SESSION_CHAINS,
  solana: { blockchain: 'Solana', asset: 'SOL' },
  monero: { blockchain: 'Monero', asset: 'XMR' }
}

const DFX_CRYPTO_ASSETS = Object.keys(DFX_CHAINS).map(pluginId => ({
  pluginId,
  tokenId: null
}))

/**
 * Carries the user's quote choices into DFX's app (its query parameters,
 * github.com/DFXswiss/app#query-parameters): the language, the fiat, the
 * crypto asset and its blockchain, and the amount the user entered.
 * DFX has no amount for the fiat side of a sell, so a fiat-entered sell
 * opens without one.
 */
export function makeDfxRequestQuery(
  request: RampQuoteRequest,
  walletName: string
): Record<string, string> {
  const { amountQuery, amountType, direction } = request
  const isBuy = direction === 'buy'
  const language = locale.localeIdentifier.slice(0, 2).toLowerCase()
  const query: Record<string, string> = {
    wallet: walletName,
    lang: DFX_LANGUAGES.includes(language) ? language : 'en',
    [isBuy ? 'asset-in' : 'asset-out']: request.fiatCurrencyCode
      .replace(/^iso:/i, '')
      .toUpperCase()
  }

  const chain = DFX_CHAINS[request.wallet.currencyInfo.pluginId]
  if (chain != null) {
    query.blockchain = chain.blockchain
    query[isBuy ? 'asset-out' : 'asset-in'] = chain.asset
  }

  if ('exchangeAmount' in amountQuery) {
    // The input side is the fiat on a buy and the crypto on a sell:
    const isInputAmount = isBuy === (amountType === 'fiat')
    if (isInputAmount) query['amount-in'] = amountQuery.exchangeAmount
    else if (isBuy) query['amount-out'] = amountQuery.exchangeAmount
  }

  return query
}

export const dfxRampPlugin: RampPluginFactory = config => {
  const initOptions = asInitOptions(config.initOptions)
  const support: Omit<DirectionSupportData, 'deepPath'> = {
    paymentTypes: ['sepa'],
    countries: DFX_COUNTRIES,
    fiatCurrencyCodes: DFX_FIAT_CURRENCY_CODES,
    cryptoAssets: DFX_CRYPTO_ASSETS,
    settlementRange: SETTLEMENT_ONE_TO_THREE_DAYS,
    deepQuery: { wallet: initOptions.wallet }
  }

  // Opens DFX with the user's quote choices, logged in with the selected
  // wallet's address where the chain supports a signature login. The choices
  // stay when the login is unavailable or fails.
  const resolveDeepQuery = async (
    request: RampQuoteRequest
  ): Promise<Record<string, string>> => {
    const sessionQuery = await fetchDfxSessionQuery({
      wallet: request.wallet,
      walletName: initOptions.wallet
    })
    return {
      ...makeDfxRequestQuery(request, initOptions.wallet),
      ...sessionQuery
    }
  }

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
