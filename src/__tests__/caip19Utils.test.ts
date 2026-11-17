import { describe, expect, test } from '@jest/globals'
import type { EdgeAccount } from 'edge-core-js'

import { caip19ToEdgeAsset, isCaip19 } from '../util/caip19Utils'

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

describe('caip19ToEdgeAsset', () => {
  const account = { currencyConfig: {} } as unknown as EdgeAccount

  test.each([
    ['bip122:000000000019d6689c085ae165831e93/slip44:0', 'bitcoin'],
    ['bip122:000000000000000000651ef99cb9fcbe/slip44:145', 'bitcoincash'],
    ['bip122:0000000000000000011865af4122fe3b/slip44:145', 'bitcoincash'],
    ['bip122:1a91e3dace36e2be3bf030a65679fe82/slip44:3', 'dogecoin'],
    ['algorand:wGHE2Pwdvd7S12BL5FaOP20EGYesN73k/slip44:283', 'algorand'],
    ['cardano:mainnet/slip44:1815', 'cardano'],
    ['cip34:1-764824073/slip44:1815', 'cardano'],
    ['hedera:mainnet/slip44:3030', 'hedera'],
    ['monero:mainnet/slip44:128', 'monero'],
    ['stellar:pubnet/slip44:148', 'stellar'],
    ['xrpl:0/slip44:144', 'ripple'],
    ['zcash:mainnet/slip44:133', 'zcash']
  ])('resolves the native asset %s', (caip19, pluginId) => {
    expect(caip19ToEdgeAsset(account, caip19)).toEqual({
      pluginId,
      tokenId: null
    })
  })

  test.each([
    'stellar:testnet/slip44:148',
    'xrpl:1/slip44:144',
    'cardano:mainnet/token:abc',
    'bip122:00000000000000000000000000000000/slip44:0'
  ])('rejects %s', caip19 => {
    expect(caip19ToEdgeAsset(account, caip19)).toBeUndefined()
  })
})
