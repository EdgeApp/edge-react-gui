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
      const result = parseDeepLink('edge-ret://edgey/1234567890a')
      expect(result.type).toBe('returnAddress')
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

  describe('returnAddress', function () {
    it('bitwage', function () {
      const uri =
        'bitcoin-ret://x-callback-url/request-address?category=Income%3ASalary&max-number=100&x-error=https://www.bitwage.com/bitcoinret%2Ferror&x-source=Bitwage&x-success=https://www.bitwage.com/bitcoinret%2F5321947550318592%2F2%2Fadd%3Fcsrf%3D8040b2ac-61db-4d64-8705-9df856c3998a'
      const result = parseDeepLink(uri)
      expect(result.type).toBe('returnAddress')

      if (result.type !== 'returnAddress') return
      expect(result.currencyName).toBe('bitcoin')
      expect(result.sourceName).toBe('Bitwage')
      expect(result.successUri).toBe('https://www.bitwage.com/bitcoinret/5321947550318592/2/add?csrf=8040b2ac-61db-4d64-8705-9df856c3998a')
    })

    it('cryptotip', function () {
      const uri = 'bitcoin-ret://x-callback-url/request-address?x-source=Crypto%20Tip&x-success=https%3A%2F%2Fcryptotip.org%2Fedge%2F1234-1234-4321'
      const result = parseDeepLink(uri)
      expect(result.type).toBe('returnAddress')

      if (result.type !== 'returnAddress') return
      expect(result.currencyName).toBe('bitcoin')
      expect(result.sourceName).toBe('Crypto Tip')
      expect(result.successUri).toBe('https://cryptotip.org/edge/1234-1234-4321')
    })

    it('cryptotip invalid currency', function () {
      const uri = 'bitcoinz-ret://x-callback-url/request-address?x-source=Crypto%20Tip&x-success=https%3A%2F%2Fcryptotip.org%2Fedge%2F1234-1234-4321'
      const result = parseDeepLink(uri)
      expect(result.type).toBe('returnAddress')

      if (result.type !== 'returnAddress') return
      expect(result.currencyName).toBe('bitcoinz')
      expect(result.sourceName).toBe('Crypto Tip')
      expect(result.successUri).toBe('https://cryptotip.org/edge/1234-1234-4321')
    })

    it('bitwage bitcoin', function () {
      const uri =
        'edge://x-callback-url/request-bitcoin-address?category=Income%3ASalary&max-number=100&x-error=https://www.bitwage.com/bitcoinret%2Ferror&x-source=Bitwage&x-success=https://www.bitwage.com/bitcoinret%2F5321947550318592%2F2%2Fadd%3Fcsrf%3D8040b2ac-61db-4d64-8705-9df856c3998a'
      const result = parseDeepLink(uri)
      expect(result.type).toBe('returnAddress')

      if (result.type !== 'returnAddress') return
      expect(result.currencyName).toBe('bitcoin')
      expect(result.sourceName).toBe('Bitwage')
      expect(result.successUri).toBe('https://www.bitwage.com/bitcoinret/5321947550318592/2/add?csrf=8040b2ac-61db-4d64-8705-9df856c3998a')
    })

    it('cryptotip dash', function () {
      const uri = 'edge://x-callback-url/request-dash-address?x-source=Crypto%20Tip&x-success=https%3A%2F%2Fcryptotip.org%2Fedge%2F1234-1234-4321'
      const result = parseDeepLink(uri)
      expect(result.type).toBe('returnAddress')

      if (result.type !== 'returnAddress') return
      expect(result.currencyName).toBe('dash')
      expect(result.sourceName).toBe('Crypto Tip')
      expect(result.successUri).toBe('https://cryptotip.org/edge/1234-1234-4321')
    })

    it('cryptotip invalid currency', function () {
      const uri = 'edge-ret://x-callback-url/request-dashy-address?x-source=Crypto%20Tip&x-success=https%3A%2F%2Fcryptotip.org%2Fedge%2F1234-1234-4321'
      const result = parseDeepLink(uri)
      expect(result.type).toBe('returnAddress')

      if (result.type !== 'returnAddress') return
      expect(result.currencyName).toBe('dashy')
      expect(result.sourceName).toBe('Crypto Tip')
      expect(result.successUri).toBe('https://cryptotip.org/edge/1234-1234-4321')
    })

    it('cryptotip missing source', function () {
      const uri = 'edge-ret://x-callback-url/request-dashy-address?x-sourcey=Crypto%20Tip&x-success=https%3A%2F%2Fcryptotip.org%2Fedge%2F1234-1234-4321'
      const result = parseDeepLink(uri)
      expect(result.type).toBe('returnAddress')

      if (result.type !== 'returnAddress') return
      expect(result.currencyName).toBe('dashy')
      expect(result.sourceName).toBe(undefined)
      expect(result.successUri).toBe('https://cryptotip.org/edge/1234-1234-4321')
    })

    it('cryptotip missing callback-url', function () {
      const uri = 'edge-ret://x-callback-url/request-dashy-address?x-source=Crypto%20Tip'
      const result = parseDeepLink(uri)
      expect(result.type).toBe('returnAddress')

      if (result.type !== 'returnAddress') return
      expect(result.currencyName).toBe('dashy')
      expect(result.sourceName).toBe('Crypto Tip')
      expect(result.successUri).toBe(undefined)
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
