import { describe, it } from '@jest/globals'

import { FiatProviderGetTokenIdFromContract } from '../../plugins/gui/fiatProviderTypes'
import { ProviderSupportStore } from '../../plugins/gui/providers/ProviderSupportStore'
import { processRevolutConfig } from '../../plugins/gui/providers/revolutProvider'

describe('processRevolutConfig', function () {
  it('should add supported assets', function () {
    const supportedAssets = new ProviderSupportStore('revolut')
    supportedAssets.add.direction('buy')
    supportedAssets.add.direction('sell')

    processRevolutConfig(configData, getTokenIdFromContract, supportedAssets)

    // Buy and sell support
    expect(supportedAssets.is.direction('buy').supported).toBe(true)
    expect(supportedAssets.is.direction('sell').supported).toBe(true)

    // Country and region support
    expect(supportedAssets.is.direction('buy').region('GB').supported).toBe(
      true
    )
    expect(supportedAssets.is.direction('buy').region('GB').supported).toBe(
      true
    )
    expect(
      supportedAssets.is.direction('sell').region('GB:FOO').supported
    ).toBe(true)
    expect(
      supportedAssets.is.direction('sell').region('GB:FOO').supported
    ).toBe(true)

    // Fiat support
    expect(
      supportedAssets.is.direction('buy').region('GB').fiat('iso:GBP').supported
    ).toBe(true)
    expect(
      supportedAssets.is.direction('sell').region('GB').fiat('iso:GBP')
        .supported
    ).toBe(true)

    // Crypto support
    expect(
      supportedAssets.is
        .direction('buy')
        .region('GB')
        .fiat('iso:GBP')
        .payment('revolut')
        .crypto('bitcoin:null').supported
    ).toBe(true)
    expect(
      supportedAssets.is
        .direction('sell')
        .region('GB')
        .fiat('iso:GBP')
        .payment('revolut')
        .crypto('bitcoin:null').supported
    ).toBe(true)
    expect(
      supportedAssets.is
        .direction('buy')
        .region('GB')
        .fiat('iso:GBP')
        .payment('revolut')
        .crypto('ethereum:null').supported
    ).toBe(true)
    expect(
      supportedAssets.is
        .direction('sell')
        .region('GB')
        .fiat('iso:GBP')
        .payment('revolut')
        .crypto('ethereum:null').supported
    ).toBe(true)

    // Token support
    expect(
      supportedAssets.is
        .direction('buy')
        .region('GB')
        .fiat('iso:GBP')
        .payment('revolut')
        .crypto('ethereum:a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48').supported
    ).toBe(true)
    expect(
      supportedAssets.is
        .direction('sell')
        .region('GB')
        .fiat('iso:GBP')
        .payment('revolut')
        .crypto('ethereum:a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48').supported
    ).toBe(true)

    // Wildcards
    expect(
      supportedAssets.is
        .direction('*')
        .region('*')
        .fiat('*')
        .payment('*')
        .crypto('bitcoin:null').supported
    ).toBe(true)
    expect(
      supportedAssets.is
        .direction('*')
        .region('*')
        .fiat('*')
        .payment('*')
        .crypto('ethereum:null').supported
    ).toBe(true)
    expect(
      supportedAssets.is
        .direction('*')
        .region('*')
        .fiat('*')
        .payment('*')
        .crypto('ethereum:a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48').supported
    ).toBe(true)
  })

  it('should return the asset map', function () {
    const supportedAssets = new ProviderSupportStore('revolut')
    supportedAssets.add.direction('buy')
    supportedAssets.add.direction('sell')

    processRevolutConfig(configData, getTokenIdFromContract, supportedAssets)

    const assetMap = supportedAssets.getFiatProviderAssetMap({
      direction: 'buy',
      region: 'GB',
      payment: 'revolut'
    })

    expect(assetMap).toEqual({
      providerId: 'revolut',
      crypto: {
        ethereum: [
          { tokenId: null },
          {
            tokenId: 'a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'
          },
          {
            tokenId: 'dac17f958d2ee523a2206206994597c13d831ec7'
          },
          {
            tokenId: '1f9840a85d5af5bf1d1762f925bdaddc4201f984'
          },
          {
            tokenId: '7d1afa7b718fb893db30a3abc0cfc608aacfebb0'
          },
          {
            tokenId: '95ad61b0a150d79219dcf64e1e6cc01f0b64c4ce'
          },
          {
            tokenId: '514910771af9ca656af840dff83e8264ecf986ca'
          },
          {
            tokenId: '3506424f91fd33084466f402d5d97f05f8e3b4af'
          },
          {
            tokenId: '4a220e6096b25eadb88358cb44068a3248254675'
          },
          {
            tokenId: '04fa0d235c4abf4bcf4787af4cf447de572ef828'
          },
          {
            tokenId: 'e41d2489571d322189246dafa5ebde1f4699f498'
          },
          {
            tokenId: '7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9'
          },
          {
            tokenId: '111111111117dc0aa78b770fa6a738034120c302'
          },
          {
            tokenId: 'c011a73ee8576fb46f5e1c5751ca3b9fe0af2a6f'
          },
          {
            tokenId: 'd533a949740bb3306d119cc777fa900ba034cd52'
          },
          {
            tokenId: '4d224452801aced8b2f0aebe155379bb5d594381'
          },
          {
            tokenId: '9f8f72aa9304c8b593d555f12ef6589cc3a579a2'
          },
          {
            tokenId: 'bc396689893d065f41bc2c6ecbee5e0085233447'
          },
          {
            tokenId: 'ba100000625a3754423978a60c9317c58a424e3d'
          },
          {
            tokenId: 'c944e90c64b2c07662a292be6244bdf05cda44a7'
          }
        ],
        bitcoin: [{ tokenId: null }],
        ripple: [{ tokenId: null }],
        solana: [{ tokenId: null }],
        stellar: [{ tokenId: null }],
        litecoin: [{ tokenId: null }],
        dogecoin: [{ tokenId: null }],
        polkadot: [{ tokenId: null }],
        bitcoincash: [{ tokenId: null }],
        tezos: [{ tokenId: null }],
        algorand: [{ tokenId: null }],
        avalanche: [{ tokenId: null }],
        cardano: [{ tokenId: null }],
        polygon: [{ tokenId: null }]
      },
      fiat: {
        'iso:GBP': true,
        'iso:EUR': true,
        'iso:USD': true,
        'iso:AUD': true,
        'iso:CAD': true,
        'iso:CHF': true,
        'iso:CZK': true,
        'iso:DKK': true,
        'iso:HKD': true,
        'iso:HUF': true,
        'iso:JPY': true,
        'iso:NOK': true,
        'iso:NZD': true,
        'iso:PLN': true,
        'iso:RON': true,
        'iso:SEK': true,
        'iso:SGD': true,
        'iso:ZAR': true
      }
    })
  })

  it('should return the info objects', function () {
    const supportedAssets = new ProviderSupportStore('revolut')
    supportedAssets.add.direction('buy')
    supportedAssets.add.direction('sell')

    processRevolutConfig(configData, getTokenIdFromContract, supportedAssets)

    const fiatInfo = supportedAssets.getFiatInfo('iso:GBP')
    expect(fiatInfo).toEqual({
      currency: 'GBP',
      max_limit: 10000,
      min_limit: 5
    })

    const cryptoInfo = supportedAssets.getCryptoInfo('bitcoin:null')
    expect(cryptoInfo).toEqual({
      id: 'BTC',
      currency: 'BTC',
      blockchain: 'BITCOIN'
    })
  })
})

/**
 * From command-line:
 * ```
 * curl -X GET 'https://ramp-partners.revolut.codes/partners/api/2.0/config' \
 *   -H 'Accept: application/json' \
 *   -H "X-API-KEY: $API_KEY" | pbcopy
 * ```
 */
const configData = JSON.parse(
  `{"version":"1.0.0","countries":["AT","AZ","BE","BG","CH","CY","CZ","DE","DK","EC","EE","ES","FI","FR","GB","GE","GR","GT","HK","HN","HR","HU","IE","IS","IT","KE","KW","KZ","LI","LK","LT","LU","LV","MG","MT","MZ","NL","NO","OM","PL","PT","RO","SA","SE","SI","SK","TH","ZA"],"fiat":[{"currency":"GBP","min_limit":5,"max_limit":10000},{"currency":"EUR","min_limit":6,"max_limit":11000},{"currency":"USD","min_limit":7,"max_limit":12000},{"currency":"AUD","min_limit":10,"max_limit":19000},{"currency":"CAD","min_limit":9,"max_limit":16000},{"currency":"CHF","min_limit":6,"max_limit":11000},{"currency":"CZK","min_limit":150,"max_limit":270000},{"currency":"DKK","min_limit":50,"max_limit":86000},{"currency":"HKD","min_limit":55,"max_limit":99000},{"currency":"HUF","min_limit":2300,"max_limit":4300000},{"currency":"JPY","min_limit":950,"max_limit":1800000},{"currency":"NOK","min_limit":70,"max_limit":130000},{"currency":"NZD","min_limit":12,"max_limit":20000},{"currency":"PLN","min_limit":30,"max_limit":51000},{"currency":"RON","min_limit":31,"max_limit":57000},{"currency":"SEK","min_limit":75,"max_limit":130000},{"currency":"SGD","min_limit":10,"max_limit":17000},{"currency":"ZAR","min_limit":130,"max_limit":230000}],"crypto":[{"id":"ETH","currency":"ETH","blockchain":"ETHEREUM"},{"id":"BTC","currency":"BTC","blockchain":"BITCOIN"},{"id":"USDC-ETH","currency":"USDC","blockchain":"ETHEREUM","smartContractAddress":"0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"},{"id":"USDT-ETH","currency":"USDT","blockchain":"ETHEREUM","smartContractAddress":"0xdAC17F958D2ee523a2206206994597C13D831ec7"},{"id":"USDT-OP","currency":"USDT","blockchain":"OPTIMISM","smartContractAddress":"0x94b008aa00579c1307b0ef2c499ad98a8ce58e58"},{"id":"UNI-ETH","currency":"UNI","blockchain":"ETHEREUM","smartContractAddress":"0x1f9840a85d5af5bf1d1762f925bdaddc4201f984"},{"id":"MATIC-ETH","currency":"MATIC","blockchain":"ETHEREUM","smartContractAddress":"0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0"},{"id":"SHIB-ETH","currency":"SHIB","blockchain":"ETHEREUM","smartContractAddress":"0x95ad61b0a150d79219dcf64e1e6cc01f0b64c4ce"},{"id":"LINK-ETH","currency":"LINK","blockchain":"ETHEREUM","smartContractAddress":"0x514910771af9ca656af840dff83e8264ecf986ca"},{"id":"CHZ-ETH","currency":"CHZ","blockchain":"ETHEREUM","smartContractAddress":"0x3506424f91fd33084466f402d5d97f05f8e3b4af"},{"id":"QNT-ETH","currency":"QNT","blockchain":"ETHEREUM","smartContractAddress":"0x4a220e6096b25eadb88358cb44068a3248254675"},{"id":"UMA-ETH","currency":"UMA","blockchain":"ETHEREUM","smartContractAddress":"0x04Fa0d235C4abf4BcF4787aF4CF447DE572eF828"},{"id":"ZRX-ETH","currency":"ZRX","blockchain":"ETHEREUM","smartContractAddress":"0xe41d2489571d322189246dafa5ebde1f4699f498"},{"id":"AAVE-ETH","currency":"AAVE","blockchain":"ETHEREUM","smartContractAddress":"0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9"},{"id":"1INCH-ETH","currency":"1INCH","blockchain":"ETHEREUM","smartContractAddress":"0x111111111117dc0aa78b770fa6a738034120c302"},{"id":"SNX-ETH","currency":"SNX","blockchain":"ETHEREUM","smartContractAddress":"0xc011a73ee8576fb46f5e1c5751ca3b9fe0af2a6f"},{"id":"CRV-ETH","currency":"CRV","blockchain":"ETHEREUM","smartContractAddress":"0xD533a949740bb3306d119CC777fa900bA034cd52"},{"id":"APE-ETH","currency":"APE","blockchain":"ETHEREUM","smartContractAddress":"0x4d224452801aced8b2f0aebe155379bb5d594381"},{"id":"MKR-ETH","currency":"MKR","blockchain":"ETHEREUM","smartContractAddress":"0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2"},{"id":"PERP-ETH","currency":"PERP","blockchain":"ETHEREUM","smartContractAddress":"0xbc396689893d065f41bc2c6ecbee5e0085233447"},{"id":"BAL-ETH","currency":"BAL","blockchain":"ETHEREUM","smartContractAddress":"0xba100000625a3754423978a60c9317c58a424e3D"},{"id":"GRT-ETH","currency":"GRT","blockchain":"ETHEREUM","smartContractAddress":"0xc944e90c64b2c07662a292be6244bdf05cda44a7"},{"id":"USDT-TRON","currency":"USDT","blockchain":"TRON","smartContractAddress":"TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t"},{"id":"XRP","currency":"XRP","blockchain":"RIPPLE"},{"id":"SOL","currency":"SOL","blockchain":"SOLANA"},{"id":"USDC-SOL","currency":"USDC","blockchain":"SOLANA","smartContractAddress":"EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"},{"id":"USDT-SOL","currency":"USDT","blockchain":"SOLANA","smartContractAddress":"Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB"},{"id":"XLM","currency":"XLM","blockchain":"STELLAR"},{"id":"LTC","currency":"LTC","blockchain":"LITECOIN"},{"id":"DOGE","currency":"DOGE","blockchain":"DOGECOIN"},{"id":"DOT","currency":"DOT","blockchain":"POLKADOT"},{"id":"BCH","currency":"BCH","blockchain":"BITCOINCASH"},{"id":"XTZ","currency":"XTZ","blockchain":"TEZOS"},{"id":"ALGO","currency":"ALGO","blockchain":"ALGORAND"},{"id":"AVAX","currency":"AVAX","blockchain":"AVALANCHE"},{"id":"ADA","currency":"ADA","blockchain":"CARDANO"},{"id":"POL","currency":"POL","blockchain":"POLYGON"},{"id":"USDC-POL","currency":"USDC","blockchain":"POLYGON","smartContractAddress":"0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359"},{"id":"USDT-POL","currency":"USDT","blockchain":"POLYGON","smartContractAddress":"0xc2132D05D31c914a87C6611C10748AEb04B58e8F"}],"payment_methods":["card","revolut","apple-pay","google-pay"]}`
)

const getTokenIdFromContract: FiatProviderGetTokenIdFromContract = params => {
  // only handle ethereum for testing purposes
  if (params.pluginId === 'ethereum') {
    return params.contractAddress.toLowerCase().replace('0x', '')
  }
  return undefined
}
