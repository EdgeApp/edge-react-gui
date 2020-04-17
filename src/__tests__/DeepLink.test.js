// @flow
/* globals describe it expect */

import { parseDeepLink } from '../types/DeepLink.js'

describe('parseDeepLink', function () {
  describe('edgeLogin', () => {
    it('airbitz:', () => {
      const result = parseDeepLink('airbitz://edge/1234567890a')
      expect(result.type).toBe('edgeLogin')

      if (result.type !== 'edgeLogin') return
      expect(result.lobbyId).toBe('1234567890a')
    })

    it('edge:', () => {
      const result = parseDeepLink('edge://edge/1234567890a')
      expect(result.type).toBe('edgeLogin')

      if (result.type !== 'edgeLogin') return
      expect(result.lobbyId).toBe('1234567890a')
    })

    it('https://www.edge.app/edgelogin', () => {
      const result = parseDeepLink('https://www.edge.app/edgelogin?address=1234567890a')
      expect(result.type).toBe('edgeLogin')

      if (result.type !== 'edgeLogin') return
      expect(result.lobbyId).toBe('1234567890a')
    })

    it('Wrong host', () => {
      const result = parseDeepLink('edge-ret://edgey/1234567890a')
      expect(result.type).toBe('returnAddress')
    })
  })

  describe('pay', () => {
    it('edge://pay/bitcoin/1FeexV6bAHb8ybZjqQMjJrcCrHGW9sb6uF?amount=0.001', () => {
      const result = parseDeepLink('edge://pay/bitcoin/1FeexV6bAHb8ybZjqQMjJrcCrHGW9sb6uF?amount=0.001')
      expect(result.type).toBe('other')

      if (result.type !== 'other') return
      expect(result.protocol).toBe('bitcoin')
      expect(result.uri).toBe('bitcoin:1FeexV6bAHb8ybZjqQMjJrcCrHGW9sb6uF?amount=0.001')
    })
  })

  describe('passwordRecovery', function () {
    it('airbitz:', function () {
      const result = parseDeepLink('airbitz://recovery?token=1234567890a')
      expect(result.type).toBe('passwordRecovery')

      if (result.type !== 'passwordRecovery') return
      expect(result.passwordRecoveryKey).toBe('1234567890a')
    })

    it('edge:', function () {
      const result = parseDeepLink('airbitz://recovery?token=1234567890a')
      expect(result.type).toBe('passwordRecovery')

      if (result.type !== 'passwordRecovery') return
      expect(result.passwordRecoveryKey).toBe('1234567890a')
    })

    it('https://recovery.edgesecure.co', function () {
      const result = parseDeepLink('https://recovery.edgesecure.co?token=1234567890a')
      expect(result.type).toBe('passwordRecovery')

      if (result.type !== 'passwordRecovery') return
      expect(result.passwordRecoveryKey).toBe('1234567890a')
    })
  })

  describe('plugin', function () {
    it('edge-ret:', function () {
      const result = parseDeepLink('edge-ret://plugins/simplex/rabbit/hole?param=alice')
      expect(result.type).toBe('plugin')

      if (result.type !== 'plugin') return
      expect(result.pluginId).toBe('simplex')
      expect(result.path).toBe('/rabbit/hole')
      expect(result.query).toEqual({ param: 'alice' })
    })

    it('edge: with path', function () {
      const result = parseDeepLink('edge://plugin/simplex/rabbit/hole?param=alice')
      expect(result.type).toBe('plugin')

      if (result.type !== 'plugin') return
      expect(result.pluginId).toBe('simplex')
      expect(result.path).toBe('/rabbit/hole')
      expect(result.query).toEqual({ param: 'alice' })
    })

    it('edge: with no path', function () {
      const result = parseDeepLink('edge://plugin/simplex?param=alice')
      expect(result.type).toBe('plugin')

      if (result.type !== 'plugin') return
      expect(result.pluginId).toBe('simplex')
      expect(result.path).toBe('')
      expect(result.query).toEqual({ param: 'alice' })
    })

    it('https:', function () {
      const result = parseDeepLink('https://deep.edge.app/plugin/simplex/rabbit/hole?param=alice')
      expect(result.type).toBe('plugin')

      if (result.type !== 'plugin') return
      expect(result.pluginId).toBe('simplex')
      expect(result.path).toBe('/rabbit/hole')
      expect(result.query).toEqual({ param: 'alice' })
    })
  })

  describe('promotion', function () {
    it('https://dl.edge.app', function () {
      const result = parseDeepLink('https://dl.edge.app/bob')
      expect(result.type).toBe('promotion')

      if (result.type !== 'promotion') return
      expect(result.installerId).toBe('bob')
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
})
