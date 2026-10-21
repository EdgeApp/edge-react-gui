import { describe, expect, it } from '@jest/globals'
import { lt } from 'biggystring'
import type { EdgeCurrencyWallet } from 'edge-core-js'

import {
  asHoudiniChains,
  detectHoudiniChains,
  getHoudiniAssets,
  getHoudiniAssetSupport,
  getHoudiniChain,
  getMemoCarry,
  getOwnNetworkBlock,
  getRecipientAsset,
  getRecipientAssetChoices,
  getSelfTransferPick,
  getWalletSwitchMemoCarry,
  getWalletSwitchReset,
  HOUDINI_MIN_USD,
  type HoudiniChain,
  type HoudiniCurrencyConfigs,
  isOwnChainAddressText,
  isReceiveSideGuaranteed,
  isValidHoudiniAddress,
  keepEnteredAmount,
  makeSwapSendRequest,
  pickKeepsRecipient,
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

// Edge tokenIds. EVM ids are the lowercased contract address without `0x`,
// and the base58 chains use the contract address as it is spelled:
const USDT_TOKEN_ID = 'dac17f958d2ee523a2206206994597c13d831ec7'
const USDC_TOKEN_ID = 'a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'
const UNLISTED_TOKEN_ID = '1111111111111111111111111111111111111111'
const CUSD_CELO = '765de816845861e75a25fca122bb6898b8b1282a'
const USDT_TRON = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t'
const CUSTOM_TRON = 'TAt4ufXFaHZAEV44ev7onThjTnF61SEaEM'
const USDT_SOLANA = 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB'
const USDC_SOLANA = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'
// The POL ERC-20 on Ethereum. Its `displayName` is "Polygon" and its
// `currencyCode` is POL, both identical to the Polygon chain's:
const POL_TOKEN_ID = '455e53cbb86018ac2b8092fdcd39d8444affc3f6'

const EVM = '^(0x)[0-9A-Za-z]{40}$'
const coin = { hasSelfPrivate: true }
const evmChain = { memoNeeded: false, addressValidation: EVM, coin, tokens: {} }

// The info server's `houdiniAssets` field as it served Houdini's list on
// 2026-10-13: every chain's own address pattern, memo flag and coin flag,
// with a handful of its tokens. Polkadot is absent because the server drops a
// chain with neither a coin nor a token it can key. `CUSTOM_TRON` is not on
// Houdini's list; it stands in for a token whose self-private flag is false.
const SERVED = {
  algorand: { ...evmChain, addressValidation: '^[A-Z0-9]{58,58}$' },
  arbitrum: evmChain,
  avalanche: evmChain,
  base: evmChain,
  binancesmartchain: evmChain,
  bitcoin: {
    ...evmChain,
    addressValidation:
      '^([13][a-km-zA-HJ-NP-Z1-9]{25,34}|bc1[a-z0-9]{39}|bc1[a-z0-9]{59})$'
  },
  bitcoincash: {
    ...evmChain,
    addressValidation:
      '^([13][a-km-zA-HJ-NP-Z1-9]{25,34})$|^((bitcoincash:)?(q|p)[a-z0-9]{41})$|^((BITCOINCASH:)?(Q|P)[A-Z0-9]{41})$'
  },
  bitcoinsv: {
    ...evmChain,
    addressValidation: '^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$'
  },
  cardano: {
    ...evmChain,
    addressValidation:
      '^(([1-9A-HJ-NP-Za-km-z]{59})|([0-9A-Za-z]{100,104})|([0-9a-fA-F]{64}))$|^(addr)[0-9A-Za-z]{45,65}$|^[a-zA-z0-9]*|[0-9A-Za-z]{45,65}$'
  },
  celo: {
    memoNeeded: false,
    addressValidation: EVM,
    tokens: { [CUSD_CELO]: { hasSelfPrivate: true } }
  },
  cosmoshub: {
    ...evmChain,
    memoNeeded: true,
    addressValidation: '^(cosmos1)[0-9a-z]{38}$'
  },
  dash: { ...evmChain, addressValidation: '^[X|7][0-9A-Za-z]{33}$' },
  dogecoin: {
    ...evmChain,
    addressValidation: '^(D|A|9)[a-km-zA-HJ-NP-Z1-9]{33,34}$'
  },
  ecash: {
    ...evmChain,
    addressValidation:
      '^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$|^[0-9A-Za-z]{42,42}$|^(ecash:)[0-9A-Za-z]{30,70}$'
  },
  ethereum: {
    ...evmChain,
    tokens: {
      [USDC_TOKEN_ID]: { hasSelfPrivate: true },
      [USDT_TOKEN_ID]: { hasSelfPrivate: true }
    }
  },
  fantom: { memoNeeded: false, addressValidation: EVM, tokens: {} },
  hedera: {
    ...evmChain,
    memoNeeded: true,
    addressValidation: '^(0.0.)[0-9]{4,40}$'
  },
  hyperevm: evmChain,
  litecoin: {
    ...evmChain,
    addressValidation: '^(L|M|3)[A-Za-z0-9]{33}$|^(ltc1)[0-9A-Za-z]{39}$'
  },
  monad: evmChain,
  monero: {
    ...evmChain,
    addressValidation: '^[48][a-zA-Z|\\d]{94}([a-zA-Z|\\d]{11})?$'
  },
  opbnb: evmChain,
  optimism: evmChain,
  pivx: {
    ...evmChain,
    addressValidation: '^(D[0-9A-Za-z]{33}|EXM[0-9A-Za-z]{33})$'
  },
  polygon: evmChain,
  pulsechain: evmChain,
  ripple: {
    ...evmChain,
    memoNeeded: true,
    addressValidation: '^r[1-9A-HJ-NP-Za-km-z]{25,34}$'
  },
  robinhood: evmChain,
  rsk: { ...evmChain, coin: { hasSelfPrivate: false } },
  solana: {
    ...evmChain,
    addressValidation: '^[1-9A-HJ-NP-Za-km-z]{32,44}$',
    tokens: {
      [USDC_SOLANA]: { hasSelfPrivate: true },
      [USDT_SOLANA]: { hasSelfPrivate: true }
    }
  },
  sonic: evmChain,
  stellar: {
    ...evmChain,
    memoNeeded: true,
    addressValidation: '^G[A-D]{1}[A-Z2-7]{54}$'
  },
  sui: { ...evmChain, addressValidation: '^(0x)[0-9A-Za-z]{64}$' },
  thorchainrune: {
    ...evmChain,
    memoNeeded: true,
    addressValidation: '^(thor1)[0-9a-z]{38}$'
  },
  ton: {
    ...evmChain,
    memoNeeded: true,
    addressValidation: '^(EQ|UQ)[A-Za-z0-9-_]{46}$'
  },
  tron: {
    ...evmChain,
    addressValidation: '^T[1-9A-HJ-NP-Za-km-z]{33}$',
    tokens: {
      [CUSTOM_TRON]: { hasSelfPrivate: false },
      [USDT_TRON]: { hasSelfPrivate: true }
    }
  },
  zcash: { ...evmChain, addressValidation: '^t1[1-9A-HJ-NP-Za-km-z]{33}$' },
  zksync: evmChain
}

const houdiniChains = asHoudiniChains(SERVED)

const getChain = (pluginId: string): HoudiniChain => {
  const chain = getHoudiniChain(houdiniChains, pluginId)
  if (chain == null) throw new Error(`no served ${pluginId} chain`)
  return chain
}

const supportAll = (): boolean => true

describe('asHoudiniChains', () => {
  it('keeps every served chain, in pluginId order', () => {
    const pluginIds = [...houdiniChains.keys()]
    expect(pluginIds).toEqual(Object.keys(SERVED).sort())
    expect(pluginIds).toHaveLength(38)
  })

  it('keeps the served memo flags', () => {
    const memoChains = [...houdiniChains.values()]
      .filter(chain => chain.memoNeeded)
      .map(chain => chain.pluginId)
    expect(memoChains).toEqual([
      'cosmoshub',
      'hedera',
      'ripple',
      'stellar',
      'thorchainrune',
      'ton'
    ])
  })

  it('keeps the memo row on a tag chain served with no memo flag', () => {
    const chains = asHoudiniChains({
      ripple: { ...SERVED.ripple, memoNeeded: false },
      stellar: { ...SERVED.stellar, memoNeeded: false },
      litecoin: { ...SERVED.litecoin, memoNeeded: true }
    })
    expect(chains.get('ripple')?.memoNeeded).toEqual(true)
    expect(chains.get('stellar')?.memoNeeded).toEqual(true)
    expect(chains.get('litecoin')?.memoNeeded).toEqual(true)
  })

  it('adds the EVM chain id Edge knows and Houdini does not serve', () => {
    expect(getChain('ethereum').evmChainId).toEqual(1)
    expect(getChain('polygon').evmChainId).toEqual(137)
    expect(getChain('litecoin').evmChainId).toBeUndefined()
  })

  it('replaces the Cardano catch-all with Edge pattern', () => {
    // Houdini's Cardano pattern ends in an unanchored, zero-length
    // alternative that matches every string.
    const cardano = getChain('cardano')
    expect(isValidHoudiniAddress(cardano, 'hello world')).toEqual(false)
    expect(isValidHoudiniAddress(cardano, 'addr' + 'q'.repeat(50))).toEqual(
      true
    )
  })

  it('drops a chain whose served pattern accepts text that is no address', () => {
    const chains = asHoudiniChains({
      ethereum: SERVED.ethereum,
      newchain: { ...evmChain, addressValidation: '^.*$' }
    })
    expect([...chains.keys()]).toEqual(['ethereum'])
  })

  it('drops a chain whose served pattern does not compile', () => {
    const chains = asHoudiniChains({
      ethereum: SERVED.ethereum,
      newchain: { ...evmChain, addressValidation: '^(0x' }
    })
    expect([...chains.keys()]).toEqual(['ethereum'])
  })

  it('drops a chain entry of the wrong shape and keeps the rest', () => {
    const chains = asHoudiniChains({
      ethereum: SERVED.ethereum,
      litecoin: { ...SERVED.litecoin, memoNeeded: 'no' },
      tron: { ...SERVED.tron, tokens: { [USDT_TRON]: true } }
    })
    expect([...chains.keys()]).toEqual(['ethereum'])
  })

  it('keeps a chain Houdini serves only tokens on', () => {
    const celo = getChain('celo')
    expect(celo.coin).toBeUndefined()
    expect(celo.tokens.get(CUSD_CELO)).toEqual({ hasSelfPrivate: true })
  })

  it('reads an empty field as no chains', () => {
    expect(asHoudiniChains({}).size).toEqual(0)
  })

  it('never reads a chain or token from the object prototype', () => {
    const chains = asHoudiniChains(SERVED)
    expect(chains.get('constructor')).toBeUndefined()
    expect(getChain('tron').tokens.get('constructor')).toBeUndefined()
  })
})

describe('isValidHoudiniAddress', () => {
  it('rejects text that is no address on every chain', () => {
    // An unanchored or zero-length alternative makes a pattern match
    // everything, which turns address detection into a coin flip about where
    // funds go.
    for (const chain of houdiniChains.values()) {
      expect(isValidHoudiniAddress(chain, '')).toEqual(false)
      expect(isValidHoudiniAddress(chain, 'not an address at all')).toEqual(
        false
      )
    }
  })

  it('accepts a short Hedera account id', () => {
    // Hedera ids are assigned sequentially, so the early ones are genuinely
    // short. The served pattern demands four digits and rejects them.
    const hedera = getChain('hedera')
    expect(isValidHoudiniAddress(hedera, '0.0.98')).toEqual(true)
    expect(isValidHoudiniAddress(hedera, '0.0.1234567')).toEqual(true)
    expect(isValidHoudiniAddress(hedera, '0X0Y12345')).toEqual(false)
  })

  it('rejects a pipe in a Dash or Monero address', () => {
    // Inside a character class `|` is a literal, not alternation, so a
    // served pattern written `[X|7]` accepts it as an address character.
    const dash = getChain('dash')
    const monero = getChain('monero')
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
    const ripple = getChain('ripple')
    expect(
      isValidHoudiniAddress(ripple, 'rPT1Sjq2YGrBMTttX4GZHjKu9dyfzbpAYe')
    ).toEqual(true)
    expect(isValidHoudiniAddress(ripple, 'notanaddress')).toEqual(false)
  })

  it('trims surrounding whitespace before validating', () => {
    expect(
      isValidHoudiniAddress(
        getChain('litecoin'),
        '  MQMcJhpWHYVeQArcZR3sBgyPZxxRtnH441  '
      )
    ).toEqual(true)
  })
})

describe('detectHoudiniChains', () => {
  const detect = (
    text: string,
    opts: {
      sourcePluginId?: string
      sourceTokenId?: string | null
      isSupported?: (pluginId: string) => boolean
    } = {}
  ): string[] =>
    detectHoudiniChains(text, {
      houdiniChains,
      sourcePluginId: opts.sourcePluginId ?? 'bitcoin',
      sourceTokenId: opts.sourceTokenId ?? null,
      isSupported: opts.isSupported ?? supportAll
    }).map(chain => chain.pluginId)

  it('detects the chain a bare address belongs to', () => {
    expect(detect(ADDRESSES.litecoin)).toContain('litecoin')
  })

  it('returns every EVM chain with a served coin for a bare 0x address', () => {
    const pluginIds = detect(ADDRESSES.ethereum)
    expect(pluginIds).toContain('ethereum')
    expect(pluginIds).toContain('polygon')
    expect(pluginIds.length).toBeGreaterThan(2)
  })

  it('resolves an ambiguous address outright when the URI names the chain', () => {
    expect(detect(`ethereum:${ADDRESSES.ethereum}`)).toEqual(['ethereum'])
  })

  it('honors a URI scheme naming another EVM chain', () => {
    expect(detect(`polygon:${ADDRESSES.ethereum}`)).toEqual(['polygon'])
  })

  it('carries the amount through to the caller-visible candidates', () => {
    expect(detect(`ethereum:${ADDRESSES.ethereum}?amount=0.007`)).toEqual([
      'ethereum'
    ])
  })

  it('offers the source chain when the source asset is a token', () => {
    // USDC on Ethereum paying out native ETH is a real cross-asset route, so a
    // pasted Ethereum address must offer Ethereum. Excluding it unconditionally
    // left the picker naming every OTHER EVM network and not the one the
    // recipient actually holds.
    expect(
      detect(ADDRESSES.ethereum, {
        sourcePluginId: 'ethereum',
        sourceTokenId: USDC_TOKEN_ID
      })
    ).toContain('ethereum')
  })

  it('never offers the sending wallet own chain as a destination', () => {
    expect(detect(ADDRESSES.bitcoin)).not.toContain('bitcoin')
  })

  it('skips chains the account has no plugin for', () => {
    expect(
      detect(ADDRESSES.ethereum, {
        isSupported: pluginId => pluginId === 'polygon'
      })
    ).toEqual(['polygon'])
  })

  it('skips a chain Houdini serves only tokens on', () => {
    // A pasted address resolves to the chain's coin, which Houdini does not
    // pay out on Celo or Fantom.
    for (const pluginId of ['celo', 'fantom']) {
      expect(
        detect(ADDRESSES.ethereum, { isSupported: id => id === pluginId })
      ).toEqual([])
    }
  })

  it('detects Solana, whose format overlaps no EVM chain', () => {
    expect(detect(ADDRESSES.solana)).toContain('solana')
  })

  it('does not offer Solana for a bc1 address made of base58 characters', () => {
    // 42 characters, the length of a short Solana key, with no 0 or l:
    const address = 'bc1q6676xsqma8yvhnxfxhmv68mpyf4wz5ecapkucn'
    expect(detect(address)).not.toContain('solana')
    expect(detect(address.toUpperCase())).not.toContain('solana')
    expect(detect(address, { sourcePluginId: 'litecoin' })).toContain('bitcoin')
  })

  it('detects Bitcoin from a Litecoin wallet', () => {
    expect(detect(ADDRESSES.bitcoin, { sourcePluginId: 'litecoin' })).toContain(
      'bitcoin'
    )
  })

  it('detects a legacy Bitcoin address', () => {
    expect(
      detect(ADDRESSES.bitcoinLegacy, { sourcePluginId: 'litecoin' })
    ).toContain('bitcoin')
  })

  it('detects Dogecoin', () => {
    expect(detect(ADDRESSES.dogecoin)).toContain('dogecoin')
  })

  it('returns nothing for input that addresses no served chain', () => {
    expect(detect('not an address')).toEqual([])
  })

  it('returns nothing before the served list loads', () => {
    expect(
      detectHoudiniChains(ADDRESSES.litecoin, {
        houdiniChains: new Map(),
        sourcePluginId: 'bitcoin',
        sourceTokenId: null,
        isSupported: supportAll
      })
    ).toEqual([])
  })

  it('falls back to format matching when the scheme is unknown', () => {
    expect(detect(`madeupchain:${ADDRESSES.litecoin}`)).toContain('litecoin')
  })

  it('ignores a scheme whose address does not validate on that chain', () => {
    // A mislabeled URI must not be trusted into sending to the wrong chain:
    const pluginIds = detect(`ethereum:${ADDRESSES.litecoin}`)
    expect(pluginIds).toContain('litecoin')
    expect(pluginIds).not.toContain('ethereum')
  })

  it('rejects any text as a Cardano address', () => {
    // Houdini's published Cardano pattern matches every string; detection is
    // meaningless unless that is corrected.
    expect(
      detect('hello world', { isSupported: pluginId => pluginId === 'cardano' })
    ).toEqual([])
  })

  it('resolves an EIP-681 chain id to that chain, not to the scheme', () => {
    // Every EVM network's payment code writes `ethereum:`, so reading the
    // scheme alone sent a Polygon code to Ethereum mainnet.
    expect(detect(`ethereum:${ADDRESSES.ethereum}@137`)).toEqual(['polygon'])
  })

  it('resolves an EIP-681 chain id to Robinhood Chain', () => {
    // Robinhood Chain is an EVM network, so its bare address matches every
    // other EVM entry; the chain id is what names it.
    expect(detect(`ethereum:${ADDRESSES.ethereum}@4663`)).toEqual(['robinhood'])
  })

  it('resolves an EIP-681 chain id to Monad', () => {
    expect(detect(`ethereum:${ADDRESSES.ethereum}@143`)).toEqual(['monad'])
  })

  it('detects a TON address and no other chain', () => {
    expect(detect(ADDRESSES.ton)).toEqual(['ton'])
  })

  it('resolves nothing for a chain id no served chain claims', () => {
    // Falling back to the scheme here would pay Ethereum for a code that named
    // some other network, which is the misdirection the chain id exists to stop.
    expect(detect(`ethereum:${ADDRESSES.ethereum}@999999`)).toEqual([])
  })

  it('does not offer Solana for a legacy UTXO address', () => {
    // Solana's served pattern reaches down to 32 base58 characters, which is
    // the band the Bitcoin-family legacy forms sit in, so a Litecoin address
    // offered Solana as a network to pay.
    expect(
      detect(ADDRESSES.litecoin, {
        isSupported: pluginId => pluginId === 'solana'
      })
    ).toEqual([])
  })

  it('does not offer eCash for an EVM address', () => {
    // Houdini's served eCash pattern spells the prefix-less cashaddr form as
    // `[0-9A-Za-z]{42}`, which is exactly the shape of an `0x` EVM address, so
    // every EVM paste offered eCash as a candidate network to pay.
    expect(
      detect(ADDRESSES.ethereum, {
        isSupported: pluginId => pluginId === 'ecash'
      })
    ).toEqual([])
  })

  it('still detects a real eCash address, prefixed or bare', () => {
    const isSupported = (pluginId: string): boolean => pluginId === 'ecash'
    expect(
      detect('qpm2qsznhks23z7629mms6s4cwef74vcwvy22gdx6a', { isSupported })
    ).toEqual(['ecash'])
    expect(
      detect('ecash:qpm2qsznhks23z7629mms6s4cwef74vcwvy22gdx6a', {
        isSupported
      })
    ).toEqual(['ecash'])
  })
})

describe('getHoudiniChain', () => {
  it('finds a served chain by its Edge plugin id', () => {
    expect(getHoudiniChain(houdiniChains, 'litecoin')?.pluginId).toEqual(
      'litecoin'
    )
  })

  it('returns nothing for a chain Houdini does not serve', () => {
    expect(getHoudiniChain(houdiniChains, 'piratechain')).toBeUndefined()
    expect(getHoudiniChain(houdiniChains, 'polkadot')).toBeUndefined()
  })

  it('returns nothing before the served list loads', () => {
    expect(getHoudiniChain(new Map(), 'litecoin')).toBeUndefined()
  })
})

describe('getHoudiniAssetSupport', () => {
  const getSupport = (
    pluginId: string,
    tokenId: string | null
  ): ReturnType<typeof getHoudiniAssetSupport> =>
    getHoudiniAssetSupport({ asset: { pluginId, tokenId }, houdiniChains })

  it("reads a chain coin's self-private flag", () => {
    expect(getSupport('tron', null)).toEqual({ hasSelfPrivate: true })
    // Rootstock is served, but not to itself:
    expect(getSupport('rsk', null)).toEqual({ hasSelfPrivate: false })
  })

  it("reads a token's self-private flag by its Edge tokenId", () => {
    expect(getSupport('ethereum', USDT_TOKEN_ID)).toEqual({
      hasSelfPrivate: true
    })
    expect(getSupport('tron', USDT_TRON)).toEqual({ hasSelfPrivate: true })
    expect(getSupport('tron', CUSTOM_TRON)).toEqual({ hasSelfPrivate: false })
    expect(getSupport('solana', USDC_SOLANA)).toEqual({ hasSelfPrivate: true })
  })

  it('returns nothing for the coin of a chain served only for tokens', () => {
    expect(getSupport('celo', null)).toBeUndefined()
    expect(getSupport('celo', CUSD_CELO)).toEqual({ hasSelfPrivate: true })
  })

  it('returns nothing for an asset the list does not hold', () => {
    expect(getSupport('ethereum', UNLISTED_TOKEN_ID)).toBeUndefined()
    expect(getSupport('piratechain', null)).toBeUndefined()
    // The served tokenIds are exact, so a differently spelled one is a
    // different token:
    expect(getSupport('tron', USDT_TRON.toLowerCase())).toBeUndefined()
  })

  it('returns nothing before the served list loads', () => {
    expect(
      getHoudiniAssetSupport({
        asset: { pluginId: 'tron', tokenId: null },
        houdiniChains: new Map()
      })
    ).toBeUndefined()
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
  it('matches a scheme naming the chain by its plugin id', () => {
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

  it("rejects Houdini's own chain names", () => {
    // `bsc`, `doge` and `xlm` are Houdini's spellings, not payment URI
    // schemes, so they name nothing.
    expect(schemeNamesChain('bsc', getChain('binancesmartchain'))).toEqual(
      false
    )
    expect(schemeNamesChain('doge', getChain('dogecoin'))).toEqual(false)
    expect(schemeNamesChain('xlm', getChain('stellar'))).toEqual(false)
  })
})

describe('isOwnChainAddressText', () => {
  const ethereum = getChain('ethereum')

  it('accepts a bare address in the chain format', () => {
    expect(isOwnChainAddressText(ethereum, ADDRESSES.ethereum)).toEqual(true)
    expect(
      isOwnChainAddressText(ethereum, ADDRESSES.ethereum.toLowerCase())
    ).toEqual(true)
  })

  it('accepts a payment URI that names the chain', () => {
    // A scanned code whose address fails the checksum reaches the scene in
    // this form, and it is a bad Ethereum address, not another network's:
    expect(
      isOwnChainAddressText(ethereum, `ethereum:${ADDRESSES.ethereum}`)
    ).toEqual(true)
    expect(
      isOwnChainAddressText(ethereum, `ethereum:${ADDRESSES.ethereum}@1`)
    ).toEqual(true)
    expect(
      isOwnChainAddressText(
        getChain('polygon'),
        `ethereum:${ADDRESSES.ethereum}@137`
      )
    ).toEqual(true)
  })

  it('rejects a payment URI that names another chain', () => {
    expect(
      isOwnChainAddressText(ethereum, `polygon:${ADDRESSES.ethereum}`)
    ).toEqual(false)
    expect(
      isOwnChainAddressText(ethereum, `ethereum:${ADDRESSES.ethereum}@137`)
    ).toEqual(false)
    expect(
      isOwnChainAddressText(
        getChain('polygon'),
        `ethereum:${ADDRESSES.ethereum}`
      )
    ).toEqual(false)
  })

  it('rejects text in another chain format', () => {
    expect(isOwnChainAddressText(ethereum, ADDRESSES.bitcoin)).toEqual(false)
    expect(
      isOwnChainAddressText(ethereum, `bitcoin:${ADDRESSES.bitcoin}`)
    ).toEqual(false)
    expect(isOwnChainAddressText(ethereum, 'not an address')).toEqual(false)
  })
})

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
      { pluginId: 'tron', tokenId: USDT_TRON }
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

describe('getOwnNetworkBlock', () => {
  it('never blocks a plain send, whatever the provider offers', () => {
    expect(
      getOwnNetworkBlock({
        stealthActive: false,
        selfPrivateAvailable: false,
        privateRouteOffered: false
      })
    ).toBeUndefined()
  })

  it('lets a private send through when the source routes to itself', () => {
    expect(
      getOwnNetworkBlock({
        stealthActive: true,
        selfPrivateAvailable: true,
        privateRouteOffered: undefined
      })
    ).toBeUndefined()
  })

  it('blocks a private send the source cannot route to itself', () => {
    expect(
      getOwnNetworkBlock({
        stealthActive: true,
        selfPrivateAvailable: false,
        privateRouteOffered: undefined
      })
    ).toEqual('selfPrivateUnsupported')
  })

  it('blocks a private send once a probe found no private route', () => {
    expect(
      getOwnNetworkBlock({
        stealthActive: true,
        selfPrivateAvailable: true,
        privateRouteOffered: false
      })
    ).toEqual('privateRouteUnavailable')
  })

  it('judges a token source by its own same-asset flag', () => {
    // The wallet's own network pays out the token itself, a same-asset send
    // exactly as a coin's is:
    const tokenSource = { stealthActive: true, privateRouteOffered: undefined }
    expect(
      getOwnNetworkBlock({ ...tokenSource, selfPrivateAvailable: true })
    ).toBeUndefined()
    expect(
      getOwnNetworkBlock({ ...tokenSource, selfPrivateAvailable: false })
    ).toEqual('selfPrivateUnsupported')
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
    expect(
      recipientAssetKey({ pluginId: 'ethereum', tokenId: POL_TOKEN_ID })
    ).not.toEqual(recipientAssetKey({ pluginId: 'polygon', tokenId: null }))
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
      destinationAssets: [...houdiniChains.keys()].map(pluginId => ({
        pluginId,
        tokenId: null
      }))
    })
    const keys = choices.map(choice => recipientAssetKey(choice.asset))
    expect(new Set(keys).size).toEqual(keys.length)
  })
})

const makeToken = (
  displayName: string
): HoudiniCurrencyConfigs[string]['allTokens'][string] => ({
  currencyCode: displayName,
  denominations: [],
  displayName,
  networkLocation: undefined
})

// What an account's currency configs hold: built-in tokens plus the custom
// ones the user added, all under `allTokens`. Piratechain stands in for a
// chain the account has that Houdini does not serve, and litecoin for a
// served chain with no tokens.
const currencyConfigs: HoudiniCurrencyConfigs = {
  celo: { allTokens: { [CUSD_CELO]: makeToken('Celo Dollar') } },
  ethereum: {
    allTokens: {
      [USDT_TOKEN_ID]: makeToken('Tether'),
      [USDC_TOKEN_ID]: makeToken('USD Coin'),
      [UNLISTED_TOKEN_ID]: makeToken('Unlisted')
    }
  },
  litecoin: { allTokens: {} },
  piratechain: { allTokens: {} },
  solana: {
    allTokens: {
      [USDC_SOLANA]: makeToken('USD Coin'),
      [USDT_SOLANA]: makeToken('Tether')
    }
  },
  tron: {
    allTokens: {
      [USDT_TRON]: makeToken('Tether'),
      // A custom token the user added:
      [CUSTOM_TRON]: makeToken('Bull')
    }
  }
}

describe('getHoudiniAssets', () => {
  it('lists each served chain coin followed by its served tokens, by name', () => {
    expect(getHoudiniAssets({ currencyConfigs, houdiniChains })).toEqual([
      // Celo's coin is not served, but its token is:
      { pluginId: 'celo', tokenId: CUSD_CELO },
      { pluginId: 'ethereum', tokenId: null },
      { pluginId: 'ethereum', tokenId: USDT_TOKEN_ID },
      { pluginId: 'ethereum', tokenId: USDC_TOKEN_ID },
      { pluginId: 'litecoin', tokenId: null },
      { pluginId: 'solana', tokenId: null },
      { pluginId: 'solana', tokenId: USDT_SOLANA },
      { pluginId: 'solana', tokenId: USDC_SOLANA },
      { pluginId: 'tron', tokenId: null },
      { pluginId: 'tron', tokenId: CUSTOM_TRON },
      { pluginId: 'tron', tokenId: USDT_TRON }
    ])
  })

  it('leaves out a served token the account has no definition for', () => {
    const assets = getHoudiniAssets({
      currencyConfigs: { ...currencyConfigs, tron: { allTokens: {} } },
      houdiniChains
    })
    expect(assets.filter(asset => asset.pluginId === 'tron')).toEqual([
      { pluginId: 'tron', tokenId: null }
    ])
  })

  it('never reads a token definition from the object prototype', () => {
    const chains = asHoudiniChains({
      tron: {
        ...SERVED.tron,
        tokens: { constructor: { hasSelfPrivate: true } }
      }
    })
    expect(
      getHoudiniAssets({ currencyConfigs, houdiniChains: chains })
    ).toEqual([{ pluginId: 'tron', tokenId: null }])
  })

  it('lists nothing before the served list loads', () => {
    expect(
      getHoudiniAssets({ currencyConfigs, houdiniChains: new Map() })
    ).toEqual([])
  })

  it('removes the destinations the info server banned', () => {
    const assets = getHoudiniAssets({
      currencyConfigs,
      houdiniChains,
      bans: [
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
      { pluginId: 'celo', tokenId: CUSD_CELO },
      { pluginId: 'ethereum', tokenId: null },
      { pluginId: 'solana', tokenId: USDT_SOLANA },
      { pluginId: 'solana', tokenId: USDC_SOLANA },
      { pluginId: 'tron', tokenId: null },
      { pluginId: 'tron', tokenId: CUSTOM_TRON }
    ])
  })
})

describe('the "Recipient receives" picker rows', () => {
  const getRows = (
    source: { pluginId: string; tokenId: string | null },
    bans?: Parameters<typeof getHoudiniAssets>[0]['bans']
  ): Array<{ pluginId: string; tokenId: string | null }> =>
    getRecipientAssetChoices({
      source,
      destinationAssets: getHoudiniAssets({
        currencyConfigs,
        bans,
        houdiniChains
      })
    }).map(choice => choice.asset)

  it('follows each chain coin with the tokens Houdini serves on it', () => {
    expect(getRows({ pluginId: 'tron', tokenId: null })).toEqual([
      { pluginId: 'tron', tokenId: null },
      { pluginId: 'celo', tokenId: CUSD_CELO },
      { pluginId: 'ethereum', tokenId: null },
      { pluginId: 'ethereum', tokenId: USDT_TOKEN_ID },
      { pluginId: 'ethereum', tokenId: USDC_TOKEN_ID },
      { pluginId: 'litecoin', tokenId: null },
      { pluginId: 'solana', tokenId: null },
      { pluginId: 'solana', tokenId: USDT_SOLANA },
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
      destinationAssets: getHoudiniAssets({ currencyConfigs, houdiniChains })
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
    expect(getRows({ pluginId: 'tron', tokenId: USDT_TRON })).toContainEqual({
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
})

describe('pickKeepsRecipient', () => {
  const source = { pluginId: 'tron', tokenId: USDT_TRON }

  it('keeps the recipient for an asset on the chain already picked', () => {
    // Tron's coin and its tokens are paid at the same address:
    expect(
      pickKeepsRecipient({
        source,
        destination: source,
        picked: { pluginId: 'tron', tokenId: null }
      })
    ).toEqual(true)
    expect(
      pickKeepsRecipient({
        source,
        destination: { pluginId: 'ethereum', tokenId: null },
        picked: { pluginId: 'ethereum', tokenId: USDT_TOKEN_ID }
      })
    ).toEqual(true)
  })

  it('keeps the recipient when picking back to a source on the same chain', () => {
    expect(
      pickKeepsRecipient({
        source,
        destination: { pluginId: 'tron', tokenId: null },
        picked: undefined
      })
    ).toEqual(true)
  })

  it('drops the recipient for an asset on another chain', () => {
    expect(
      pickKeepsRecipient({
        source,
        destination: source,
        picked: { pluginId: 'ethereum', tokenId: null }
      })
    ).toEqual(false)
    expect(
      pickKeepsRecipient({
        source,
        destination: { pluginId: 'ethereum', tokenId: null },
        picked: undefined
      })
    ).toEqual(false)
  })
})

describe('getMemoCarry', () => {
  const base = {
    tag: undefined,
    plainMemo: undefined,
    tagNeeded: true,
    plainMemoSupported: true
  }

  it('moves a plain memo into the tag row when a swap-send starts', () => {
    expect(
      getMemoCarry({
        ...base,
        swapBefore: false,
        swapAfter: true,
        plainMemo: '12345'
      })
    ).toEqual('toTag')
  })

  it('keeps a tag already entered, and skips a destination with no tag', () => {
    expect(
      getMemoCarry({
        ...base,
        swapBefore: false,
        swapAfter: true,
        plainMemo: '12345',
        tag: '999'
      })
    ).toEqual('none')
    expect(
      getMemoCarry({
        ...base,
        swapBefore: false,
        swapAfter: true,
        plainMemo: '12345',
        tagNeeded: false
      })
    ).toEqual('none')
  })

  it('moves the tag into the plain memo when the swap-send ends', () => {
    // Picking the source asset back on a memo chain, Stealth off:
    expect(
      getMemoCarry({ ...base, swapBefore: true, swapAfter: false, tag: '999' })
    ).toEqual('toPlainMemo')
    // The tag is the newer entry, so it wins over an older plain memo:
    expect(
      getMemoCarry({
        ...base,
        swapBefore: true,
        swapAfter: false,
        tag: '999',
        plainMemo: '12345'
      })
    ).toEqual('toPlainMemo')
  })

  it('leaves the plain memo alone with no tag or no memo option', () => {
    expect(
      getMemoCarry({ ...base, swapBefore: true, swapAfter: false })
    ).toEqual('none')
    expect(
      getMemoCarry({
        ...base,
        swapBefore: true,
        swapAfter: false,
        tag: '999',
        plainMemoSupported: false
      })
    ).toEqual('none')
  })

  it('moves nothing while the mode holds', () => {
    for (const swap of [true, false]) {
      expect(
        getMemoCarry({
          ...base,
          swapBefore: swap,
          swapAfter: swap,
          tag: '999',
          plainMemo: '12345'
        })
      ).toEqual('none')
    }
  })
})

describe('getWalletSwitchReset', () => {
  it('clears nothing when the same wallet and asset are picked again', () => {
    for (const sameAsset of [true, false]) {
      expect(
        getWalletSwitchReset({
          walletChanged: false,
          assetChanged: false,
          sameAsset
        })
      ).toEqual('none')
    }
  })

  it('keeps the recipient for another wallet holding the same asset', () => {
    expect(
      getWalletSwitchReset({
        walletChanged: true,
        assetChanged: false,
        sameAsset: true
      })
    ).toEqual('destination')
  })

  it('clears the recipient when the source asset changes', () => {
    for (const walletChanged of [true, false]) {
      expect(
        getWalletSwitchReset({
          walletChanged,
          assetChanged: true,
          sameAsset: true
        })
      ).toEqual('destinationAndRecipient')
    }
  })

  it('clears a recipient entered for another destination asset', () => {
    // The address was for the picked payout, which the switch drops, so the
    // plain send it falls back to cannot keep it.
    expect(
      getWalletSwitchReset({
        walletChanged: true,
        assetChanged: false,
        sameAsset: false
      })
    ).toEqual('destinationAndRecipient')
  })
})

describe('getWalletSwitchMemoCarry', () => {
  const base = {
    swapBefore: true,
    tag: '12345',
    plainMemo: undefined,
    plainMemoSupported: true
  }

  it('moves a typed tag to the plain memo when the address stays', () => {
    // Another wallet on the same asset with Stealth armed: the switch
    // disarms Stealth, so the kept address pays out as a plain send.
    expect(getWalletSwitchMemoCarry({ ...base, reset: 'destination' })).toEqual(
      'toPlainMemo'
    )
  })

  it('moves nothing when the address goes with the destination', () => {
    expect(
      getWalletSwitchMemoCarry({ ...base, reset: 'destinationAndRecipient' })
    ).toEqual('none')
  })

  it('moves nothing when the switch resets nothing', () => {
    expect(getWalletSwitchMemoCarry({ ...base, reset: 'none' })).toEqual('none')
  })

  it('moves nothing from a plain send or onto a chain with no memo', () => {
    expect(
      getWalletSwitchMemoCarry({
        ...base,
        reset: 'destination',
        swapBefore: false
      })
    ).toEqual('none')
    expect(
      getWalletSwitchMemoCarry({
        ...base,
        reset: 'destination',
        plainMemoSupported: false
      })
    ).toEqual('none')
  })
})

describe('getSelfTransferPick', () => {
  const source = { pluginId: 'tron', tokenId: null }
  const usdt = {
    pluginId: 'tron',
    tokenId: 'a614f803b6fd780986a42c78ec9c7f77e6ded13c'
  }

  it('adopts another asset as the destination', () => {
    for (const sameAsset of [true, false]) {
      expect(getSelfTransferPick({ source, picked: usdt, sameAsset })).toEqual(
        'adopt'
      )
      expect(
        getSelfTransferPick({
          source,
          picked: { pluginId: 'ethereum', tokenId: null },
          sameAsset
        })
      ).toEqual('adopt')
    }
  })

  it('hands the source asset back as a plain send', () => {
    expect(
      getSelfTransferPick({ source, picked: source, sameAsset: true })
    ).toEqual('plainSend')
  })

  it('ends a cross-asset swap-send when the source asset is picked', () => {
    // A TRX wallet picked after "Tether on Tron" pays TRX:
    expect(
      getSelfTransferPick({ source, picked: source, sameAsset: false })
    ).toEqual('endSwapSend')
  })
})

describe('isReceiveSideGuaranteed', () => {
  const base = {
    detectedDestPluginId: undefined,
    destinationCleared: false,
    swapSendActive: true,
    sameAsset: false
  }

  it('guarantees the receive side of a cross-asset swap-send', () => {
    expect(isReceiveSideGuaranteed(base)).toBe(true)
  })

  it('guarantees the receive side of a destination detected from the address', () => {
    expect(
      isReceiveSideGuaranteed({
        ...base,
        detectedDestPluginId: 'ethereum',
        swapSendActive: false,
        sameAsset: true
      })
    ).toBe(true)
  })

  it('keeps the send side once the caller cleared the destination', () => {
    // The render-time state still shows the cross-asset swap-send:
    expect(isReceiveSideGuaranteed({ ...base, destinationCleared: true })).toBe(
      false
    )
  })

  it('keeps the send side of a same-asset or plain send', () => {
    expect(isReceiveSideGuaranteed({ ...base, sameAsset: true })).toBe(false)
    expect(isReceiveSideGuaranteed({ ...base, swapSendActive: false })).toBe(
      false
    )
  })
})

describe('keepEnteredAmount', () => {
  it('keeps the entered amount for a bare address', () => {
    expect(keepEnteredAmount({ publicAddress: 'TXyz' }, '5000000')).toEqual({
      publicAddress: 'TXyz',
      nativeAmount: '5000000'
    })
  })

  it('takes the amount an address carries', () => {
    expect(
      keepEnteredAmount(
        { publicAddress: 'TXyz', nativeAmount: '1000' },
        '5000000'
      )
    ).toEqual({ publicAddress: 'TXyz', nativeAmount: '1000' })
  })
})

describe('makeSwapSendRequest', () => {
  const fromWallet = { id: 'tron-wallet' } as unknown as EdgeCurrencyWallet
  const base = {
    fromWallet,
    fromTokenId: USDT_TRON,
    toAddress: ADDRESSES.ethereum,
    nativeAmount: '25000000',
    guaranteedSide: 'send' as const
  }

  it('names the destination chain and token', () => {
    const request = makeSwapSendRequest({
      ...base,
      destination: { pluginId: 'ethereum', tokenId: USDT_TOKEN_ID }
    })
    expect(request).toEqual({
      fromWallet,
      fromTokenId: USDT_TRON,
      toPluginId: 'ethereum',
      toTokenId: USDT_TOKEN_ID,
      toAddresses: [
        { addressType: 'publicAddress', publicAddress: ADDRESSES.ethereum }
      ],
      toMemos: undefined,
      nativeAmount: '25000000',
      quoteFor: 'from',
      privacy: undefined
    })
  })

  it('pays out a chain coin with a null tokenId', () => {
    const request = makeSwapSendRequest({
      ...base,
      destination: { pluginId: 'ethereum', tokenId: null }
    })
    expect(request.toTokenId).toBeNull()
  })

  it('requires a private route for a Stealth send', () => {
    const destination = { pluginId: 'tron', tokenId: USDT_TRON }
    expect(
      makeSwapSendRequest({ ...base, destination, stealth: true }).privacy
    ).toEqual('required')
    expect(
      makeSwapSendRequest({ ...base, destination, stealth: false }).privacy
    ).toBeUndefined()
  })

  it('quotes for the side the entered amount fixes', () => {
    const destination = { pluginId: 'ethereum', tokenId: null }
    expect(
      makeSwapSendRequest({ ...base, destination, guaranteedSide: 'receive' })
        .quoteFor
    ).toEqual('to')
  })

  it('carries the destination tag', () => {
    const toMemos = [{ type: 'text' as const, value: '12345' }]
    expect(
      makeSwapSendRequest({
        ...base,
        destination: { pluginId: 'ripple', tokenId: null },
        toMemos
      }).toMemos
    ).toEqual(toMemos)
  })
})
