import { describe, expect, it } from '@jest/globals'
import type { EdgeCurrencyConfig, EdgeParsedUri } from 'edge-core-js'

import { makeFakeCurrencyConfig } from '../../util/fake/fakeCurrencyConfig'
import { parseCrossChainPayment, peekPaymentUri } from '../../util/paymentUri'

describe('peekPaymentUri', () => {
  it('passes a bare address through as its own candidate', () => {
    const address = '0x1f36BF25aE6c07Ae5B6cB6BF6b0b13B1B4d1B372'
    expect(peekPaymentUri(address)).toEqual({
      addressCandidates: [address]
    })
  })

  it('trims surrounding whitespace', () => {
    expect(
      peekPaymentUri('  bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq \n')
    ).toEqual({
      addressCandidates: ['bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq']
    })
  })

  it('reads the scheme of a BIP-21 URI', () => {
    const uri =
      'bitcoin:bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq?amount=0.0123'
    expect(peekPaymentUri(uri)).toEqual({
      addressCandidates: [
        uri,
        'bitcoin:bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq',
        'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq'
      ],
      scheme: 'bitcoin',
      evmChainId: undefined
    })
  })

  it('keeps the scheme-prefixed candidate for cashaddr-style addresses', () => {
    const result = peekPaymentUri(
      'bitcoincash:qqkv9wr69ry2p9l53lxp635va4h86wv435995w8p2h?amount=1.5'
    )
    expect(result.addressCandidates).toContain(
      'bitcoincash:qqkv9wr69ry2p9l53lxp635va4h86wv435995w8p2h'
    )
    expect(result.addressCandidates).toContain(
      'qqkv9wr69ry2p9l53lxp635va4h86wv435995w8p2h'
    )
  })

  it('strips the EIP-681 pay- prefix', () => {
    const result = peekPaymentUri(
      'ethereum:pay-0x1f36BF25aE6c07Ae5B6cB6BF6b0b13B1B4d1B372@1?value=5e17'
    )
    expect(result.addressCandidates).toContain(
      '0x1f36BF25aE6c07Ae5B6cB6BF6b0b13B1B4d1B372'
    )
    expect(result.evmChainId).toEqual(1)
  })

  it('keeps the case of a slashed form address', () => {
    // url-parse lowercases a `scheme://` host, which would corrupt base58.
    const result = peekPaymentUri(
      'ripple://rEb8TK3gBgk5auZkwc6sHnwrGVJH8DuaLh?amount=20'
    )
    expect(result.scheme).toEqual('ripple')
    expect(result.addressCandidates).toContain(
      'rEb8TK3gBgk5auZkwc6sHnwrGVJH8DuaLh'
    )
  })
})

describe('peekPaymentUri EIP-681 chain id', () => {
  it('reports the @chainId suffix without it reaching the address', () => {
    const peek = peekPaymentUri(
      'ethereum:0xF0825Aec2c79189C6bB1FEe9293F9478103c9B9e@137'
    )
    expect(peek.evmChainId).toEqual(137)
    expect(peek.scheme).toEqual('ethereum')
    expect(peek.addressCandidates).toContain(
      '0xF0825Aec2c79189C6bB1FEe9293F9478103c9B9e'
    )
  })

  it('reads a hex chain id', () => {
    const peek = peekPaymentUri(
      'ethereum:0xF0825Aec2c79189C6bB1FEe9293F9478103c9B9e@0x89'
    )
    expect(peek.evmChainId).toEqual(137)
  })

  it('leaves evmChainId unset when the URI names no chain', () => {
    const peek = peekPaymentUri(
      'ethereum:0xF0825Aec2c79189C6bB1FEe9293F9478103c9B9e'
    )
    expect(peek.evmChainId).toBeUndefined()
  })

  it('offers no address for a token-transfer code', () => {
    // The path holds the token CONTRACT and the payee rides in a parameter, so
    // matching a chain on the path would offer to pay a contract.
    const peek = peekPaymentUri(
      'ethereum:0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48@8453/transfer?address=0xF0825Aec2c79189C6bB1FEe9293F9478103c9B9e&uint256=1e6'
    )
    expect(peek.addressCandidates).toEqual([])
    expect(peek.evmChainId).toEqual(8453)
  })
})

describe('parseCrossChainPayment', () => {
  const makeConfig = (
    parseUri: (uri: string, currencyCode?: string) => Promise<EdgeParsedUri>
  ): EdgeCurrencyConfig => ({
    ...makeFakeCurrencyConfig({ pluginId: 'ripple', currencyCode: 'XRP' }),
    parseUri
  })

  it("returns the chain parser's address, native amount and memo", async () => {
    const config = makeConfig(async () => ({
      publicAddress: 'rEb8TK3gBgk5auZkwc6sHnwrGVJH8DuaLh',
      nativeAmount: '20000000',
      uniqueIdentifier: '987654'
    }))
    expect(
      await parseCrossChainPayment(
        config,
        'ripple:rEb8TK3g?amount=20&dt=987654'
      )
    ).toEqual({
      publicAddress: 'rEb8TK3gBgk5auZkwc6sHnwrGVJH8DuaLh',
      nativeAmount: '20000000',
      memo: '987654'
    })
  })

  it("asks for the chain's own coin", async () => {
    let asked: string | undefined
    const config = makeConfig(async (uri, currencyCode) => {
      asked = currencyCode
      return { publicAddress: uri }
    })
    await parseCrossChainPayment(config, '  rEb8TK3g  ')
    expect(asked).toEqual('XRP')
  })

  it('rejects what the chain parser rejects', async () => {
    const config = makeConfig(async () => {
      throw new Error('InvalidPublicAddressError')
    })
    expect(await parseCrossChainPayment(config, 'nope')).toBeUndefined()
  })

  it('rejects a code for one of the chain tokens', async () => {
    // This flow pays out the chain's own coin, so a token code is refused
    // rather than paid in the wrong asset.
    const config = makeConfig(async () => ({
      publicAddress: '0xF0825Aec2c79189C6bB1FEe9293F9478103c9B9e',
      tokenId: 'a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'
    }))
    expect(await parseCrossChainPayment(config, 'ethereum:0x')).toBeUndefined()
  })

  it('rejects a result with no address', async () => {
    const config = makeConfig(async () => ({}))
    expect(await parseCrossChainPayment(config, 'ripple:')).toBeUndefined()
  })
})
