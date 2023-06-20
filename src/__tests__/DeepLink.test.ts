import { describe, expect, it } from '@jest/globals'

import { DeepLink } from '../types/DeepLinkTypes'
import { parseDeepLink } from '../util/DeepLinkParser'

/**
 * Generates deep link unit tests using a simple table format.
 */
function makeLinkTests(tests: { [uri: string]: DeepLink }): void {
  for (const link of Object.keys(tests)) {
    const expected = tests[link]
    it(link, function () {
      expect(parseDeepLink(link)).toEqual(expected)
    })
  }
}

describe('parseDeepLink', function () {
  describe('azteco', () => {
    expect(parseDeepLink('https://azte.co?c1=a&c2=b', { aztecoApiKey: 'someKey' })).toEqual({
      type: 'azteco',
      uri: 'https://azte.co/partners/someKey?CODE_1=a&CODE_2=b&ADDRESS='
    })
  })

  describe('requestAddress', () => {
    makeLinkTests({
      'edge://reqaddr?codes=eth-btc&post=https%3A%2F%2Fbitwage.com&redir=https%3A%2F%2Fbitwage.com%2Fgetaddr&payer=bitwage': {
        type: 'requestAddress',
        assets: [
          { nativeCode: 'ETH', tokenCode: 'ETH' },
          { nativeCode: 'BTC', tokenCode: 'BTC' }
        ],
        post: 'https://bitwage.com',
        redir: 'https://bitwage.com/getaddr',
        payer: 'bitwage'
      },
      'edge://reqaddr?codes=eth-btc&redir=https%3A%2F%2Fbitwage.com%2Fgetaddr': {
        type: 'requestAddress',
        assets: [
          { nativeCode: 'ETH', tokenCode: 'ETH' },
          { nativeCode: 'BTC', tokenCode: 'BTC' }
        ],
        post: undefined,
        redir: 'https://bitwage.com/getaddr',
        payer: undefined
      },
      'edge://reqaddr?codes=eth-btc&redir=https%3A%2F%2Fbitwage.com%2Fgetaddr%2F': {
        type: 'requestAddress',
        assets: [
          { nativeCode: 'ETH', tokenCode: 'ETH' },
          { nativeCode: 'BTC', tokenCode: 'BTC' }
        ],
        post: undefined,
        redir: 'https://bitwage.com/getaddr/',
        payer: undefined
      },
      'edge://reqaddr?codes=eth-btc&redir=https%3A%2F%2Fbitwage.com%2Fgetaddr%3F': {
        type: 'requestAddress',
        assets: [
          { nativeCode: 'ETH', tokenCode: 'ETH' },
          { nativeCode: 'BTC', tokenCode: 'BTC' }
        ],
        post: undefined,
        redir: 'https://bitwage.com/getaddr?',
        payer: undefined
      },
      'edge://reqaddr?codes=eth&post=https%3A%2F%2Fbitwage.com': {
        type: 'requestAddress',
        assets: [{ nativeCode: 'ETH', tokenCode: 'ETH' }],
        post: 'https://bitwage.com',
        redir: undefined,
        payer: undefined
      },
      'edge://reqaddr?codes=ETH&redir=https%3A%2F%2Fbitwage.com%2Fgetaddr': {
        type: 'requestAddress',
        assets: [{ nativeCode: 'ETH', tokenCode: 'ETH' }],
        post: undefined,
        redir: 'https://bitwage.com/getaddr',
        payer: undefined
      },
      'edge://reqaddr?codes=ETH&redir=https%3A%2F%2Fbitwage.com%3FnoValueQuery': {
        type: 'requestAddress',
        assets: [{ nativeCode: 'ETH', tokenCode: 'ETH' }],
        post: undefined,
        redir: 'https://bitwage.com?noValueQuery',
        payer: undefined
      },
      'edge://reqaddr?codes=ETH&redir=https%3A%2F%2Fbitwage.com%2Fgetaddr&post=https%3A%2F%2Fbitwage.com': {
        type: 'requestAddress',
        assets: [{ nativeCode: 'ETH', tokenCode: 'ETH' }],
        post: 'https://bitwage.com',
        redir: 'https://bitwage.com/getaddr',
        payer: undefined
      },
      'edge://reqaddr?codes=ETH_usdc-BTC-DOGE_DOGE&redir=https://bitwage.com/getaddr%3Frequestid%3D123&payer=bitwage&post=https%3A%2F%2Fbitwage.com': {
        type: 'requestAddress',
        assets: [
          { nativeCode: 'ETH', tokenCode: 'USDC' },
          { nativeCode: 'BTC', tokenCode: 'BTC' },
          { nativeCode: 'DOGE', tokenCode: 'DOGE' }
        ],
        post: 'https://bitwage.com',
        redir: 'https://bitwage.com/getaddr?requestid=123',
        payer: 'bitwage'
      },
      'reqaddr://?codes=ETH_usdc-BTC-DOGE_DOGE-LTC-ETH_UNI&post=https%3A%2F%2Fbitwage.com&redir=https%3A%2F%2Fbitwage.com%2Fgetaddr%3Frequestid%3D123%26otherquery':
        {
          type: 'requestAddress',
          assets: [
            { nativeCode: 'ETH', tokenCode: 'USDC' },
            { nativeCode: 'BTC', tokenCode: 'BTC' },
            { nativeCode: 'DOGE', tokenCode: 'DOGE' },
            { nativeCode: 'LTC', tokenCode: 'LTC' },
            { nativeCode: 'ETH', tokenCode: 'UNI' }
          ],
          post: 'https://bitwage.com',
          redir: 'https://bitwage.com/getaddr?requestid=123&otherquery',
          payer: undefined
        }
    })
  })

  describe('edgeLogin', () => {
    makeLinkTests({
      'edge://edge/1234567890a': {
        type: 'edgeLogin',
        lobbyId: '1234567890a'
      },
      'airbitz://edge/1234567890a': {
        type: 'edgeLogin',
        lobbyId: '1234567890a'
      },
      'https://deep.edge.app/edge/1234567890a': {
        type: 'edgeLogin',
        lobbyId: '1234567890a'
      },
      'https://www.edge.app/edgelogin?address=1234567890a': {
        type: 'edgeLogin',
        lobbyId: '1234567890a'
      }
    })

    it('Wrong host', () => {
      const result = parseDeepLink('reqaddr://?codes=eth&post=https%3A%2F%2Fjgiugdfigfdiudhfd.com')
      expect(result.type).toBe('requestAddress')
    })
  })

  describe('passwordRecovery', function () {
    makeLinkTests({
      'edge://recovery?token=1234567890a': {
        type: 'passwordRecovery',
        passwordRecoveryKey: '1234567890a'
      },
      'airbitz://recovery?token=1234567890a': {
        type: 'passwordRecovery',
        passwordRecoveryKey: '1234567890a'
      },
      'https://recovery.edgesecure.co?token=1234567890a': {
        type: 'passwordRecovery',
        passwordRecoveryKey: '1234567890a'
      },
      'https://deep.edge.app/recovery#1234567890a': {
        type: 'passwordRecovery',
        passwordRecoveryKey: '1234567890a'
      },
      'edge://recovery#1234567890a': {
        type: 'passwordRecovery',
        passwordRecoveryKey: '1234567890a'
      }
    })
  })

  describe('pay', () => {
    makeLinkTests({
      'edge://pay/bitcoin/1FeexV6bAHb8ybZjqQMjJrcCrHGW9sb6uF?amount=0.001': {
        type: 'other',
        protocol: 'bitcoin',
        uri: 'bitcoin:1FeexV6bAHb8ybZjqQMjJrcCrHGW9sb6uF?amount=0.001'
      }
    })
  })

  describe('plugin', function () {
    makeLinkTests({
      'edge://plugin/simplex/rabbit/hole?param=alice': {
        type: 'plugin',
        pluginId: 'simplex',
        path: '/rabbit/hole',
        query: { param: 'alice' }
      },
      'edge://plugin/simplex/?param=alice': {
        type: 'plugin',
        pluginId: 'simplex',
        path: '/',
        query: { param: 'alice' }
      },
      'edge://plugin/simplex?param=alice': {
        type: 'plugin',
        pluginId: 'simplex',
        path: '',
        query: { param: 'alice' }
      },
      'edge://plugin/simplex': {
        type: 'plugin',
        pluginId: 'simplex',
        path: '',
        query: {}
      },
      'https://deep.edge.app/plugin/simplex/rabbit/hole?param=alice': {
        type: 'plugin',
        pluginId: 'simplex',
        path: '/rabbit/hole',
        query: { param: 'alice' }
      },
      'edge-ret://plugins/simplex/rabbit/hole?param=alice': {
        type: 'plugin',
        pluginId: 'simplex',
        path: '/rabbit/hole',
        query: { param: 'alice' }
      }
    })
  })

  describe('fiatPlugin', function () {
    makeLinkTests({
      'https://deep.edge.app/plugin/creditcard/buy/moonpay/applepay/rabbit/hole?param=alice': {
        type: 'fiatPlugin',
        pluginId: 'creditcard',
        providerId: 'moonpay',
        direction: 'buy',
        paymentType: 'applepay'
      }
    })
  })

  describe('promotion', function () {
    makeLinkTests({
      'edge://promotion/bob': {
        type: 'promotion',
        installerId: 'bob'
      },
      'https://deep.edge.app/promotion/bob': {
        type: 'promotion',
        installerId: 'bob'
      },
      'https://dl.edge.app/bob': {
        type: 'promotion',
        installerId: 'bob'
      },
      'https://dl.edge.app/?af=bob': {
        type: 'promotion',
        installerId: 'bob'
      },
      'https://dl.edge.app': {
        type: 'promotion',
        installerId: ''
      }
    })
  })

  describe('swap', () => {
    makeLinkTests({
      'edge://swap': {
        type: 'swap'
      }
    })
  })

  describe('walletConnect', () => {
    const fullExample =
      'wc:57827c96-ba26-437a-8e7e-2c11112c9663@1?bridge=https%3A%2F%2Fx.bridge.walletconnect.org&key=252a4350e8381e6a935df363bc4132454f573528aed9b0270659752e0f977f2c'
    const shortExample = 'wc:57827c96-ba26-437a-8e7e-2c11112c9663@1'

    makeLinkTests({
      [fullExample]: {
        type: 'walletConnect',
        uri: fullExample
      },
      [shortExample]: {
        type: 'walletConnect',
        uri: shortExample
      },
      'edge://wc/wc?uri=wc%3A57827c96-ba26-437a-8e7e-2c11112c9663%401%3Fbridge%3Dhttps%253A%252F%252Fx.bridge.walletconnect.org%26key%3D252a4350e8381e6a935df363bc4132454f573528aed9b0270659752e0f977f2c':
        {
          type: 'walletConnect',
          uri: fullExample
        },
      'https://deep.edge.app/wc/wc?uri=wc%3A57827c96-ba26-437a-8e7e-2c11112c9663%401%3Fbridge%3Dhttps%253A%252F%252Fx.bridge.walletconnect.org%26key%3D252a4350e8381e6a935df363bc4132454f573528aed9b0270659752e0f977f2c':
        {
          type: 'walletConnect',
          uri: fullExample
        }
    })
  })
})
