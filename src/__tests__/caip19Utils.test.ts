import { describe, expect, test } from '@jest/globals'

import { isCaip19 } from '../util/caip19Utils'

describe('isCaip19', () => {
  test('valid CAIP-19 formats', () => {
    // EVM ERC-20 token
    expect(
      isCaip19('eip155:1/erc20:0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48')
    ).toBe(true)
    // EVM native asset
    expect(isCaip19('eip155:1/slip44:60')).toBe(true)
    // Bitcoin native
    expect(isCaip19('bip122:000000000019d6689c085ae165831e93/slip44:0')).toBe(
      true
    )
    // Solana native
    expect(isCaip19('solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501')).toBe(
      true
    )
    // Tron TRC-20
    expect(
      isCaip19('tron:0x2b6653dc/trc20:TXLAQ63Xg1NAzckPwKHvzw7CSEmLMEqcdj')
    ).toBe(true)
  })

  test('invalid CAIP-19 formats', () => {
    // CAIP-2 (no asset part)
    expect(isCaip19('eip155:1')).toBe(false)
    expect(isCaip19('bip122:000000000019d6689c085ae165831e93')).toBe(false)
    // Legacy currency codes
    expect(isCaip19('BTC')).toBe(false)
    expect(isCaip19('ETH-USDC')).toBe(false)
    // Random strings
    expect(isCaip19('hello')).toBe(false)
    expect(isCaip19('')).toBe(false)
    // Missing colon in asset part
    expect(isCaip19('eip155:1/erc20')).toBe(false)
    // Missing colon in chain part
    expect(isCaip19('eip155/erc20:0x123')).toBe(false)
  })
})
