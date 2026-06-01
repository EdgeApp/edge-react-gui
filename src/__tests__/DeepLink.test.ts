import { describe, expect, it } from '@jest/globals'

import type { DeepLink } from '../types/DeepLinkTypes'
import { parseDeepLink } from '../util/DeepLinkParser'

/**
 * Generates deep link unit tests using a simple table format.
 */
function makeLinkTests(tests: Record<string, DeepLink>): void {
  for (const link of Object.keys(tests)) {
    const expected = tests[link]
    it(link, function () {
      expect(parseDeepLink(link)).toEqual(expected)
    })
  }
}

describe('parseDeepLink', function () {
  describe('azteco', () => {
    expect(
      parseDeepLink('https://azte.co?c1=a&c2=b', { aztecoApiKey: 'someKey' })
    ).toEqual({
      type: 'azteco',
      uri: 'https://azte.co/partners/someKey?CODE_1=a&CODE_2=b&ADDRESS='
    })
  })

  describe('requestAddress', () => {
    makeLinkTests({
      'edge://reqaddr?codes=eth-btc&post=https%3A%2F%2Fbitwage.com&redir=https%3A%2F%2Fbitwage.com%2Fgetaddr&payer=bitwage':
        {
          type: 'requestAddress',
          assets: [
            { nativeCode: 'ETH', tokenCode: 'ETH' },
            { nativeCode: 'BTC', tokenCode: 'BTC' }
          ],
          post: 'https://bitwage.com',
          redir: 'https://bitwage.com/getaddr',
          payer: 'bitwage'
        },
      'edge://reqaddr?codes=eth-btc&redir=https%3A%2F%2Fbitwage.com%2Fgetaddr':
        {
          type: 'requestAddress',
          assets: [
            { nativeCode: 'ETH', tokenCode: 'ETH' },
            { nativeCode: 'BTC', tokenCode: 'BTC' }
          ],
          post: undefined,
          redir: 'https://bitwage.com/getaddr',
          payer: undefined
        },
      'edge://reqaddr?codes=eth-btc&redir=https%3A%2F%2Fbitwage.com%2Fgetaddr%2F':
        {
          type: 'requestAddress',
          assets: [
            { nativeCode: 'ETH', tokenCode: 'ETH' },
            { nativeCode: 'BTC', tokenCode: 'BTC' }
          ],
          post: undefined,
          redir: 'https://bitwage.com/getaddr/',
          payer: undefined
        },
      'edge://reqaddr?codes=eth-btc&redir=https%3A%2F%2Fbitwage.com%2Fgetaddr%3F':
        {
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
      'edge://reqaddr?codes=ETH&redir=https%3A%2F%2Fbitwage.com%3FnoValueQuery':
        {
          type: 'requestAddress',
          assets: [{ nativeCode: 'ETH', tokenCode: 'ETH' }],
          post: undefined,
          redir: 'https://bitwage.com?noValueQuery',
          payer: undefined
        },
      'edge://reqaddr?codes=ETH&redir=https%3A%2F%2Fbitwage.com%2Fgetaddr&post=https%3A%2F%2Fbitwage.com':
        {
          type: 'requestAddress',
          assets: [{ nativeCode: 'ETH', tokenCode: 'ETH' }],
          post: 'https://bitwage.com',
          redir: 'https://bitwage.com/getaddr',
          payer: undefined
        },
      'edge://reqaddr?codes=ETH_usdc-BTC-DOGE_DOGE&redir=https://bitwage.com/getaddr%3Frequestid%3D123&payer=bitwage&post=https%3A%2F%2Fbitwage.com':
        {
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
      'https://return.edge.app/edge/1234567890a': {
        type: 'edgeLogin',
        lobbyId: '1234567890a'
      }
    })

    it('Wrong host', () => {
      const result = parseDeepLink(
        'reqaddr://?codes=eth&post=https%3A%2F%2Fjgiugdfigfdiudhfd.com'
      )
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
      'https://deep.edge.app/plugin/creditcard/buy/moonpay/applepay/rabbit/hole?param=alice':
        {
          type: 'fiatPlugin',
          pluginId: 'creditcard',
          providerId: 'moonpay',
          direction: 'buy',
          paymentType: 'applepay'
        }
    })
  })
  describe('fiatProvider', function () {
    makeLinkTests({
      'https://deep.edge.app/fiatprovider/buy/moonpay?param=alice': {
        type: 'fiatProvider',
        providerId: 'moonpay',
        direction: 'buy',
        path: '',
        query: { param: 'alice' },
        uri: 'edge://fiatprovider/buy/moonpay?param=alice'
      },
      'https://return.edge.app/fiatprovider/buy/moonpay?param=alice': {
        type: 'fiatProvider',
        providerId: 'moonpay',
        direction: 'buy',
        path: '',
        query: { param: 'alice' },
        uri: 'edge://fiatprovider/buy/moonpay?param=alice'
      }
    })
  })

  describe('ramp', function () {
    makeLinkTests({
      'edge://ramp/buy/paybis?transactionStatus=success': {
        type: 'ramp',
        providerId: 'paybis',
        direction: 'buy',
        path: '',
        query: { transactionStatus: 'success' },
        uri: 'edge://ramp/buy/paybis?transactionStatus=success'
      },
      'https://deep.edge.app/ramp/buy/paybis?transactionStatus=success': {
        type: 'ramp',
        providerId: 'paybis',
        direction: 'buy',
        path: '',
        query: { transactionStatus: 'success' },
        uri: 'edge://ramp/buy/paybis?transactionStatus=success'
      },
      'https://return.edge.app/ramp/buy/paybis?transactionStatus=success': {
        type: 'ramp',
        providerId: 'paybis',
        direction: 'buy',
        path: '',
        query: { transactionStatus: 'success' },
        uri: 'edge://ramp/buy/paybis?transactionStatus=success'
      },
      'edge://ramp/sell/paybis?transactionStatus=fail': {
        type: 'ramp',
        providerId: 'paybis',
        direction: 'sell',
        path: '',
        query: { transactionStatus: 'fail' },
        uri: 'edge://ramp/sell/paybis?transactionStatus=fail'
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
      },
      'https://deep.edge.app/?af=bob': {
        type: 'promotion',
        installerId: 'bob'
      },
      'https://deep.edge.app/promotion/bob?af=bob': {
        type: 'promotion',
        installerId: 'bob'
      }
    })
  })

  describe('affiliate', function () {
    makeLinkTests({
      'https://deep.edge.app/pay/bitcoincash/abc123?af=zano-telegram': {
        type: 'affiliate',
        installerId: 'zano-telegram',
        link: {
          type: 'other',
          protocol: 'bitcoincash',
          uri: 'bitcoincash:abc123'
        }
      },
      'https://deep.edge.app/plugin/simplex/rabbit/hole?af=bob&param=alice': {
        type: 'affiliate',
        installerId: 'bob',
        link: {
          type: 'plugin',
          pluginId: 'simplex',
          path: '/rabbit/hole',
          query: { param: 'alice' }
        }
      }
    })

    // Lookalike hosts must NOT be treated as deep.edge.app:
    it('https://deep.edge.appsomething.com/?af=evil', () => {
      expect(
        parseDeepLink('https://deep.edge.appsomething.com/?af=evil')
      ).toEqual({
        type: 'other',
        protocol: 'https',
        uri: 'https://deep.edge.appsomething.com/?af=evil'
      })
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

  describe('zcash ZIP-321', () => {
    // Transparent-only address: the GUI routes this to the zcash wallet's
    // parseUri, which extracts the address and amount.
    const tAddress = 'tmKZ8RrXqfPwhDxN7d8r4wQ3iyc3LwhTSpf'
    const sAddress =
      'zs1z7rejlpsa98s2rrrfkwmaxu53e4ue0ulcrw0h4x5g8jl04tak0d3mm47vdtahatqrlkngh9sly'
    const uAddress =
      'u1l8xunezsvhq8fgzfl7404m450nwnd76zshscn6nfys7vyz2ywyh4cc5daaq0c7q2su5lqfh23sp7jpe57qa6jukhvz5skp7y34zwlexc'

    makeLinkTests({
      [`zcash:${tAddress}?amount=0.001`]: {
        type: 'other',
        protocol: 'zcash',
        uri: `zcash:${tAddress}?amount=0.001`
      },
      [`zcash:${sAddress}?amount=0.05&memo=dGVzdA&label=lunch&message=hello`]: {
        type: 'other',
        protocol: 'zcash',
        uri: `zcash:${sAddress}?amount=0.05&memo=dGVzdA&label=lunch&message=hello`
      },
      [`zcash:${uAddress}?amount=0.001&memo=dGVzdA`]: {
        type: 'other',
        protocol: 'zcash',
        uri: `zcash:${uAddress}?amount=0.001&memo=dGVzdA`
      },
      // Unknown query params without the `req-` prefix are ignored per spec.
      [`zcash:${tAddress}?amount=0.001&future=anything`]: {
        type: 'other',
        protocol: 'zcash',
        uri: `zcash:${tAddress}?amount=0.001&future=anything`
      }
    })

    it('rejects unknown req- params', () => {
      expect(() =>
        parseDeepLink(`zcash:${tAddress}?amount=0.001&req-future=1`)
      ).toThrow(/Unrecognized required ZIP-321 parameter/)
    })

    it('rejects indexed req- params', () => {
      expect(() =>
        parseDeepLink(`zcash:${tAddress}?amount=0.001&req-future.1=1`)
      ).toThrow(/Unrecognized required ZIP-321 parameter: req-future/)
    })

    it('rejects multi-recipient indexed form', () => {
      expect(() =>
        parseDeepLink(
          `zcash:?address=${tAddress}&amount=0.1&address.1=${sAddress}&amount.1=0.2`
        )
      ).toThrow(/Multi-recipient ZIP-321/)
    })

    it('rejects a single recipient encoded as top-level address param', () => {
      expect(() =>
        parseDeepLink(`zcash:?address=${tAddress}&amount=0.001`)
      ).toThrow(/Multi-recipient ZIP-321/)
    })
  })
})
