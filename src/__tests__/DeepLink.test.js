// @flow
/* globals describe it expect */

import { type DeepLink } from '../types/DeepLinkTypes.js'
import { parseDeepLink } from '../util/DeepLinkParser.js'

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
      'wc:00e46b69-d0cc-4b3e-b6a2-cee442f97188@1?bridge=https%3A%2F%2Fbridge.walletconnect.org&key=91303dedf64285cbbaf9120f6e9d160a5c8aa3deb67017a3874cd272323f48ae'
    const shortExample = 'wc:00e46b69-d0cc-4b3e-b6a2-cee442f97188@1'

    makeLinkTests({
      [fullExample]: {
        type: 'walletConnect',
        isSigning: false,
        uri: fullExample
      },
      [shortExample]: {
        type: 'walletConnect',
        isSigning: true,
        uri: shortExample
      },
      'edge://wc?uri=wc:00e46b69-d0cc-4b3e-b6a2-cee442f97188@1?bridge=https%3A%2F%2Fbridge.walletconnect.org&key=91303dedf64285cbbaf9120f6e9d160a5c8aa3deb67017a3874cd272323f48ae':
        {
          type: 'walletConnect',
          isSigning: false,
          uri: fullExample
        },
      'https://deep.edge.app/wc?uri=wc:00e46b69-d0cc-4b3e-b6a2-cee442f97188@1?bridge=https%3A%2F%2Fbridge.walletconnect.org&key=91303dedf64285cbbaf9120f6e9d160a5c8aa3deb67017a3874cd272323f48ae':
        {
          type: 'walletConnect',
          isSigning: false,
          uri: fullExample
        }
    })
  })
})
