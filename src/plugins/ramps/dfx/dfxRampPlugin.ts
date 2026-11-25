import { floor } from 'biggystring'

import { showToastSpinner } from '../../../components/services/AirshipInstance'
import { guiPlugins } from '../../../constants/plugins/GuiPlugins'
import { locale } from '../../../locales/intl'
import { lstrings } from '../../../locales/strings'
import type {
  RampPluginFactory,
  RampQuoteRequest,
  SettlementRange
} from '../rampPluginTypes'
import {
  createExternalRampPlugin,
  type DirectionSupportData
} from '../utils/createExternalRampPlugin'
import { fetchDfxSellCryptoAmount } from './dfxQuote'
import { asInitOptions } from './dfxRampTypes'
import { openDfxSell } from './dfxSell'
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

// DFX is offered only on the chains where Edge logs the wallet in to DFX.
// DFX also supports other chains, such as Solana and Monero, but Edge does
// not log wallets on those chains in to DFX, so DFX would open without the
// wallet's address.
const DFX_CRYPTO_ASSETS = Object.keys(DFX_SESSION_CHAINS).map(pluginId => ({
  pluginId,
  tokenId: null
}))

/**
 * Carries the user's quote choices into DFX's app (its query parameters,
 * github.com/DFXswiss/app#query-parameters): the language, the fiat, the
 * crypto asset and its blockchain (the only ones DFX's page then offers),
 * and the amount the user entered or a sell's Max.
 * A fiat-entered sell carries the fiat as `amount-out`, which DFX only turns
 * into a crypto amount once the user picks a bank account, so
 * `resolveDeepQuery` swaps in the crypto amount when DFX can quote it.
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

  const chain = DFX_SESSION_CHAINS[request.wallet.currencyInfo.pluginId]
  if (chain != null) {
    query.blockchain = chain.blockchain
    query[isBuy ? 'asset-out' : 'asset-in'] = chain.asset
    // Leaves DFX's page only the wallet's own asset on its own chain.
    // Otherwise a buy could deliver on any chain DFX offers for an EVM
    // address, even one Edge doesn't support, and a sell could hand back an
    // order this wallet can't pay. DFX also matches bare names, so ETH alone
    // would still offer ETH on Arbitrum, Optimism and Base:
    query.assets = `${chain.blockchain}/${chain.asset}`
  }

  if ('exchangeAmount' in amountQuery) {
    // The input side is the fiat on a buy and the crypto on a sell:
    const isInputAmount = isBuy === (amountType === 'fiat')
    query[isInputAmount ? 'amount-in' : 'amount-out'] =
      amountQuery.exchangeAmount
  } else if ('maxExchangeAmount' in amountQuery && !isBuy) {
    // A sell's Max is the most crypto the wallet can spend after fees.
    // DFX turns the amount into a JavaScript number, so round it down to 8
    // decimals: an EVM Max has 18, which DFX would show in full and could
    // hand back a few wei above the Max. A Max below 8 decimals still goes,
    // as 0, since without an amount DFX fills in its own default:
    query['amount-in'] = floor(amountQuery.maxExchangeAmount, -8)
  }

  return query
}

/**
 * The crypto amount for a fiat-entered sell, from DFX's quote for the
 * fiat in `amount-out`. On a sell, the request query names the crypto as
 * `asset-in` and the fiat as `asset-out`. Undefined for other requests or
 * without a quote.
 */
async function fetchFiatSellCryptoAmount(
  request: RampQuoteRequest,
  query: Record<string, string>
): Promise<string | undefined> {
  const {
    blockchain,
    'asset-in': asset,
    'asset-out': fiat,
    'amount-out': fiatAmount
  } = query
  if (
    request.direction !== 'sell' ||
    blockchain == null ||
    asset == null ||
    fiatAmount == null
  ) {
    return undefined
  }
  return await fetchDfxSellCryptoAmount({
    blockchain,
    asset,
    fiat,
    fiatAmount
  })
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
  // wallet's address. The choices stay when the login fails, but DFX does
  // not open when it blocks the country of the user's IP address
  // (RampIpCountryError). A fiat-entered sell opens with the crypto amount
  // DFX quotes for the fiat, when it can quote one.
  const resolveDeepQuery = async (
    request: RampQuoteRequest
  ): Promise<Record<string, string>> => {
    const query = makeDfxRequestQuery(request, initOptions.wallet)
    const [sessionQuery, sellCryptoAmount] = await Promise.all([
      fetchDfxSessionQuery({
        wallet: request.wallet,
        walletName: initOptions.wallet
      }),
      fetchFiatSellCryptoAmount(request, query)
    ])
    if (sellCryptoAmount != null) {
      delete query['amount-out']
      query['amount-in'] = sellCryptoAmount
    }
    return { ...query, ...sessionQuery }
  }

  // A logged-in sell hands the order back to Edge, which fetches the deposit
  // address with the session and opens the send scene. Without a session
  // DFX's page shows the address for a manual transfer, as before.
  const approveSell = async (request: RampQuoteRequest): Promise<void> => {
    const deepQuery = {
      ...support.deepQuery,
      ...(await showToastSpinner(
        lstrings.fiat_plugin_finalizing_quote,
        resolveDeepQuery(request)
      ))
    }
    const chain = DFX_SESSION_CHAINS[request.wallet.currencyInfo.pluginId]
    if (
      chain != null &&
      deepQuery.session != null &&
      deepQuery.session !== ''
    ) {
      await openDfxSell({
        config,
        guiPlugin: guiPlugins.dfx,
        deepPath: '/sell',
        deepQuery,
        request,
        chain
      })
      return
    }
    config.navigation.navigate('pluginViewSell', {
      plugin: guiPlugins.dfx,
      deepPath: '/sell',
      deepQuery
    })
  }

  const plugin = createExternalRampPlugin(
    'dfx',
    {
      guiPlugin: guiPlugins.dfx,
      partnerIcon: initOptions.partnerIcon,
      buy: { ...support, deepPath: '/buy', resolveDeepQuery },
      sell: { ...support, deepPath: '/sell', resolveDeepQuery }
    },
    config
  )

  return {
    ...plugin,
    fetchQuotes: async (request, opts) => {
      const quotes = await plugin.fetchQuotes(request, opts)
      if (request.direction !== 'sell') return quotes
      return quotes.map(quote => ({
        ...quote,
        approveQuote: async () => {
          await approveSell(request)
        }
      }))
    }
  }
}
