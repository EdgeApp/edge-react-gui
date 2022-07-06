// @flow
// import { div, gt, lt, mul, toFixed } from 'biggystring'
import { gt, lt } from 'biggystring'
import { asArray, asEither, asNumber, asObject, asString } from 'cleaners'

import { fetchInfo, makeUuid } from '../../../util/utils'
import { asFiatPaymentTypes } from '../fiatPluginTypes'
import {
  type FiatProvider,
  type FiatProviderApproveQuoteParams,
  type FiatProviderAssetMap,
  type FiatProviderFactory,
  type FiatProviderFactoryParams,
  type FiatProviderGetQuoteParams,
  type FiatProviderQuote,
  FiatProviderError
} from '../fiatProviderTypes'
const pluginId = 'simplex'
const storeId = 'co.edgesecure.simplex'
const partnerIcon = 'simplex-logo-sm-square.png'
const pluginDisplayName = 'Simplex'

const SIMPLEX_ID_MAP: { [pluginId: string]: { [currencyCode: string]: string } } = {
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
  groestlcoin: { GRS: 'GRS' },
  hedera: { HBAR: 'HBAR' },
  litecoin: { LTC: 'LTC' },
  one: { ONE: 'ONE' },
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

const allowedCurrencyCodes: FiatProviderAssetMap = { crypto: {}, fiat: {} }
const allowedCountryCodes: { [code: string]: boolean } = {}
const allowedPaymentTypes = { applepay: true, credit: true }

for (const pluginId in SIMPLEX_ID_MAP) {
  const codesObject = SIMPLEX_ID_MAP[pluginId]
  for (const currencyCode in codesObject) {
    if (allowedCurrencyCodes.crypto[pluginId] == null) allowedCurrencyCodes.crypto[pluginId] = {}
    allowedCurrencyCodes.crypto[pluginId][currencyCode] = true
  }
}

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

export const simplexProvider: FiatProviderFactory = {
  pluginId,
  storeId,
  makeProvider: async (params: FiatProviderFactoryParams): Promise<FiatProvider> => {
    const {
      apiKeys,
      direction,
      io: { store }
    } = params
    if (direction !== 'buy') throw new Error('Only buy supported by Simplex')

    let simplexUserId = await store.getItem('simplex_user_id').catch(e => undefined)
    if (simplexUserId == null || simplexUserId === '') {
      simplexUserId = makeUuid()
      await store.setItem('simplex_user_id', simplexUserId)
    }

    const { publicKey, partner, jwtTokenProvider } = asSimplexApiKeys(apiKeys)
    const out = {
      pluginId,
      partnerIcon,
      pluginDisplayName,
      getSupportedAssets: async (): Promise<FiatProviderAssetMap> => {
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
        if (response2 == null || !response.ok) return allowedCurrencyCodes
        const result2 = await response2.json()
        const countries = asSimplexCountries(result2)

        for (const country of countries) {
          const [countryCode] = country.split('-')
          allowedCountryCodes[countryCode.toUpperCase()] = true
        }

        return allowedCurrencyCodes
      },
      getQuote: async (params: FiatProviderGetQuoteParams): Promise<FiatProviderQuote> => {
        const { regionCode, exchangeAmount, amountType, paymentTypes } = params
        if (!allowedCountryCodes[regionCode.countryCode]) throw new FiatProviderError({ errorType: 'regionRestricted' })
        let foundPaymentType = false
        for (const type of paymentTypes) {
          const t = asFiatPaymentTypes(type)
          if (allowedPaymentTypes[t]) {
            foundPaymentType = true
            break
          }
        }
        if (!foundPaymentType) throw new FiatProviderError({ errorType: 'paymentUnsupported' })

        const ts = Math.floor(Date.now() / 1000)
        const simplexCryptoCode = SIMPLEX_ID_MAP[params.tokenId.pluginId][params.tokenId?.tokenId ?? '']
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
            body: JSON.stringify({ data: { ts, soam, socn, tacn } })
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

        if (quote.error != null) {
          if (quote.type === 'invalidAmountLimit') {
            const result3 = quote.error.match(/The (.*) amount must be between (.*) and (.*)/)
            if (result3 == null || result3.length < 4) throw new Error('Simplex unknown error')
            const [minLimit, maxLimit] = result3.slice(2, 4)

            if (gt(params.exchangeAmount, maxLimit)) {
              throw new FiatProviderError({ errorType: 'overLimit', errorAmount: parseFloat(maxLimit) })
            }
            if (lt(params.exchangeAmount, minLimit)) {
              throw new FiatProviderError({ errorType: 'underLimit', errorAmount: parseFloat(minLimit) })
            }
          }
          throw new Error('Simplex unknown error')
        }
        const goodQuote = asSimplexQuoteSuccess(quote)

        const paymentQuote: FiatProviderQuote = {
          pluginId,
          partnerIcon,
          regionCode,
          paymentTypes,
          pluginDisplayName,
          tokenId: params.tokenId,
          isEstimate: false,
          fiatCurrencyCode: params.fiatCurrencyCode,
          fiatAmount: goodQuote.fiat_money.amount.toString(),
          cryptoAmount: goodQuote.digital_money.amount.toString(),
          expirationDate: new Date(Date.now() + 8000),
          approveQuote: async (approveParams: FiatProviderApproveQuoteParams): Promise<void> => {
            const { showUi, coreWallet } = approveParams
            const receiveAddress = await coreWallet.getReceiveAddress()

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
            showUi.openWebView({ url })
          },
          closeQuote: async (): Promise<void> => {}
        }
        return paymentQuote
      }
    }
    return out
  }
}
