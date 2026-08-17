import { describe, expect, it } from '@jest/globals'
import { lt } from 'biggystring'

import {
  detectHoudiniChains,
  getHoudiniChain,
  HOUDINI_CHAINS,
  HOUDINI_MIN_USD,
  isValidHoudiniAddress,
  schemeNamesChain
} from '../../util/houdiniChains'

// Real mainnet-format addresses for the chains the send scene offers:
const ADDRESSES = {
  bitcoin: 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq',
  bitcoinLegacy: '1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2',
  ethereum: '0xF0825Aec2c79189C6bB1FEe9293F9478103c9B9e',
  litecoin: 'MQMcJhpWHYVeQArcZR3sBgyPZxxRtnH441',
  solana: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
  dogecoin: 'DH5yaieqoZN36fDVciNyRueRGvGLR3mr7L'
}

const supportAll = (): boolean => true

describe('detectHoudiniChains', () => {
  it('detects the chain a bare address belongs to', () => {
    const found = detectHoudiniChains(ADDRESSES.litecoin, {
      sourcePluginId: 'bitcoin',
      sourceTokenId: null,
      isSupported: supportAll
    })
    expect(found.map(chain => chain.pluginId)).toContain('litecoin')
  })

  it('returns every EVM chain for a bare 0x address', () => {
    const found = detectHoudiniChains(ADDRESSES.ethereum, {
      sourcePluginId: 'bitcoin',
      sourceTokenId: null,
      isSupported: supportAll
    })
    const pluginIds = found.map(chain => chain.pluginId)
    expect(pluginIds).toContain('ethereum')
    expect(pluginIds).toContain('polygon')
    expect(pluginIds.length).toBeGreaterThan(2)
  })

  it('resolves an ambiguous address outright when the URI names the chain', () => {
    const found = detectHoudiniChains(`ethereum:${ADDRESSES.ethereum}`, {
      sourcePluginId: 'bitcoin',
      sourceTokenId: null,
      isSupported: supportAll
    })
    expect(found.map(chain => chain.pluginId)).toEqual(['ethereum'])
  })

  it('honors a URI scheme that differs from the plugin id', () => {
    const found = detectHoudiniChains(`polygon:${ADDRESSES.ethereum}`, {
      sourcePluginId: 'bitcoin',
      sourceTokenId: null,
      isSupported: supportAll
    })
    expect(found.map(chain => chain.pluginId)).toEqual(['polygon'])
  })

  it('carries the amount through to the caller-visible candidates', () => {
    const found = detectHoudiniChains(
      `ethereum:${ADDRESSES.ethereum}?amount=0.007`,
      {
        sourcePluginId: 'bitcoin',
        sourceTokenId: null,
        isSupported: supportAll
      }
    )
    expect(found.map(chain => chain.pluginId)).toEqual(['ethereum'])
  })

  it('offers the source chain when the source asset is a token', () => {
    // USDC on Ethereum paying out native ETH is a real cross-asset route, so a
    // pasted Ethereum address must offer Ethereum. Excluding it unconditionally
    // left the picker naming every OTHER EVM network and not the one the
    // recipient actually holds.
    const found = detectHoudiniChains(ADDRESSES.ethereum, {
      sourcePluginId: 'ethereum',
      sourceTokenId: 'a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
      isSupported: supportAll
    })
    expect(found.map(chain => chain.pluginId)).toContain('ethereum')
  })

  it('never offers the sending wallet own chain as a destination', () => {
    const found = detectHoudiniChains(ADDRESSES.bitcoin, {
      sourcePluginId: 'bitcoin',
      sourceTokenId: null,
      isSupported: supportAll
    })
    expect(found.map(chain => chain.pluginId)).not.toContain('bitcoin')
  })

  it('skips chains the account has no plugin for', () => {
    const found = detectHoudiniChains(ADDRESSES.ethereum, {
      sourcePluginId: 'bitcoin',
      sourceTokenId: null,
      isSupported: pluginId => pluginId === 'polygon'
    })
    expect(found.map(chain => chain.pluginId)).toEqual(['polygon'])
  })

  it('detects Solana, whose format overlaps no EVM chain', () => {
    const found = detectHoudiniChains(ADDRESSES.solana, {
      sourcePluginId: 'bitcoin',
      sourceTokenId: null,
      isSupported: supportAll
    })
    expect(found.map(chain => chain.pluginId)).toContain('solana')
  })

  it('detects Bitcoin from a Litecoin wallet', () => {
    const found = detectHoudiniChains(ADDRESSES.bitcoin, {
      sourcePluginId: 'litecoin',
      sourceTokenId: null,
      isSupported: supportAll
    })
    expect(found.map(chain => chain.pluginId)).toContain('bitcoin')
  })

  it('detects a legacy Bitcoin address', () => {
    const found = detectHoudiniChains(ADDRESSES.bitcoinLegacy, {
      sourcePluginId: 'litecoin',
      sourceTokenId: null,
      isSupported: supportAll
    })
    expect(found.map(chain => chain.pluginId)).toContain('bitcoin')
  })

  it('detects Dogecoin', () => {
    const found = detectHoudiniChains(ADDRESSES.dogecoin, {
      sourcePluginId: 'bitcoin',
      sourceTokenId: null,
      isSupported: supportAll
    })
    expect(found.map(chain => chain.pluginId)).toContain('dogecoin')
  })

  it('returns nothing for input that addresses no served chain', () => {
    const found = detectHoudiniChains('not an address', {
      sourcePluginId: 'bitcoin',
      sourceTokenId: null,
      isSupported: supportAll
    })
    expect(found).toEqual([])
  })

  it('falls back to format matching when the scheme is unknown', () => {
    const found = detectHoudiniChains(`madeupchain:${ADDRESSES.litecoin}`, {
      sourcePluginId: 'bitcoin',
      sourceTokenId: null,
      isSupported: supportAll
    })
    expect(found.map(chain => chain.pluginId)).toContain('litecoin')
  })

  it('ignores a scheme whose address does not validate on that chain', () => {
    // A mislabeled URI must not be trusted into sending to the wrong chain:
    const found = detectHoudiniChains(`ethereum:${ADDRESSES.litecoin}`, {
      sourcePluginId: 'bitcoin',
      sourceTokenId: null,
      isSupported: supportAll
    })
    const pluginIds = found.map(chain => chain.pluginId)
    expect(pluginIds).toContain('litecoin')
    expect(pluginIds).not.toContain('ethereum')
  })

  it('rejects a Cardano regex catch-all that would accept any text', () => {
    // Houdini's published Cardano regex matches every string; detection is
    // meaningless unless that is corrected.
    const found = detectHoudiniChains('hello world', {
      sourcePluginId: 'bitcoin',
      sourceTokenId: null,
      isSupported: pluginId => pluginId === 'cardano'
    })
    expect(found).toEqual([])
  })

  it('resolves an EIP-681 chain id to that chain, not to the scheme', () => {
    // Every EVM network's payment code writes `ethereum:`, so reading the
    // scheme alone sent a Polygon code to Ethereum mainnet.
    const found = detectHoudiniChains(`ethereum:${ADDRESSES.ethereum}@137`, {
      sourcePluginId: 'bitcoin',
      sourceTokenId: null,
      isSupported: () => true
    })
    expect(found.map(chain => chain.pluginId)).toEqual(['polygon'])
  })

  it('resolves nothing for a chain id no served chain claims', () => {
    // Falling back to the scheme here would pay Ethereum for a code that named
    // some other network, which is the misdirection the chain id exists to stop.
    const found = detectHoudiniChains(`ethereum:${ADDRESSES.ethereum}@999999`, {
      sourcePluginId: 'bitcoin',
      sourceTokenId: null,
      isSupported: () => true
    })
    expect(found).toEqual([])
  })

  it('does not offer Solana for a legacy UTXO address', () => {
    // Solana's published pattern reaches down to 32 base58 characters, which is
    // the band the Bitcoin-family legacy forms sit in, so a Litecoin address
    // offered Solana as a network to pay.
    const found = detectHoudiniChains(ADDRESSES.litecoin, {
      sourcePluginId: 'bitcoin',
      sourceTokenId: null,
      isSupported: pluginId => pluginId === 'solana'
    })
    expect(found).toEqual([])
  })

  it('does not offer eCash for an EVM address', () => {
    // Houdini's published eCash regex spells the prefix-less cashaddr form as
    // `[0-9A-Za-z]{42}`, which is exactly the shape of an `0x` EVM address, so
    // every EVM paste offered eCash as a candidate network to pay.
    const found = detectHoudiniChains(
      '0xF0825Aec2c79189C6bB1FEe9293F9478103c9B9e',
      {
        sourcePluginId: 'bitcoin',
        sourceTokenId: null,
        isSupported: pluginId => pluginId === 'ecash'
      }
    )
    expect(found).toEqual([])
  })

  it('still detects a real eCash address, prefixed or bare', () => {
    const opts = {
      sourcePluginId: 'bitcoin',
      sourceTokenId: null,
      isSupported: (pluginId: string) => pluginId === 'ecash'
    }
    const bare = detectHoudiniChains(
      'qpm2qsznhks23z7629mms6s4cwef74vcwvy22gdx6a',
      opts
    )
    const prefixed = detectHoudiniChains(
      'ecash:qpm2qsznhks23z7629mms6s4cwef74vcwvy22gdx6a',
      opts
    )
    expect(bare.map(chain => chain.pluginId)).toEqual(['ecash'])
    expect(prefixed.map(chain => chain.pluginId)).toEqual(['ecash'])
  })
})

describe('getHoudiniChain', () => {
  it('finds a served chain by its Edge plugin id', () => {
    const chain = getHoudiniChain('litecoin', null)
    expect(chain?.houdiniShortName).toEqual('litecoin')
  })

  it('returns nothing for a chain Houdini does not serve', () => {
    expect(getHoudiniChain('piratechain', null)).toBeUndefined()
  })

  it('returns nothing for the chains with no mainnet native coin', () => {
    // Houdini publishes no mainnet native for these, so a quote naming one can
    // never be built. The plugin declines them at runtime either way; keeping
    // them out of this table is about not OFFERING a destination the provider
    // cannot pay out to.
    for (const pluginId of ['celo', 'fantom', 'polkadot', 'ton']) {
      expect(getHoudiniChain(pluginId, null)).toBeUndefined()
    }
  })

  it('returns nothing for a token, even on a served chain', () => {
    // Only chain-native assets are offered as destinations today. A token id
    // must not silently resolve to its parent chain and pay out the wrong
    // asset.
    expect(getHoudiniChain('ethereum', 'a0b8...eb48')).toBeUndefined()
    expect(getHoudiniChain('ethereum', null)).toBeDefined()
  })
})

describe('HOUDINI_CHAINS table', () => {
  it('has no duplicate plugin ids', () => {
    const pluginIds = HOUDINI_CHAINS.map(chain => chain.pluginId)
    expect(new Set(pluginIds).size).toEqual(pluginIds.length)
  })

  it('has no duplicate Houdini chain names', () => {
    const shortNames = HOUDINI_CHAINS.map(chain => chain.houdiniShortName)
    expect(new Set(shortNames).size).toEqual(shortNames.length)
  })

  it('carries a same-asset private capability for every chain', () => {
    // `hasSelfPrivate` decides whether the Stealth toggle can arm on a
    // same-asset pick with no quote, so a missing value would read as false
    // and silently remove the toggle.
    for (const chain of HOUDINI_CHAINS) {
      expect(typeof chain.hasSelfPrivate).toEqual('boolean')
    }
  })

  it('rejects the empty string on every chain address regex', () => {
    // An unanchored or zero-length alternative makes a regex match everything,
    // which turns address detection into a coin flip about where funds go.
    for (const chain of HOUDINI_CHAINS) {
      expect(isValidHoudiniAddress(chain, '')).toEqual(false)
      expect(isValidHoudiniAddress(chain, 'not an address at all')).toEqual(
        false
      )
    }
  })

  it('marks the memo chains that need a destination tag', () => {
    const memoChains = HOUDINI_CHAINS.filter(chain => chain.memoNeeded).map(
      chain => chain.pluginId
    )
    expect(memoChains).toEqual(
      expect.arrayContaining([
        'cosmoshub',
        'hedera',
        'ripple',
        'stellar',
        'thorchainrune'
      ])
    )
    expect(memoChains).not.toContain('bitcoin')
  })

  it('accepts a short Hedera account id', () => {
    // Hedera ids are assigned sequentially, so the early ones are genuinely
    // short. The provider's own pattern demands four digits and rejects them.
    const hedera = getHoudiniChain('hedera', null)
    expect(hedera).toBeDefined()
    if (hedera == null) return
    expect(isValidHoudiniAddress(hedera, '0.0.98')).toEqual(true)
    expect(isValidHoudiniAddress(hedera, '0.0.1234567')).toEqual(true)
    expect(isValidHoudiniAddress(hedera, '0X0Y12345')).toEqual(false)
  })

  it('accepts and rejects addresses on a chain that needs a memo', () => {
    const ripple = getHoudiniChain('ripple', null)
    expect(ripple).toBeDefined()
    if (ripple == null) return
    expect(
      isValidHoudiniAddress(ripple, 'rPT1Sjq2YGrBMTttX4GZHjKu9dyfzbpAYe')
    ).toEqual(true)
    expect(isValidHoudiniAddress(ripple, 'notanaddress')).toEqual(false)
  })

  it('trims surrounding whitespace before validating', () => {
    const litecoin = getHoudiniChain('litecoin', null)
    expect(litecoin).toBeDefined()
    if (litecoin == null) return
    expect(
      isValidHoudiniAddress(litecoin, '  MQMcJhpWHYVeQArcZR3sBgyPZxxRtnH441  ')
    ).toEqual(true)
  })
})

describe('HOUDINI_MIN_USD', () => {
  it('orders the floors from the strictest route to the loosest', () => {
    // Confirmed against the live API: a pair answers with no route at all
    // below 10 USD, standard routes from 10 up, and private routes from 25.
    expect(lt(HOUDINI_MIN_USD.dex, HOUDINI_MIN_USD.standard)).toEqual(true)
    expect(lt(HOUDINI_MIN_USD.standard, HOUDINI_MIN_USD.private)).toEqual(true)
  })

  it('states the floors as biggystring-comparable decimal strings', () => {
    // These are compared against a converted USD order value with `lt`, which
    // needs plain decimal strings rather than numbers.
    for (const floor of Object.values(HOUDINI_MIN_USD)) {
      expect(typeof floor).toEqual('string')
      expect(floor).toMatch(/^[0-9]+(\.[0-9]+)?$/)
    }
  })

  it('holds the values Houdini published', () => {
    expect(HOUDINI_MIN_USD).toEqual({
      private: '25',
      standard: '10',
      dex: '5'
    })
  })
})

describe('schemeNamesChain', () => {
  const getChain = (pluginId: string): (typeof HOUDINI_CHAINS)[number] => {
    const chain = HOUDINI_CHAINS.find(entry => entry.pluginId === pluginId)
    if (chain == null) throw new Error(`no ${pluginId} in HOUDINI_CHAINS`)
    return chain
  }

  it('matches a scheme naming the chain, by plugin id or provider name', () => {
    expect(schemeNamesChain('ethereum', getChain('ethereum'))).toEqual(true)
    expect(schemeNamesChain('ETHEREUM', getChain('ethereum'))).toEqual(true)
    expect(schemeNamesChain('litecoin', getChain('litecoin'))).toEqual(true)
  })

  it('rejects a scheme naming a different EVM chain', () => {
    // The case that made an `ethereum:` code payable on a picked Polygon
    // destination: the two share an address format, so the address alone
    // cannot tell them apart and only the scheme can.
    expect(schemeNamesChain('ethereum', getChain('polygon'))).toEqual(false)
    expect(schemeNamesChain('polygon', getChain('ethereum'))).toEqual(false)
  })
})
