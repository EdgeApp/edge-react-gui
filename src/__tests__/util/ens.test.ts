import { describe, expect, it } from '@jest/globals'

import { getEvmChainId } from '../../util/CurrencyInfoHelpers'
import { isEnsName } from '../../util/ens'

describe('isEnsName', () => {
  it('accepts .eth and DNS names', () => {
    expect(isEnsName('nick.eth')).toBe(true)
    expect(isEnsName('ur.integration-tests.eth')).toBe(true)
    expect(isEnsName('nick.box')).toBe(true)
    expect(isEnsName('brantly.cash')).toBe(true)
    expect(isEnsName(' Nick.ETH ')).toBe(true)
    expect(isEnsName('name.xn--fiqs8s')).toBe(true)
  })

  it('rejects addresses, URIs, and other name services', () => {
    expect(isEnsName('0xb8c2C29ee19D8307cb7255e1Cd9CbDE883A267d5')).toBe(false)
    expect(
      isEnsName('ethereum:0xb8c2C29ee19D8307cb7255e1Cd9CbDE883A267d5')
    ).toBe(false)
    expect(isEnsName('https://nick.eth')).toBe(false)
    expect(isEnsName('alice@edge')).toBe(false)
    expect(isEnsName('brad.crypto')).toBe(false)
    expect(isEnsName('nick')).toBe(false)
    expect(isEnsName('nick.')).toBe(false)
    expect(isEnsName('.eth')).toBe(false)
    expect(isEnsName('1.5')).toBe(false)
    expect(isEnsName('nick eth.eth')).toBe(false)
  })
})

describe('getEvmChainId', () => {
  it('returns the chain ID of EVM plugins', () => {
    expect(getEvmChainId('ethereum')).toBe(1)
    expect(getEvmChainId('polygon')).toBe(137)
    expect(getEvmChainId('base')).toBe(8453)
  })

  it('returns undefined for other chains', () => {
    expect(getEvmChainId('bitcoin')).toBe(undefined)
    expect(getEvmChainId('solana')).toBe(undefined)
    expect(getEvmChainId('zcash')).toBe(undefined)
  })
})
