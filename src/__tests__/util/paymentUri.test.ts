import { describe, expect, it } from '@jest/globals'

import { parsePaymentUri } from '../../util/paymentUri'

describe('parsePaymentUri', () => {
  it('passes a bare address through as its own candidate', () => {
    const address = '0x1f36BF25aE6c07Ae5B6cB6BF6b0b13B1B4d1B372'
    expect(parsePaymentUri(address)).toEqual({
      addressCandidates: [address]
    })
  })

  it('trims surrounding whitespace', () => {
    expect(
      parsePaymentUri('  bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq \n')
    ).toEqual({
      addressCandidates: ['bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq']
    })
  })

  it('splits a BIP-21 URI with an amount', () => {
    const uri =
      'bitcoin:bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq?amount=0.0123'
    expect(parsePaymentUri(uri)).toEqual({
      addressCandidates: [
        uri,
        'bitcoin:bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq',
        'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq'
      ],
      displayAmount: '0.0123',
      scheme: 'bitcoin'
    })
  })

  it('splits a BIP-21 URI without a query', () => {
    expect(
      parsePaymentUri('bitcoin:bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq')
    ).toEqual({
      addressCandidates: [
        'bitcoin:bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq',
        'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq'
      ],
      displayAmount: undefined,
      scheme: 'bitcoin'
    })
  })

  it('keeps the scheme-prefixed candidate for cashaddr-style addresses', () => {
    const result = parsePaymentUri(
      'bitcoincash:qqkv9wr69ry2p9l53lxp635va4h86wv435995w8p2h?amount=1.5'
    )
    expect(result.addressCandidates).toContain(
      'bitcoincash:qqkv9wr69ry2p9l53lxp635va4h86wv435995w8p2h'
    )
    expect(result.addressCandidates).toContain(
      'qqkv9wr69ry2p9l53lxp635va4h86wv435995w8p2h'
    )
    expect(result.displayAmount).toBe('1.5')
  })

  it('strips EIP-681 chain suffix and pay- prefix', () => {
    const result = parsePaymentUri(
      'ethereum:pay-0x1f36BF25aE6c07Ae5B6cB6BF6b0b13B1B4d1B372@1?amount=0.5'
    )
    expect(result.addressCandidates).toContain(
      '0x1f36BF25aE6c07Ae5B6cB6BF6b0b13B1B4d1B372'
    )
    expect(result.displayAmount).toBe('0.5')
  })

  it('reads a Monero-family tx_amount parameter', () => {
    const result = parsePaymentUri(
      'monero:46byoyaW?tx_amount=2.25&tx_description=x'
    )
    expect(result.addressCandidates).toContain('46byoyaW')
    expect(result.displayAmount).toBe('2.25')
  })

  it('ignores a non-decimal amount', () => {
    const result = parsePaymentUri('bitcoin:bc1qtest?amount=abc')
    expect(result.displayAmount).toBeUndefined()
    expect(result.addressCandidates).toContain('bc1qtest')
  })

  it('ignores an EIP-681 wei value parameter', () => {
    const result = parsePaymentUri(
      'ethereum:0x1f36BF25aE6c07Ae5B6cB6BF6b0b13B1B4d1B372?value=2e18'
    )
    expect(result.displayAmount).toBeUndefined()
    expect(result.addressCandidates).toContain(
      '0x1f36BF25aE6c07Ae5B6cB6BF6b0b13B1B4d1B372'
    )
  })

  it('strips leading slashes from the path', () => {
    const result = parsePaymentUri(
      'ripple://rEb8TK3gBgk5auZkwc6sHnwrGVJH8DuaLh?amount=20'
    )
    expect(result.addressCandidates).toContain(
      'rEb8TK3gBgk5auZkwc6sHnwrGVJH8DuaLh'
    )
    expect(result.displayAmount).toBe('20')
  })

  it('survives malformed percent-encoding in the query', () => {
    const result = parsePaymentUri('bitcoin:bc1qtest?label=%E0%A4%A&amount=0.1')
    expect(result.displayAmount).toBe('0.1')
  })
})

describe('parsePaymentUri EIP-681 chain id and memos', () => {
  it('reports the @chainId suffix without it reaching the address', () => {
    const parsed = parsePaymentUri(
      'ethereum:0xF0825Aec2c79189C6bB1FEe9293F9478103c9B9e@137'
    )
    expect(parsed.evmChainId).toEqual('137')
    expect(parsed.scheme).toEqual('ethereum')
    expect(parsed.addressCandidates).toContain(
      '0xF0825Aec2c79189C6bB1FEe9293F9478103c9B9e'
    )
  })

  it('reads only the leading digits of an EIP-681 function suffix', () => {
    const parsed = parsePaymentUri(
      'ethereum:0xF0825Aec2c79189C6bB1FEe9293F9478103c9B9e@8453/transfer'
    )
    expect(parsed.evmChainId).toEqual('8453')
  })

  it('leaves evmChainId unset when the URI names no chain', () => {
    const parsed = parsePaymentUri(
      'ethereum:0xF0825Aec2c79189C6bB1FEe9293F9478103c9B9e'
    )
    expect(parsed.evmChainId).toBeUndefined()
  })

  it('keeps a destination tag or memo the URI carries', () => {
    // The tag is what credits the recipient at a memo-required exchange, so
    // dropping it pays the deposit address with nothing to attribute it to.
    expect(parsePaymentUri('ripple:rABC123?dt=987654').memo).toEqual('987654')
    expect(parsePaymentUri('stellar:GABC?memo=hello').memo).toEqual('hello')
    expect(parsePaymentUri('cosmos:cosmos1abc?tag=42').memo).toEqual('42')
    expect(parsePaymentUri('bitcoin:bc1qxyz').memo).toBeUndefined()
  })
})

describe('parsePaymentUri EIP-681 function calls', () => {
  it('offers no address for a token-transfer code', () => {
    // The path holds the token CONTRACT and the payee rides in a parameter, so
    // adopting the path address would send native funds to a contract.
    const parsed = parsePaymentUri(
      'ethereum:0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48@1/transfer?address=0xF0825Aec2c79189C6bB1FEe9293F9478103c9B9e&uint256=1e6'
    )
    expect(parsed.addressCandidates).toEqual([])
    expect(parsed.evmChainId).toEqual('1')
  })

  it('still offers the address for a plain chain-id code', () => {
    const parsed = parsePaymentUri(
      'ethereum:0xF0825Aec2c79189C6bB1FEe9293F9478103c9B9e@137'
    )
    expect(parsed.addressCandidates).toContain(
      '0xF0825Aec2c79189C6bB1FEe9293F9478103c9B9e'
    )
  })
})
