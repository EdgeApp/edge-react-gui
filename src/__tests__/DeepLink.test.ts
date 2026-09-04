import { describe, expect, it } from '@jest/globals'

import {
  type DeepLinkReadiness,
  getDeepLinkReadiness
} from '../actions/DeepLinkingActions'
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

  describe('walletShare', () => {
    makeLinkTests({
      'https://deep.edge.app/request-wallets/1234567890a': {
        type: 'walletShareRequest',
        lobbyId: '1234567890a'
      },
      'https://deep.edge.app/share-wallets/1234567890a': {
        type: 'walletShareOffer',
        lobbyId: '1234567890a'
      },
      'edge://request-wallets/1234567890a': {
        type: 'walletShareRequest',
        lobbyId: '1234567890a'
      },
      'edge://share-wallets/1234567890a': {
        type: 'walletShareOffer',
        lobbyId: '1234567890a'
      },
      // The sharing nickname rides in the link, never in the lobby:
      'https://deep.edge.app/request-wallets/1234567890a?name=Ada%20Lovelace': {
        type: 'walletShareRequest',
        lobbyId: '1234567890a',
        displayName: 'Ada Lovelace'
      },
      'edge://share-wallets/1234567890a?name=Bob': {
        type: 'walletShareOffer',
        lobbyId: '1234567890a',
        displayName: 'Bob'
      }
    })

    it('Missing lobby id', () => {
      expect(() =>
        parseDeepLink('https://deep.edge.app/request-wallets/')
      ).toThrow(SyntaxError)
      expect(() =>
        parseDeepLink('https://deep.edge.app/share-wallets')
      ).toThrow(SyntaxError)
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

  describe('paymentRedirect', () => {
    makeLinkTests({
      // Real-world MoonPay "Send with Edge" sell link (extra params ignored):
      'https://edge.app/redirect/payment/?transactionId=6ae325aa-d930-47cd-9ef0-d26e03b68f3c&baseCurrencyCode=btc&baseCurrencyAmount=0.00212&depositWalletAddress=bc1qqp44yqt9nzrca7cw4hrl2hu5nmpw5fg0r32z62&paymentMethod=moonpay_balance':
        {
          type: 'paymentRedirect',
          currencyCode: 'btc',
          depositAddress: 'bc1qqp44yqt9nzrca7cw4hrl2hu5nmpw5fg0r32z62',
          amount: '0.00212',
          addressTag: undefined
        },
      // XRP needs a destination tag, carried as depositWalletAddressTag:
      'edge://redirect/payment/?baseCurrencyCode=xrp&baseCurrencyAmount=10&depositWalletAddress=rEXAMPLExrpADDRESS&depositWalletAddressTag=123456':
        {
          type: 'paymentRedirect',
          currencyCode: 'xrp',
          depositAddress: 'rEXAMPLExrpADDRESS',
          amount: '10',
          addressTag: '123456'
        },
      // deep.edge.app is an already-claimed universal-link host:
      'https://deep.edge.app/redirect/payment/?baseCurrencyCode=ltc&baseCurrencyAmount=1.5&depositWalletAddress=ltc1qexample':
        {
          type: 'paymentRedirect',
          currencyCode: 'ltc',
          depositAddress: 'ltc1qexample',
          amount: '1.5',
          addressTag: undefined
        },
      // A non-numeric or empty baseCurrencyAmount is dropped (left undefined) so
      // the Send scene opens without a bogus/zero amount, instead of pre-filling
      // '0' or throwing from biggystring after the wallet picker:
      'edge://redirect/payment/?baseCurrencyCode=btc&depositWalletAddress=bc1qexample&baseCurrencyAmount=':
        {
          type: 'paymentRedirect',
          currencyCode: 'btc',
          depositAddress: 'bc1qexample',
          amount: undefined,
          addressTag: undefined
        },
      'edge://redirect/payment/?baseCurrencyCode=btc&depositWalletAddress=bc1qexample&baseCurrencyAmount=notanumber':
        {
          type: 'paymentRedirect',
          currencyCode: 'btc',
          depositAddress: 'bc1qexample',
          amount: undefined,
          addressTag: undefined
        },
      // A present-but-blank destination tag is treated as absent (no memo
      // forwarded to the Send scene), not an empty-string uniqueIdentifier:
      'edge://redirect/payment/?baseCurrencyCode=xrp&depositWalletAddress=rEXAMPLExrpADDRESS&depositWalletAddressTag=':
        {
          type: 'paymentRedirect',
          currencyCode: 'xrp',
          depositAddress: 'rEXAMPLExrpADDRESS',
          amount: undefined,
          addressTag: undefined
        },
      // A present-but-blank required param degrades to a no-op, same as when it
      // is absent (a blank address/asset must not open the Send flow):
      'edge://redirect/payment/?baseCurrencyCode=btc&depositWalletAddress=': {
        type: 'noop'
      },
      'edge://redirect/payment/?baseCurrencyCode=&depositWalletAddress=bc1qexample':
        { type: 'noop' },
      // Missing params degrade to a no-op instead of an "Unknown deep link
      // format" error (edge://) or a browser-opened dead apex page. Both the
      // claimed and legacy apex hosts behave identically:
      'https://edge.app/redirect/payment/?baseCurrencyCode=btc': {
        type: 'noop'
      },
      'edge://redirect/payment/?baseCurrencyCode=btc': { type: 'noop' },
      'https://deep.edge.app/redirect/payment/': { type: 'noop' }
    })
  })

  describe('redirect terminal states', () => {
    makeLinkTests({
      // The provider terminal redirects (success/fail/cancel) carry no
      // actionable payload, so an externally-tapped link opens the app via a
      // no-op on every host: edge://, the claimed deep.edge.app, and the legacy
      // apex edge.app (old orders may still point there).
      'edge://redirect/success/': { type: 'noop' },
      'edge://redirect/fail/': { type: 'noop' },
      'edge://redirect/cancel/': { type: 'noop' },
      'https://deep.edge.app/redirect/success/': { type: 'noop' },
      'https://deep.edge.app/redirect/fail/': { type: 'noop' },
      'https://deep.edge.app/redirect/cancel/': { type: 'noop' },
      'https://edge.app/redirect/success/': { type: 'noop' },
      'https://edge.app/redirect/fail/': { type: 'noop' },
      'https://edge.app/redirect/cancel/': { type: 'noop' }
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

  describe('rampCreate', function () {
    makeLinkTests({
      'edge://buy': {
        type: 'rampCreate',
        direction: 'buy',
        providerId: undefined,
        paymentType: undefined
      },
      'edge://buy/': {
        type: 'rampCreate',
        direction: 'buy',
        providerId: undefined,
        paymentType: undefined
      },
      'edge://buy/moonpay': {
        type: 'rampCreate',
        direction: 'buy',
        providerId: 'moonpay',
        paymentType: undefined
      },
      'edge://buy/moonpay/venmo': {
        type: 'rampCreate',
        direction: 'buy',
        providerId: 'moonpay',
        paymentType: 'venmo'
      },
      'edge://buy/moonpay/cashapp': {
        type: 'rampCreate',
        direction: 'buy',
        providerId: 'moonpay',
        paymentType: 'cashapp'
      },
      'edge://sell': {
        type: 'rampCreate',
        direction: 'sell',
        providerId: undefined,
        paymentType: undefined
      },
      'edge://sell/banxa/ach': {
        type: 'rampCreate',
        direction: 'sell',
        providerId: 'banxa',
        paymentType: 'ach'
      },
      'https://deep.edge.app/buy/moonpay/venmo': {
        type: 'rampCreate',
        direction: 'buy',
        providerId: 'moonpay',
        paymentType: 'venmo'
      },
      'https://deep.edge.app/sell/moonpay': {
        type: 'rampCreate',
        direction: 'sell',
        providerId: 'moonpay',
        paymentType: undefined
      },
      // An unrecognized payment type must not break the link. The flow still
      // opens with the provider pinned, just without a payment-type pin:
      'edge://buy/moonpay/carrierpigeon': {
        type: 'rampCreate',
        direction: 'buy',
        providerId: 'moonpay',
        paymentType: undefined
      },
      // `af` attribution stays independent of the pinning, wrapping the link:
      'https://deep.edge.app/buy/moonpay/cashapp?af=moonpay': {
        type: 'affiliate',
        installerId: 'moonpay',
        link: {
          type: 'rampCreate',
          direction: 'buy',
          providerId: 'moonpay',
          paymentType: 'cashapp'
        }
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

describe('getDeepLinkReadiness', function () {
  /**
   * Every member of the `DeepLink` union, paired with the app state it must
   * wait for. A new link type will not compile until it appears here.
   */
  const cases: Array<[DeepLink, DeepLinkReadiness]> = [
    [{ type: 'noop' }, 'loggedOut'],
    [{ type: 'passwordRecovery', passwordRecoveryKey: 'key' }, 'loggedOut'],

    [{ type: 'edgeLogin', lobbyId: 'lobby' }, 'account'],
    [
      {
        type: 'fiatProvider',
        direction: 'buy',
        providerId: 'simplex',
        path: '',
        query: {},
        uri: 'edge://fiatprovider/buy/simplex'
      },
      'account'
    ],
    [{ type: 'price-change', pluginId: 'bitcoin', body: 'up' }, 'account'],
    [
      {
        type: 'ramp',
        direction: 'buy',
        providerId: 'simplex',
        path: '',
        query: {},
        uri: 'edge://ramp/buy/simplex'
      },
      'account'
    ],
    [
      { type: 'rampCreate', direction: 'buy', providerId: 'moonpay' },
      'account'
    ],
    [{ type: 'scene', sceneName: 'walletList', query: undefined }, 'account'],
    [{ type: 'swap' }, 'account'],

    [{ type: 'promotion', installerId: 'bob' }, 'referral'],
    [
      { type: 'affiliate', installerId: 'bob', link: { type: 'swap' } },
      'referral'
    ],

    [{ type: 'azteco', uri: 'https://azte.co/partners/key' }, 'wallets'],
    [{ type: 'fiatPlugin', pluginId: 'moonpay', direction: 'buy' }, 'wallets'],
    [{ type: 'modal', modalName: 'fundAccount' }, 'wallets'],
    [{ type: 'other', protocol: 'bitcoin', uri: 'bitcoin:addr' }, 'wallets'],
    [{ type: 'paymentProto', uri: 'https://pay.example/i/abc' }, 'wallets'],
    [
      {
        type: 'paymentRedirect',
        currencyCode: 'btc',
        depositAddress: 'addr'
      },
      'wallets'
    ],
    [{ type: 'plugin', pluginId: 'custom', path: '/', query: {} }, 'wallets'],
    [
      {
        type: 'requestAddress',
        assets: [{ nativeCode: 'BTC', tokenCode: 'BTC' }],
        post: 'https://example.com'
      },
      'wallets'
    ],
    [{ type: 'rewards', pluginId: 'bitcoin', tokenId: null }, 'wallets'],
    [{ type: 'walletConnect', uri: 'wc:topic@2' }, 'wallets'],
    [{ type: 'walletShareOffer', lobbyId: 'lobby' }, 'wallets'],
    [{ type: 'walletShareRequest', lobbyId: 'lobby' }, 'wallets']
  ]

  for (const [link, expected] of cases) {
    it(`${link.type} needs ${expected}`, function () {
      expect(getDeepLinkReadiness(link)).toBe(expected)
    })
  }

  it('an affiliate link inherits its inner link when that is stricter', function () {
    expect(
      getDeepLinkReadiness({
        type: 'affiliate',
        installerId: 'bob',
        link: { type: 'other', protocol: 'bitcoin', uri: 'bitcoin:addr' }
      })
    ).toBe('wallets')
  })
})
