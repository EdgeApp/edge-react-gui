// @flow
import { mul } from 'biggystring'

import {
  type FiatProvider,
  type FiatProviderApproveQuoteParams,
  type FiatProviderAssetMap,
  type FiatProviderFactory,
  type FiatProviderFactoryParams,
  type FiatProviderGetQuoteParams,
  type FiatProviderQuote
} from '../fiatProviderTypes'
const pluginId = 'simplex'

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

const allowedCurrencyCodes: FiatProviderAssetMap = {}

for (const pluginId in SIMPLEX_ID_MAP) {
  const codesObject = SIMPLEX_ID_MAP[pluginId]
  for (const currencyCode in codesObject) {
    if (allowedCurrencyCodes[pluginId] == null) allowedCurrencyCodes[pluginId] = {}
    allowedCurrencyCodes[pluginId][currencyCode] = true
  }
}

export const dummyProvider: FiatProviderFactory = {
  pluginId,
  makeProvider: async (params: FiatProviderFactoryParams): Promise<FiatProvider> => {
    const out = {
      pluginId,
      getSupportedAssets: async (): Promise<FiatProviderAssetMap> => allowedCurrencyCodes,
      getQuote: async (params: FiatProviderGetQuoteParams): Promise<FiatProviderQuote | void> => {
        let pairCodes
        const url = 'https://rates2.edge.app/v1/exchangeRate?currency_pair='
        const { tokenId = 'BTC' } = params.tokenId
        let fiatAmount, cryptoAmount
        if (params.amountType === 'fiat') {
          pairCodes = `USD_${tokenId}`
        } else {
          pairCodes = `${tokenId}_USD`
        }

        const response = await fetch(url + pairCodes).catch(e => undefined)
        if (response == null || !response.ok) return
        const result = await response.json().catch(e => undefined)

        if (params.amountType === 'fiat') {
          cryptoAmount = result?.exchangeRate ?? '0'
          cryptoAmount = mul(cryptoAmount, params.exchangeAmount)
          fiatAmount = params.exchangeAmount
        } else {
          fiatAmount = result?.exchangeRate ?? '0'
          fiatAmount = mul(fiatAmount, params.exchangeAmount)
          cryptoAmount = params.exchangeAmount
        }

        const paymentQuote: FiatProviderQuote = {
          tokenId: params.tokenId,
          isEstimate: false,
          fiatCurrencyCode: params.fiatCurrencyCode,
          fiatAmount,
          cryptoAmount,
          direction: params.direction,
          expirationDate: new Date(Date.now() + 60000),
          approveQuote: async (params: FiatProviderApproveQuoteParams): Promise<void> => {},
          closeQuote: async (): Promise<void> => {}
        }
        return paymentQuote
      }
    }
    return out
  }
}
