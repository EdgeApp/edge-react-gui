// import { div, gt, lt, mul, toFixed } from 'biggystring'
import { gt, lt } from 'biggystring'
import { asArray, asEither, asNumber, asObject, asString } from 'cleaners'

import { fetchInfo } from '../../../util/network'
import { asFiatPaymentType, FiatPaymentType } from '../fiatPluginTypes'
import {
  FiatProvider,
  FiatProviderApproveQuoteParams,
  FiatProviderAssetMap,
  FiatProviderError,
  FiatProviderExactRegions,
  FiatProviderFactory,
  FiatProviderFactoryParams,
  FiatProviderGetQuoteParams,
  FiatProviderQuote
} from '../fiatProviderTypes'
import { addTokenToArray } from '../util/providerUtils'
import { addExactRegion, isDailyCheckDue, validateExactRegion } from './common'
const providerId = 'simplex'
const storeId = 'co.edgesecure.simplex'
const partnerIcon = 'simplex-logo-sm-square.png'
const pluginDisplayName = 'Simplex'

// https://integrations.simplex.com/docs/supported_currencies
const SIMPLEX_ID_MAP: { [pluginId: string]: { [currencyCode: string]: string } } = {
  algorand: { ALGO: 'ALGO' },
  avalanche: { AVAX: 'AVAX-C' },
  binance: { AVA: 'AVA', BNB: 'BNB' },
  binancesmartchain: {
    BABYDOGE: 'BABYDOGE',
    BAKE: 'BAKE',
    BNB: 'BNB',
    BUSD: 'BUSD-SC',
    CAKE: 'CAKE',
    EGC: 'EGC',
    KMON: 'KMON',
    SATT: 'SATT-SC',
    TCT: 'TCT',
    ULTI: 'ULTI',
    USDC: 'USDC-SC',
    XVS: 'XVS'
  },
  bitcoin: { BTC: 'BTC' },
  bitcoincash: { BCH: 'BCH' },
  bitcoinsv: { BSV: 'BSV' },
  cardano: { ADA: 'ADA' },
  celo: { CELO: 'CELO', CEUR: 'CEUR', CUSD: 'CUSD' },
  digibyte: { DGB: 'DGB' },
  dogecoin: { DOGE: 'DOGE' },
  eos: { EOS: 'EOS' },
  ethereum: {
    '1EARTH': '1EARTH',
    AAVE: 'AAVE',
    AXS: 'AXS-ERC20',
    BAT: 'BAT',
    BUSD: 'BUSD',
    CEL: 'CEL',
    CHZ: 'CHZ',
    COMP: 'COMP',
    COTI: 'COTI-ERC20',
    CRO: 'CRO-ERC20',
    DAI: 'DAI',
    DEP: 'DEP',
    DFT: 'DFT',
    ELON: 'ELON',
    ENJ: 'ENJ',
    ETH: 'ETH',
    GALA: 'GALA',
    GHX: 'GHX',
    GMT: 'GMT-ERC20',
    GOVI: 'GOVI',
    HEDG: 'HEDG',
    HGOLD: 'HGOLD',
    HUSD: 'HUSD',
    KCS: 'KCS',
    LINK: 'LINK',
    MANA: 'MANA',
    MATIC: 'MATIC-ERC20',
    MKR: 'MKR',
    PEPE: 'PEPE',
    PRT: 'PRT',
    REVV: 'REVV',
    RFOX: 'RFOX',
    RFUEL: 'RFUEL',
    RLY: 'RLY-ERC20',
    SAND: 'SAND',
    SATT: 'SATT-ERC20',
    SHIB: 'SHIB',
    SUSHI: 'SUSHI',
    TRU: 'TRU',
    TUSD: 'TUSD',
    UNI: 'UNI',
    UOS: 'UOS-ERC20',
    USDC: 'USDC',
    USDK: 'USDK',
    USDP: 'USDP',
    USDT: 'USDT',
    VNDC: 'VNDC',
    WBTC: 'WBTC',
    XAUT: 'XAUT',
    XYO: 'XYO'
  },
  fantom: { FTM: 'FTM' },
  filecoin: { FIL: 'FIL' },
  hedera: { HBAR: 'HBAR' },
  litecoin: { LTC: 'LTC' },
  one: { ONE: 'ONE' },
  optimism: { ETH: 'ETH-OPTIMISM', OP: 'OP' },
  polkadot: { DOT: 'DOT' },
  polygon: { GMEE: 'GMEE', MATIC: 'MATIC', USDC: 'USDC-MATIC' },
  qtum: { QTUM: 'QTUM' },
  ravencoin: { RVN: 'RVN' },
  ripple: { XRP: 'XRP' },
  solana: { KIN: 'KIN', SOL: 'SOL' },
  stellar: { XLM: 'XLM' },
  tezos: { XTZ: 'XTZ' },
  tron: {
    BTT: 'BTT',
    KLV: 'KLV',
    TRX: 'TRX',
    USDC: 'USDC-TRC20',
    USDT: 'USDT-TRC20'
  },
  wax: { WAX: 'WAXP' }
}

const allowedCurrencyCodes: FiatProviderAssetMap = { providerId, crypto: {}, fiat: {} }
const allowedCountryCodes: FiatProviderExactRegions = {}
const allowedPaymentTypes: { [Payment in FiatPaymentType]?: boolean } = { applepay: true, credit: true, googlepay: true }

const asSimplexApiKeys = asObject({
  partner: asString,
  jwtTokenProvider: asString,
  publicKey: asString
})

const asSimplexFiatCurrency = asObject({
  ticker_symbol: asString,
  min_amount: asString,
  max_amount: asString
})

// {
//   "error": "The BTC amount must be between 0.00230159 and 0.92063455",
//   "type": "invalidAmountLimit"
// }
const asSimplexQuoteError = asObject({
  error: asString,
  type: asString
})

const asSimplexQuoteSuccess = asObject({
  digital_money: asObject({
    currency: asString,
    amount: asNumber
  }),
  fiat_money: asObject({
    currency: asString,
    amount: asNumber
  })
})

const asSimplexQuote = asEither(asSimplexQuoteSuccess, asSimplexQuoteError)
const asSimplexFiatCurrencies = asArray(asSimplexFiatCurrency)
const asSimplexCountries = asArray(asString)
const asInfoJwtSignResponse = asObject({ token: asString })
let lastChecked = 0

export const simplexProvider: FiatProviderFactory = {
  providerId,
  storeId,
  makeProvider: async (params: FiatProviderFactoryParams): Promise<FiatProvider> => {
    const {
      apiKeys,
      getTokenId,
      io: { makeUuid, store }
    } = params

    for (const pluginId in SIMPLEX_ID_MAP) {
      const codesObject = SIMPLEX_ID_MAP[pluginId]
      for (const currencyCode in codesObject) {
        if (allowedCurrencyCodes.crypto[pluginId] == null) allowedCurrencyCodes.crypto[pluginId] = []
        const tokens = allowedCurrencyCodes.crypto[pluginId]
        const tokenId = getTokenId(pluginId, currencyCode)
        if (tokenId === undefined) continue
        addTokenToArray({ tokenId }, tokens)
      }
    }

    let simplexUserId = await store.getItem('simplex_user_id').catch(e => undefined)
    if (simplexUserId == null || simplexUserId === '') {
      simplexUserId = await makeUuid()
      await store.setItem('simplex_user_id', simplexUserId)
    }

    const { publicKey, partner, jwtTokenProvider } = asSimplexApiKeys(apiKeys)
    const out: FiatProvider = {
      providerId,
      partnerIcon,
      pluginDisplayName,
      getSupportedAssets: async ({ direction, regionCode, paymentTypes }): Promise<FiatProviderAssetMap> => {
        if (direction !== 'buy') {
          throw new FiatProviderError({ providerId, errorType: 'paymentUnsupported' })
        }

        // Return nothing if paymentTypes are not supported by this provider
        if (!paymentTypes.some(paymentType => allowedPaymentTypes[paymentType] === true))
          throw new FiatProviderError({ providerId, errorType: 'paymentUnsupported' })

        if (isDailyCheckDue(lastChecked)) {
          const response = await fetch(`https://api.simplexcc.com/v2/supported_fiat_currencies?public_key=${publicKey}`).catch(e => undefined)
          if (response == null || !response.ok) return allowedCurrencyCodes
          const result = await response.json()

          const fiatCurrencies = asSimplexFiatCurrencies(result)
          for (const fc of fiatCurrencies) {
            allowedCurrencyCodes.fiat['iso:' + fc.ticker_symbol] = fc
          }

          const response2 = await fetch(`https://api.simplexcc.com/v2/supported_countries?public_key=${publicKey}&payment_methods=credit_card`).catch(
            e => undefined
          )
          if (response2 == null || !response.ok) throw new Error('Simplex failed to fetch supported countries')
          const result2 = await response2.json()
          const countries = asSimplexCountries(result2)

          for (const country of countries) {
            const [countryCode, stateProvinceCode] = country.split('-')
            addExactRegion(allowedCountryCodes, countryCode, stateProvinceCode)
          }
          lastChecked = Date.now()
        }
        validateExactRegion(providerId, regionCode, allowedCountryCodes)

        return allowedCurrencyCodes
      },
      getQuote: async (params: FiatProviderGetQuoteParams): Promise<FiatProviderQuote> => {
        const { direction, regionCode, exchangeAmount, amountType, paymentTypes, displayCurrencyCode } = params
        validateExactRegion(providerId, regionCode, allowedCountryCodes)
        if (direction !== 'buy') {
          throw new FiatProviderError({ providerId, errorType: 'paymentUnsupported' })
        }

        if (!allowedCountryCodes[regionCode.countryCode]) throw new FiatProviderError({ providerId, errorType: 'regionRestricted', displayCurrencyCode })
        if (!paymentTypes.some(paymentType => allowedPaymentTypes[paymentType] === true))
          throw new FiatProviderError({ providerId, errorType: 'paymentUnsupported' })

        let foundPaymentType = false
        for (const type of paymentTypes) {
          const t = asFiatPaymentType(type)
          if (allowedPaymentTypes[t]) {
            foundPaymentType = true
            break
          }
        }
        if (!foundPaymentType) throw new FiatProviderError({ providerId, errorType: 'paymentUnsupported' })

        const ts = Math.floor(Date.now() / 1000)
        const simplexCryptoCode = SIMPLEX_ID_MAP[params.pluginId][params.displayCurrencyCode]
        const simplexFiatCode = asSimplexFiatCurrency(allowedCurrencyCodes.fiat[params.fiatCurrencyCode]).ticker_symbol
        let socn, tacn
        const soam = parseFloat(exchangeAmount)
        if (amountType === 'fiat') {
          socn = simplexFiatCode
          tacn = simplexCryptoCode
        } else {
          socn = simplexCryptoCode
          tacn = simplexFiatCode
        }

        const response = await fetchInfo(
          'v1/jwtSign/simplex',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data: { euid: simplexUserId, ts, soam, socn, tacn } })
          },
          3000
        ).catch(e => {
          console.log(e)
          return undefined
        })
        if (response == null || !response.ok) throw new Error('Simplex failed to fetch jwttoken')
        const result = await response.json()
        const { token } = asInfoJwtSignResponse(result)

        const url = `https://partners.simplex.com/api/quote?partner=${partner}&t=${token}`
        const response2 = await fetch(url)
        if (response2 == null) throw new Error('Simplex failed to fetch quote')
        const result2 = await response2.json()
        const quote = asSimplexQuote(result2)

        console.log('Got Simplex quote')
        console.log(JSON.stringify(quote, null, 2))

        // @ts-expect-error
        if (quote.error != null) {
          // @ts-expect-error
          if (quote.type === 'invalidAmountLimit' || quote.type === 'amount_Limit_exceeded') {
            // @ts-expect-error
            const result3 = quote.error.match(/The (.*) amount must be between (.*) and (.*)/)
            if (result3 == null || result3.length < 4) throw new Error('Simplex unknown error')
            const [fiatCode, minLimit, maxLimit] = result3.slice(1, 4)

            if (gt(params.exchangeAmount, maxLimit)) {
              throw new FiatProviderError({ providerId, errorType: 'overLimit', errorAmount: parseFloat(maxLimit), displayCurrencyCode: fiatCode })
            }
            if (lt(params.exchangeAmount, minLimit)) {
              throw new FiatProviderError({ providerId, errorType: 'underLimit', errorAmount: parseFloat(minLimit), displayCurrencyCode: fiatCode })
            }
          }
          throw new Error('Simplex unknown error')
        }
        const goodQuote = asSimplexQuoteSuccess(quote)

        const paymentQuote: FiatProviderQuote = {
          providerId,
          partnerIcon,
          regionCode,
          paymentTypes,
          pluginDisplayName,
          displayCurrencyCode: params.displayCurrencyCode,
          isEstimate: false,
          fiatCurrencyCode: params.fiatCurrencyCode,
          fiatAmount: goodQuote.fiat_money.amount.toString(),
          cryptoAmount: goodQuote.digital_money.amount.toString(),
          direction: params.direction,
          expirationDate: new Date(Date.now() + 8000),
          approveQuote: async (approveParams: FiatProviderApproveQuoteParams): Promise<void> => {
            const { showUi, coreWallet } = approveParams
            const receiveAddress = await coreWallet.getReceiveAddress({ tokenId: null })

            const data = {
              ts: Math.floor(Date.now() / 1000),
              euid: simplexUserId,
              crad: receiveAddress.publicAddress,
              crcn: simplexCryptoCode,
              ficn: simplexFiatCode,
              fiam: goodQuote.fiat_money.amount
            }

            const response = await fetchInfo(`v1/jwtSign/${jwtTokenProvider}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ data })
            }).catch(e => {
              console.log(e)
              return undefined
            })
            if (response == null || !response.ok) return
            const result = await response.json()
            const { token } = asInfoJwtSignResponse(result)

            const url = `https://partners.simplex.com/?partner=${partner}&t=${token}`

            console.log('Approving simplex quote url=' + url)
            await showUi.openExternalWebView({ url })
          },
          closeQuote: async (): Promise<void> => {}
        }
        return paymentQuote
      },
      otherMethods: null
    }
    return out
  }
}
