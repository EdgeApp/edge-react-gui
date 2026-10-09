import { describe, expect, it } from '@jest/globals'
import { lt } from 'biggystring'

import {
  asHoudiniTokens,
  detectHoudiniChains,
  getHoudiniAssets,
  getHoudiniAssetSupport,
  getHoudiniChain,
  getRecipientAsset,
  getRecipientAssetChoices,
  HOUDINI_CHAINS,
  HOUDINI_MIN_USD,
  type HoudiniCurrencyConfigs,
  isValidHoudiniAddress,
  recipientAssetKey,
  schemeNamesChain
} from '../../util/houdiniChains'

// Real mainnet-format addresses for the chains the send scene offers:
const ADDRESSES = {
  bitcoin: 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq',
  bitcoinLegacy: '1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2',
  ethereum: '0xF0825Aec2c79189C6bB1FEe9293F9478103c9B9e',
  litecoin: 'MQMcJhpWHYVeQArcZR3sBgyPZxxRtnH441',
  solana: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
  dogecoin: 'DH5yaieqoZN36fDVciNyRueRGvGLR3mr7L',
  ton: 'EQCD39VS5jcptHL8vMjEXrzGaRcCVYto7HUn4bpAOg8xqB2N'
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

  it('resolves an EIP-681 chain id to Robinhood Chain', () => {
    // Robinhood Chain is an EVM network, so its bare address matches every
    // other EVM entry; the chain id is what names it.
    const found = detectHoudiniChains(`ethereum:${ADDRESSES.ethereum}@4663`, {
      sourcePluginId: 'bitcoin',
      sourceTokenId: null,
      isSupported: () => true
    })
    expect(found.map(chain => chain.pluginId)).toEqual(['robinhood'])
  })

  it('resolves an EIP-681 chain id to Monad', () => {
    const found = detectHoudiniChains(`ethereum:${ADDRESSES.ethereum}@143`, {
      sourcePluginId: 'bitcoin',
      sourceTokenId: null,
      isSupported: () => true
    })
    expect(found.map(chain => chain.pluginId)).toEqual(['monad'])
  })

  it('detects a TON address and no other chain', () => {
    const found = detectHoudiniChains(ADDRESSES.ton, {
      sourcePluginId: 'bitcoin',
      sourceTokenId: null,
      isSupported: () => true
    })
    expect(found.map(chain => chain.pluginId)).toEqual(['ton'])
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
    const chain = getHoudiniChain('litecoin')
    expect(chain?.houdiniShortName).toEqual('litecoin')
  })

  it('returns nothing for a chain Houdini does not serve', () => {
    expect(getHoudiniChain('piratechain')).toBeUndefined()
  })

  it('returns nothing for the chains with no mainnet native coin', () => {
    // Houdini publishes no mainnet native for these, so a quote naming one can
    // never be built. The plugin declines them at runtime either way; keeping
    // them out of this table is about not OFFERING a destination the provider
    // cannot pay out to.
    for (const pluginId of ['celo', 'fantom', 'polkadot']) {
      expect(getHoudiniChain(pluginId)).toBeUndefined()
    }
  })

  it('returns nothing for Telos, whose Houdini route is a different network', () => {
    // Houdini's `telos` is Telos EVM, paid at `0x` addresses. Edge's `telos`
    // wallets are EOSIO accounts, so they can neither fund nor receive it.
    expect(getHoudiniChain('telos')).toBeUndefined()
  })

  it('describes the chain, not one asset on it', () => {
    // The row holds the address format, memo flag and EVM chain id, which a
    // token shares with its chain's coin. Whether a token is served is
    // `getHoudiniAssetSupport`'s answer.
    const chain = getHoudiniChain('tron')
    expect(chain?.pluginId).toEqual('tron')
    expect(chain?.memoNeeded).toEqual(false)
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
        'thorchainrune',
        'ton'
      ])
    )
    expect(memoChains).not.toContain('bitcoin')
  })

  it('accepts a short Hedera account id', () => {
    // Hedera ids are assigned sequentially, so the early ones are genuinely
    // short. The provider's own pattern demands four digits and rejects them.
    const hedera = getHoudiniChain('hedera')
    expect(hedera).toBeDefined()
    if (hedera == null) return
    expect(isValidHoudiniAddress(hedera, '0.0.98')).toEqual(true)
    expect(isValidHoudiniAddress(hedera, '0.0.1234567')).toEqual(true)
    expect(isValidHoudiniAddress(hedera, '0X0Y12345')).toEqual(false)
  })

  it('rejects a pipe in a Dash or Monero address', () => {
    // Inside a character class `|` is a literal, not alternation, so a
    // provider pattern written `[X|7]` accepts it as an address character.
    const dash = getHoudiniChain('dash')
    const monero = getHoudiniChain('monero')
    expect(dash).toBeDefined()
    expect(monero).toBeDefined()
    if (dash == null || monero == null) return
    expect(
      isValidHoudiniAddress(dash, 'XpESxaUmonkq8RaLLp46Brx2K39ggQe226')
    ).toEqual(true)
    expect(isValidHoudiniAddress(dash, '|' + 'a'.repeat(33))).toEqual(false)
    const moneroAddress =
      '44AFFq5kSiGBoZ4NMDwYtN18obc8AemS33DBLWs3H7otXft3XjrpDtQGv7SqSsaBYBb98uNbr2VBBEt7f2wfn3RVGQBEP3A'
    expect(isValidHoudiniAddress(monero, moneroAddress)).toEqual(true)
    expect(
      isValidHoudiniAddress(
        monero,
        moneroAddress.slice(0, 50) + '|' + moneroAddress.slice(51)
      )
    ).toEqual(false)
  })

  it('accepts and rejects addresses on a chain that needs a memo', () => {
    const ripple = getHoudiniChain('ripple')
    expect(ripple).toBeDefined()
    if (ripple == null) return
    expect(
      isValidHoudiniAddress(ripple, 'rPT1Sjq2YGrBMTttX4GZHjKu9dyfzbpAYe')
    ).toEqual(true)
    expect(isValidHoudiniAddress(ripple, 'notanaddress')).toEqual(false)
  })

  it('trims surrounding whitespace before validating', () => {
    const litecoin = getHoudiniChain('litecoin')
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

// A USDT contract on Ethereum, standing in for any token source:
const USDT_TOKEN_ID = 'dac17f958d2ee523a2206206994597c13d831ec7'
// The POL ERC-20 on Ethereum. Its `displayName` is "Polygon" and its
// `currencyCode` is POL, both identical to the Polygon chain's:
const POL_TOKEN_ID = '455e53cbb86018ac2b8092fdcd39d8444affc3f6'

describe('getRecipientAsset', () => {
  const source = { pluginId: 'ethereum', tokenId: USDT_TOKEN_ID }

  it('gives the source asset for a plain send, token included', () => {
    expect(
      getRecipientAsset({
        source,
        destination: { pluginId: 'litecoin', tokenId: null },
        swapSendActive: false
      })
    ).toEqual(source)
  })

  it('gives the destination asset for a swap-send', () => {
    for (const destination of [
      { pluginId: 'litecoin', tokenId: null },
      // The source chain's own coin, picked for a token source:
      { pluginId: 'ethereum', tokenId: null },
      // A token on another chain:
      { pluginId: 'tron', tokenId: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t' }
    ]) {
      expect(
        getRecipientAsset({ source, destination, swapSendActive: true })
      ).toEqual(destination)
    }
  })

  it('gives a token source its own token for a same-asset private send', () => {
    // Stealth with nothing picked sends the source asset privately, so the
    // destination the scene passes is the source itself.
    expect(
      getRecipientAsset({ source, destination: source, swapSendActive: true })
    ).toEqual(source)
  })
})

describe('getRecipientAssetChoices', () => {
  const destinationAssets = [
    { pluginId: 'bitcoin', tokenId: null },
    { pluginId: 'ethereum', tokenId: null },
    { pluginId: 'ethereum', tokenId: USDT_TOKEN_ID },
    { pluginId: 'litecoin', tokenId: null },
    { pluginId: 'polygon', tokenId: null }
  ]

  it('leads with the source asset, which adopts nothing', () => {
    for (const tokenId of [null, USDT_TOKEN_ID]) {
      const source = { pluginId: 'ethereum', tokenId }
      const [first] = getRecipientAssetChoices({ source, destinationAssets })
      expect(first).toEqual({ asset: source, pickedAsset: undefined })
    }
  })

  it('offers a token source its own chain coin', () => {
    const choices = getRecipientAssetChoices({
      source: { pluginId: 'ethereum', tokenId: USDT_TOKEN_ID },
      destinationAssets
    })
    expect(choices.map(choice => choice.asset)).toEqual([
      { pluginId: 'ethereum', tokenId: USDT_TOKEN_ID },
      { pluginId: 'bitcoin', tokenId: null },
      { pluginId: 'ethereum', tokenId: null },
      { pluginId: 'litecoin', tokenId: null },
      { pluginId: 'polygon', tokenId: null }
    ])
    expect(choices[2].pickedAsset).toEqual({
      pluginId: 'ethereum',
      tokenId: null
    })
  })

  it('never lists one payout twice', () => {
    // The source asset is also a destination asset. Two rows for it would
    // quote identically and differ only in whether turning Stealth off
    // degrades to a plain send, and no user can tell them apart.
    for (const tokenId of [null, USDT_TOKEN_ID]) {
      const keys = getRecipientAssetChoices({
        source: { pluginId: 'ethereum', tokenId },
        destinationAssets
      }).map(choice => recipientAssetKey(choice.asset))
      expect(new Set(keys).size).toEqual(keys.length)
    }
  })

  it('adopts every row but the first as its own asset', () => {
    const choices = getRecipientAssetChoices({
      source: { pluginId: 'ethereum', tokenId: null },
      destinationAssets
    })
    expect(choices.map(choice => choice.pickedAsset)).toEqual([
      undefined,
      { pluginId: 'bitcoin', tokenId: null },
      { pluginId: 'ethereum', tokenId: USDT_TOKEN_ID },
      { pluginId: 'litecoin', tokenId: null },
      { pluginId: 'polygon', tokenId: null }
    ])
  })

  it('keeps a source the destination list does not hold', () => {
    // A banned or unserved source asset still has its plain-send row.
    const source = { pluginId: 'piratechain', tokenId: null }
    const choices = getRecipientAssetChoices({ source, destinationAssets })
    expect(choices[0].asset).toEqual(source)
    expect(choices).toHaveLength(destinationAssets.length + 1)
  })
})

describe('recipientAssetKey', () => {
  it('separates a token from a chain that shares its name and code', () => {
    // The POL ERC-20 on Ethereum and the Polygon chain are both displayed as
    // "Polygon (POL)". Keying the picker on the label marked both rows
    // selected and resolved either tap to the same destination, which left
    // Polygon unreachable from a POL wallet.
    const polToken = recipientAssetKey({
      pluginId: 'ethereum',
      tokenId: POL_TOKEN_ID
    })
    const polygonChain = recipientAssetKey({
      pluginId: 'polygon',
      tokenId: null
    })
    expect(polToken).not.toEqual(polygonChain)
  })

  it('separates one token contract deployed on two chains', () => {
    // An EVM token can sit at the same address on two chains, so the token id
    // alone does not name an asset.
    expect(
      recipientAssetKey({ pluginId: 'ethereum', tokenId: USDT_TOKEN_ID })
    ).not.toEqual(
      recipientAssetKey({ pluginId: 'polygon', tokenId: USDT_TOKEN_ID })
    )
  })

  it('gives every row of a picker a distinct key', () => {
    const choices = getRecipientAssetChoices({
      source: { pluginId: 'ethereum', tokenId: POL_TOKEN_ID },
      destinationAssets: HOUDINI_CHAINS.map(chain => ({
        pluginId: chain.pluginId,
        tokenId: null
      }))
    })
    const keys = choices.map(choice => recipientAssetKey(choice.asset))
    expect(new Set(keys).size).toEqual(keys.length)
  })
})

// Contract addresses in the spelling Edge stores (EVM ones carry a checksum),
// keyed the way the served list is NOT: the list is lowercased on load.
const USDT_ETHEREUM = '0xdAC17F958D2ee523a2206206994597C13D831ec7'
const USDC_ETHEREUM = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
const USDT_TRON = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t'
const USDC_SOLANA = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'
const CUSTOM_TRON = 'TAt4ufXFaHZAEV44ev7onThjTnF61SEaEM'
const UNLISTED_ETHEREUM = '0x1111111111111111111111111111111111111111'

const USDC_TOKEN_ID = 'a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'
const UNLISTED_TOKEN_ID = '1111111111111111111111111111111111111111'

const makeToken = (
  displayName: string,
  networkLocation: object | undefined
): HoudiniCurrencyConfigs[string]['allTokens'][string] => ({
  currencyCode: displayName,
  denominations: [],
  displayName,
  networkLocation
})

// What an account's currency configs hold: built-in tokens plus the custom
// ones the user added, all under `allTokens`. Piratechain stands in for a
// chain the account has that Houdini does not serve, and litecoin for a
// served chain with no tokens.
const currencyConfigs: HoudiniCurrencyConfigs = {
  ethereum: {
    allTokens: {
      [USDT_TOKEN_ID]: makeToken('Tether', { contractAddress: USDT_ETHEREUM }),
      [USDC_TOKEN_ID]: makeToken('USD Coin', {
        contractAddress: USDC_ETHEREUM
      }),
      [UNLISTED_TOKEN_ID]: makeToken('Unlisted', {
        contractAddress: UNLISTED_ETHEREUM
      })
    }
  },
  litecoin: { allTokens: {} },
  piratechain: { allTokens: {} },
  solana: {
    allTokens: {
      [USDC_SOLANA]: makeToken('USD Coin', { contractAddress: USDC_SOLANA })
    }
  },
  tron: {
    allTokens: {
      [USDT_TRON]: makeToken('Tether', { contractAddress: USDT_TRON }),
      // A custom token the user added, which Houdini happens to list:
      [CUSTOM_TRON]: makeToken('Bull', { contractAddress: CUSTOM_TRON }),
      // A token located by something other than a contract address:
      memoOnly: makeToken('Memo Only', { issuer: 'someone' })
    }
  }
}

// The list as the info server serves it, in Houdini's own spelling. The
// `fantom` chain is one Houdini lists tokens for that the app does not serve.
const servedTokens = {
  ethereum: {
    [USDT_ETHEREUM.toLowerCase()]: true,
    [USDC_ETHEREUM.toLowerCase()]: false
  },
  fantom: { '0x2222222222222222222222222222222222222222': true },
  solana: { [USDC_SOLANA]: true },
  tron: { [USDT_TRON]: true, [CUSTOM_TRON]: false }
}
const houdiniTokens = asHoudiniTokens(servedTokens)

describe('asHoudiniTokens', () => {
  it('lowercases every contract address', () => {
    expect(houdiniTokens.tron).toEqual({
      [USDT_TRON.toLowerCase()]: true,
      [CUSTOM_TRON.toLowerCase()]: false
    })
    expect(houdiniTokens.solana).toEqual({
      [USDC_SOLANA.toLowerCase()]: true
    })
  })

  it('keeps the chain names as served', () => {
    // The names are matched against `houdiniShortName`, which is mixed case
    // for some chains (`MON`, `Zcash`).
    expect(Object.keys(asHoudiniTokens({ MON: {}, Zcash: {} }))).toEqual([
      'MON',
      'Zcash'
    ])
  })

  it('rejects a list of the wrong shape', () => {
    expect(() => asHoudiniTokens({ tron: [USDT_TRON] })).toThrow()
    expect(() => asHoudiniTokens({ tron: { [USDT_TRON]: 'yes' } })).toThrow()
  })
})

describe('getHoudiniAssetSupport', () => {
  const getSupport = (
    pluginId: string,
    tokenId: string | null
  ): ReturnType<typeof getHoudiniAssetSupport> =>
    getHoudiniAssetSupport({
      asset: { pluginId, tokenId },
      currencyConfigs,
      houdiniTokens
    })

  it('reads a chain coin from the chain table', () => {
    expect(getSupport('tron', null)).toEqual({ hasSelfPrivate: true })
    // Rootstock is served, but not to itself:
    expect(getSupport('rsk', null)).toEqual({ hasSelfPrivate: false })
    expect(getSupport('piratechain', null)).toBeUndefined()
  })

  it('matches a token by contract address, whatever its case', () => {
    // Edge spells an EVM address with a checksum and Houdini in lowercase,
    // and the base58 addresses arrive in their one true spelling:
    expect(getSupport('ethereum', USDT_TOKEN_ID)).toEqual({
      hasSelfPrivate: true
    })
    expect(getSupport('tron', USDT_TRON)).toEqual({ hasSelfPrivate: true })
    expect(getSupport('solana', USDC_SOLANA)).toEqual({ hasSelfPrivate: true })
  })

  it("reads a token's self-private flag from the list", () => {
    expect(getSupport('ethereum', USDC_TOKEN_ID)).toEqual({
      hasSelfPrivate: false
    })
  })

  it('matches a custom token the same way', () => {
    expect(getSupport('tron', CUSTOM_TRON)).toEqual({ hasSelfPrivate: false })
  })

  it('returns nothing for a token the list does not hold', () => {
    expect(getSupport('ethereum', UNLISTED_TOKEN_ID)).toBeUndefined()
    // A token id the account has no token for:
    expect(getSupport('ethereum', 'ffff')).toBeUndefined()
    // A token with no contract address to match by:
    expect(getSupport('tron', 'memoOnly')).toBeUndefined()
  })

  it('returns nothing for a token before the list loads', () => {
    expect(
      getHoudiniAssetSupport({
        asset: { pluginId: 'tron', tokenId: USDT_TRON },
        currencyConfigs,
        houdiniTokens: {}
      })
    ).toBeUndefined()
  })

  it('never resolves an address through the object prototype', () => {
    const configs: HoudiniCurrencyConfigs = {
      tron: {
        allTokens: {
          odd: makeToken('Odd', { contractAddress: 'constructor' })
        }
      }
    }
    expect(
      getHoudiniAssetSupport({
        asset: { pluginId: 'tron', tokenId: 'odd' },
        currencyConfigs: configs,
        houdiniTokens
      })
    ).toBeUndefined()
  })
})

describe('getHoudiniAssets', () => {
  it('lists each chain coin followed by its served tokens, by name', () => {
    expect(getHoudiniAssets({ currencyConfigs, houdiniTokens })).toEqual([
      { pluginId: 'ethereum', tokenId: null },
      { pluginId: 'ethereum', tokenId: USDT_TOKEN_ID },
      { pluginId: 'ethereum', tokenId: USDC_TOKEN_ID },
      { pluginId: 'litecoin', tokenId: null },
      { pluginId: 'solana', tokenId: null },
      { pluginId: 'solana', tokenId: USDC_SOLANA },
      { pluginId: 'tron', tokenId: null },
      { pluginId: 'tron', tokenId: CUSTOM_TRON },
      { pluginId: 'tron', tokenId: USDT_TRON }
    ])
  })

  it('lists the chain coins alone before the list loads', () => {
    expect(getHoudiniAssets({ currencyConfigs, houdiniTokens: {} })).toEqual([
      { pluginId: 'ethereum', tokenId: null },
      { pluginId: 'litecoin', tokenId: null },
      { pluginId: 'solana', tokenId: null },
      { pluginId: 'tron', tokenId: null }
    ])
  })

  it('removes the destinations the info server banned', () => {
    const assets = getHoudiniAssets({
      currencyConfigs,
      houdiniTokens,
      destinationBans: [
        // One token:
        { pluginId: 'tron', tokenId: USDT_TRON },
        // A chain coin, which leaves its tokens:
        { pluginId: 'solana', tokenId: undefined },
        // Every token on a chain, which leaves its coin:
        { pluginId: 'ethereum', tokenId: 'allTokens' },
        // A whole chain:
        { pluginId: 'litecoin', tokenId: 'allCoins' }
      ]
    })
    expect(assets).toEqual([
      { pluginId: 'ethereum', tokenId: null },
      { pluginId: 'solana', tokenId: USDC_SOLANA },
      { pluginId: 'tron', tokenId: null },
      { pluginId: 'tron', tokenId: CUSTOM_TRON }
    ])
  })
})

describe('the "Recipient receives" picker rows', () => {
  const getRows = (
    source: { pluginId: string; tokenId: string | null },
    destinationBans?: Parameters<typeof getHoudiniAssets>[0]['destinationBans']
  ): Array<{ pluginId: string; tokenId: string | null }> =>
    getRecipientAssetChoices({
      source,
      destinationAssets: getHoudiniAssets({
        currencyConfigs,
        houdiniTokens,
        destinationBans
      })
    }).map(choice => choice.asset)

  it('follows each chain coin with the tokens Houdini serves on it', () => {
    expect(getRows({ pluginId: 'tron', tokenId: null })).toEqual([
      { pluginId: 'tron', tokenId: null },
      { pluginId: 'ethereum', tokenId: null },
      { pluginId: 'ethereum', tokenId: USDT_TOKEN_ID },
      { pluginId: 'ethereum', tokenId: USDC_TOKEN_ID },
      { pluginId: 'litecoin', tokenId: null },
      { pluginId: 'solana', tokenId: null },
      { pluginId: 'solana', tokenId: USDC_SOLANA },
      { pluginId: 'tron', tokenId: CUSTOM_TRON },
      { pluginId: 'tron', tokenId: USDT_TRON }
    ])
  })

  it('lists a token source once, as the first row', () => {
    // USDT to USDT is the same asset, so the row adopts nothing and the send
    // stays a plain or same-asset private one.
    const source = { pluginId: 'tron', tokenId: USDT_TRON }
    const choices = getRecipientAssetChoices({
      source,
      destinationAssets: getHoudiniAssets({ currencyConfigs, houdiniTokens })
    })
    expect(choices[0]).toEqual({ asset: source, pickedAsset: undefined })
    expect(
      choices.filter(
        choice => recipientAssetKey(choice.asset) === recipientAssetKey(source)
      )
    ).toHaveLength(1)
    // Its chain coin is a row of its own, and a cross-asset pick:
    expect(choices.map(choice => choice.pickedAsset)).toContainEqual({
      pluginId: 'tron',
      tokenId: null
    })
  })

  it('treats the same token on another chain as a different asset', () => {
    const rows = getRows({ pluginId: 'tron', tokenId: USDT_TRON })
    expect(rows).toContainEqual({
      pluginId: 'ethereum',
      tokenId: USDT_TOKEN_ID
    })
  })

  it('leaves out an unlisted token and an unserved chain', () => {
    const rows = getRows({ pluginId: 'tron', tokenId: null })
    expect(rows).not.toContainEqual({
      pluginId: 'ethereum',
      tokenId: UNLISTED_TOKEN_ID
    })
    expect(rows.map(row => row.pluginId)).not.toContain('piratechain')
  })

  it('removes a banned destination row and keeps the source row', () => {
    const source = { pluginId: 'tron', tokenId: USDT_TRON }
    const rows = getRows(source, [
      { pluginId: 'solana', tokenId: USDC_SOLANA },
      // The source asset itself, which stays as the plain-send row:
      { pluginId: 'tron', tokenId: USDT_TRON }
    ])
    expect(rows[0]).toEqual(source)
    expect(rows).not.toContainEqual({
      pluginId: 'solana',
      tokenId: USDC_SOLANA
    })
    expect(rows).toContainEqual({ pluginId: 'solana', tokenId: null })
  })

  it('offers chain coins alone before the list loads', () => {
    const rows = getRecipientAssetChoices({
      source: { pluginId: 'tron', tokenId: null },
      destinationAssets: getHoudiniAssets({
        currencyConfigs,
        houdiniTokens: {}
      })
    }).map(choice => choice.asset)
    expect(rows.every(row => row.tokenId == null)).toEqual(true)
  })
})
