import { describe, expect, it } from '@jest/globals'
import type { EdgeCurrencyConfig, EdgeParsedUri } from 'edge-core-js'

import { makeFakeCurrencyConfig } from '../../util/fake/fakeCurrencyConfig'
import {
  findPayableChains,
  getUriAmountSide,
  parseCrossChainPayment,
  parseOwnNetworkPayment,
  peekPaymentUri,
  withStatedAsset
} from '../../util/paymentUri'

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

  const PAYEE = '0xF0825Aec2c79189C6bB1FEe9293F9478103c9B9e'
  const USDC_TOKEN_ID = 'a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'
  const USDT_TOKEN_ID = 'dac17f958d2ee523a2206206994597c13d831ec7'

  it('rejects a token code on a coin payout', async () => {
    // Honoring it would pay the coin for an invoice in the token:
    const config = makeConfig(async () => ({
      publicAddress: PAYEE,
      nativeAmount: '1000000',
      tokenId: USDC_TOKEN_ID
    }))
    expect(await parseCrossChainPayment(config, 'ethereum:0x')).toBeUndefined()
  })

  it("accepts the payout token's code with its amount", async () => {
    // A USDC invoice for a USDC payout, its amount in USDC's own units:
    const config = makeConfig(async () => ({
      publicAddress: PAYEE,
      nativeAmount: '1000000',
      tokenId: USDC_TOKEN_ID
    }))
    expect(
      await parseCrossChainPayment(config, 'ethereum:0x', USDC_TOKEN_ID)
    ).toEqual({ publicAddress: PAYEE, nativeAmount: '1000000' })
  })

  it("rejects another token's code on a token payout", async () => {
    const config = makeConfig(async () => ({
      publicAddress: PAYEE,
      nativeAmount: '1000000',
      tokenId: USDC_TOKEN_ID
    }))
    expect(
      await parseCrossChainPayment(config, 'ethereum:0x', USDT_TOKEN_ID)
    ).toBeUndefined()
  })

  it("keeps a coin code's address but not its amount on a token payout", async () => {
    // The amount is in the chain's coin, which cannot price the token:
    const config = makeConfig(async () => ({
      publicAddress: PAYEE,
      nativeAmount: '2000000000000000'
    }))
    expect(
      await parseCrossChainPayment(config, 'ethereum:0x', USDC_TOKEN_ID)
    ).toEqual({ publicAddress: PAYEE })
  })

  it('rejects a result with no address', async () => {
    const config = makeConfig(async () => ({}))
    expect(await parseCrossChainPayment(config, 'ripple:')).toBeUndefined()
  })

  // Ethereum's parser throws on a `transfer` code asked for any asset but the
  // token it moves, and core turns the code it answers with into a tokenId:
  const makeEvmConfig = (): EdgeCurrencyConfig => ({
    ...makeFakeCurrencyConfig(
      { pluginId: 'ethereum', currencyCode: 'ETH' },
      {
        [USDT_TOKEN_ID]: {
          currencyCode: 'USDT',
          displayName: 'Tether',
          denominations: [{ name: 'USDT', multiplier: '1000000' }],
          networkLocation: { contractAddress: `0x${USDT_TOKEN_ID}` }
        }
      }
    ),
    parseUri: async (uri, currencyCode) => {
      if (!uri.includes('/transfer')) {
        return { publicAddress: PAYEE, nativeAmount: '2000000000000000' }
      }
      if (currencyCode !== 'USDT') {
        throw new Error('InternalErrorInvalidCurrencyCode')
      }
      return {
        publicAddress: PAYEE,
        nativeAmount: '25000000',
        tokenId: USDT_TOKEN_ID
      }
    }
  })
  const USDT_INVOICE = `ethereum:0x${USDT_TOKEN_ID}/transfer?address=${PAYEE}&uint256=25000000`

  it('accepts a token invoice the parser only reads as that token', async () => {
    expect(
      await parseCrossChainPayment(makeEvmConfig(), USDT_INVOICE, USDT_TOKEN_ID)
    ).toEqual({ publicAddress: PAYEE, nativeAmount: '25000000' })
  })

  it('still reads a coin code as the coin on a token payout', async () => {
    expect(
      await parseCrossChainPayment(
        makeEvmConfig(),
        `ethereum:${PAYEE}?value=2000000000000000`,
        USDT_TOKEN_ID
      )
    ).toEqual({ publicAddress: PAYEE })
  })

  it('rejects a token invoice on a coin payout', async () => {
    expect(
      await parseCrossChainPayment(makeEvmConfig(), USDT_INVOICE)
    ).toBeUndefined()
  })

  it('asks for the payout token only for a payment URI', async () => {
    const asked: Array<string | undefined> = []
    const config: EdgeCurrencyConfig = {
      ...makeEvmConfig(),
      parseUri: async (uri, currencyCode) => {
        asked.push(currencyCode)
        throw new Error('InvalidPublicAddressError')
      }
    }
    expect(
      await parseCrossChainPayment(config, 'not-an-address', USDT_TOKEN_ID)
    ).toBeUndefined()
    expect(asked).toEqual(['ETH'])
  })
})

describe('parseOwnNetworkPayment', () => {
  const USDC_TOKEN_ID = 'a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'
  const makeWallet = (
    parseUri: (uri: string, currencyCode?: string) => Promise<EdgeParsedUri>
  ): { parseUri: typeof parseUri } => ({ parseUri })

  it('keeps the whole parse, amount and memo included', async () => {
    const parsed: EdgeParsedUri = {
      publicAddress: 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq',
      nativeAmount: '150000',
      tokenId: null,
      metadata: { name: 'Coffee' }
    }
    const wallet = makeWallet(async () => parsed)
    expect(
      await parseOwnNetworkPayment(
        wallet,
        'BTC',
        null,
        'bitcoin:bc1qar0s?amount=0.0015&label=Coffee'
      )
    ).toEqual(parsed)
  })

  it('reads trimmed text as the asset being sent', async () => {
    const asked: Array<string | undefined> = []
    const wallet = makeWallet(async (uri, currencyCode) => {
      asked.push(uri, currencyCode)
      return { publicAddress: uri, tokenId: USDC_TOKEN_ID }
    })
    await parseOwnNetworkPayment(wallet, 'USDC', USDC_TOKEN_ID, '  0xabc  ')
    expect(asked).toEqual(['0xabc', 'USDC'])
  })

  it('accepts a parse that names the token being sent', async () => {
    const wallet = makeWallet(async () => ({
      publicAddress: '0xF0825Aec2c79189C6bB1FEe9293F9478103c9B9e',
      tokenId: USDC_TOKEN_ID
    }))
    expect(
      await parseOwnNetworkPayment(wallet, 'USDC', USDC_TOKEN_ID, '0xF082')
    ).toMatchObject({ tokenId: USDC_TOKEN_ID })
  })

  it('accepts a parse that names no asset', async () => {
    const wallet = makeWallet(async () => ({ publicAddress: 'bc1qar0s' }))
    expect(
      await parseOwnNetworkPayment(wallet, 'BTC', null, 'bc1qar0s')
    ).toEqual({ publicAddress: 'bc1qar0s' })
  })

  it('rejects a code for a different asset than the one sent', async () => {
    // A token transfer code scanned on a coin send, and the reverse: paying
    // one asset to a request for another is wrong either way.
    const tokenCode = makeWallet(async () => ({
      publicAddress: '0xF0825Aec2c79189C6bB1FEe9293F9478103c9B9e',
      tokenId: USDC_TOKEN_ID
    }))
    expect(
      await parseOwnNetworkPayment(tokenCode, 'ETH', null, 'ethereum:0x')
    ).toBeUndefined()
    const coinCode = makeWallet(async () => ({
      publicAddress: '0xF0825Aec2c79189C6bB1FEe9293F9478103c9B9e',
      tokenId: null
    }))
    expect(
      await parseOwnNetworkPayment(coinCode, 'USDC', USDC_TOKEN_ID, '0xF082')
    ).toBeUndefined()
  })

  it("rejects a code for the chain's coin on a token send", async () => {
    // The wallet stamps the token it was asked about on a parse that names
    // no asset, wei amount and all:
    const wallet = makeWallet(async () => ({
      publicAddress: '0xf0825aec2c79189c6bb1fee9293f9478103c9b9e',
      nativeAmount: '500000000',
      tokenId: USDC_TOKEN_ID
    }))
    expect(
      await parseOwnNetworkPayment(
        wallet,
        'USDC',
        USDC_TOKEN_ID,
        'ethereum:0xF0825Aec2c79189C6bB1FEe9293F9478103c9B9e?value=5e8'
      )
    ).toBeUndefined()
  })

  it("keeps a code for the chain's coin on a coin send", async () => {
    const parsed: EdgeParsedUri = {
      publicAddress: '0xf0825aec2c79189c6bb1fee9293f9478103c9b9e',
      nativeAmount: '500000000',
      tokenId: null
    }
    const wallet = makeWallet(async () => parsed)
    expect(
      await parseOwnNetworkPayment(
        wallet,
        'ETH',
        null,
        'ethereum:0xF0825Aec2c79189C6bB1FEe9293F9478103c9B9e?value=5e8'
      )
    ).toEqual(parsed)
  })

  it('rejects what the wallet parser rejects', async () => {
    const wallet = makeWallet(async () => {
      throw new Error('InvalidPublicAddressError')
    })
    expect(
      await parseOwnNetworkPayment(wallet, 'BTC', null, 'nope')
    ).toBeUndefined()
  })

  it('rejects a result with no address', async () => {
    const wallet = makeWallet(async () => ({ tokenId: null }))
    expect(
      await parseOwnNetworkPayment(wallet, 'BTC', null, 'bitcoin:?r=https://x')
    ).toBeUndefined()
  })
})

describe('withStatedAsset', () => {
  const tokenId = 'dac17f958d2ee523a2206206994597c13d831ec7'
  const publicAddress = '0xf0825aec2c79189c6bb1fee9293f9478103c9b9e'
  const payee = '0xF0825Aec2c79189C6bB1FEe9293F9478103c9B9e'
  // What the wallet reports for a token send, whatever the code states:
  const tokenParse = { publicAddress, nativeAmount: '500000000', tokenId }

  it("names the chain's coin for an EIP-681 value", () => {
    expect(withStatedAsset(tokenParse, `ethereum:${payee}?value=5e8`)).toEqual({
      publicAddress,
      nativeAmount: '500000000',
      tokenId: null
    })
    expect(
      withStatedAsset(tokenParse, `  ethereum:pay-${payee}@1?value=500000000 `)
        .tokenId
    ).toBeNull()
  })

  it('leaves an amount written in the asset being sent', () => {
    expect(withStatedAsset(tokenParse, `ethereum:${payee}?amount=500`)).toBe(
      tokenParse
    )
  })

  it('leaves a token transfer code', () => {
    const contract = `0x${tokenId}`
    expect(
      withStatedAsset(
        tokenParse,
        `ethereum:${contract}@1/transfer?address=${payee}&uint256=5e8&value=1`
      )
    ).toBe(tokenParse)
  })

  it('leaves a bare address and a code with no amount', () => {
    const bare = { publicAddress, tokenId }
    expect(withStatedAsset(bare, payee)).toBe(bare)
    // A parser that ignores `value` reports no amount to correct:
    expect(withStatedAsset(bare, `tron:${payee}?value=5`)).toBe(bare)
  })
})

describe('getUriAmountSide', () => {
  const tokenId = 'dac17f958d2ee523a2206206994597c13d831ec7'
  const publicAddress = '0x1f36BF25aE6c07Ae5B6cB6BF6b0b13B1B4d1B372'
  const tokenToCoin = { sourceTokenId: tokenId, sameChainDestTokenId: null }

  it("sends a token parse's amount when the token is being sent", () => {
    const parsedUri = { publicAddress, nativeAmount: '5000000', tokenId }
    expect(
      getUriAmountSide({
        parsedUri,
        crossChainNativeAmount: undefined,
        ...tokenToCoin
      })
    ).toEqual({ side: 'send', nativeAmount: '5000000' })
  })

  it("receives a coin parse's amount when the coin is paid out", () => {
    const parsedUri = { publicAddress, nativeAmount: '5000000', tokenId: null }
    expect(
      getUriAmountSide({
        parsedUri,
        crossChainNativeAmount: undefined,
        ...tokenToCoin
      })
    ).toEqual({ side: 'receive', nativeAmount: '5000000' })
  })

  it('reads a parse naming no asset as the coin', () => {
    const parsedUri = { publicAddress, nativeAmount: '5000000' }
    expect(
      getUriAmountSide({
        parsedUri,
        crossChainNativeAmount: undefined,
        ...tokenToCoin
      })
    ).toEqual({ side: 'receive', nativeAmount: '5000000' })
  })

  it("receives a token parse's amount when that token is paid out", () => {
    const parsedUri = { publicAddress, nativeAmount: '5000000', tokenId }
    expect(
      getUriAmountSide({
        parsedUri,
        crossChainNativeAmount: undefined,
        sourceTokenId: null,
        sameChainDestTokenId: tokenId
      })
    ).toEqual({ side: 'receive', nativeAmount: '5000000' })
  })

  it('prices neither side for an asset neither side holds', () => {
    // A coin code read on a token send paying out another chain:
    const parsedUri = { publicAddress, nativeAmount: '5000000', tokenId: null }
    expect(
      getUriAmountSide({
        parsedUri,
        crossChainNativeAmount: undefined,
        sourceTokenId: tokenId,
        sameChainDestTokenId: undefined
      })
    ).toBeUndefined()
  })

  it('has no amount to place for a bare address', () => {
    expect(
      getUriAmountSide({
        parsedUri: { publicAddress, tokenId },
        crossChainNativeAmount: undefined,
        ...tokenToCoin
      })
    ).toBeUndefined()
  })

  it("receives a corrected coin code's amount as the coin's", () => {
    const parsedUri = withStatedAsset(
      { publicAddress, nativeAmount: '500000000', tokenId },
      `ethereum:${publicAddress}?value=5e8`
    )
    expect(
      getUriAmountSide({
        parsedUri,
        crossChainNativeAmount: undefined,
        ...tokenToCoin
      })
    ).toEqual({ side: 'receive', nativeAmount: '500000000' })
  })

  it("receives another chain's amount in that chain's coin", () => {
    // The destination chain's parser read the amount. The sending wallet's
    // parse carries only the address, whatever asset it names.
    const parsedUri = { publicAddress, nativeAmount: '5000000', tokenId }
    expect(
      getUriAmountSide({
        parsedUri,
        crossChainNativeAmount: '1000000000000000000',
        sourceTokenId: tokenId,
        sameChainDestTokenId: undefined
      })
    ).toEqual({ side: 'receive', nativeAmount: '1000000000000000000' })
  })
})

describe('findPayableChains', () => {
  const makeConfig = (accepts: boolean): EdgeCurrencyConfig => ({
    ...makeFakeCurrencyConfig({ pluginId: 'polygon', currencyCode: 'POL' }),
    parseUri: async (uri: string): Promise<EdgeParsedUri> => {
      if (!accepts) throw new Error('InvalidPublicAddressError')
      return { publicAddress: uri, nativeAmount: '5' }
    }
  })
  const configs: Record<string, EdgeCurrencyConfig> = {
    accepts: makeConfig(true),
    alsoAccepts: makeConfig(true),
    rejects: makeConfig(false)
  }
  const configOf = (chain: string): EdgeCurrencyConfig => configs[chain]

  it('keeps the chains whose parser accepts the text, in order', async () => {
    expect(
      await findPayableChains(
        ['alsoAccepts', 'rejects', 'accepts'],
        configOf,
        '0xabc'
      )
    ).toEqual([
      {
        chain: 'alsoAccepts',
        payment: { publicAddress: '0xabc', nativeAmount: '5' }
      },
      {
        chain: 'accepts',
        payment: { publicAddress: '0xabc', nativeAmount: '5' }
      }
    ])
  })

  it('finds none when every chain parser rejects the text', async () => {
    // A mistyped `0x` address fits each EVM pattern and passes no checksum.
    expect(
      await findPayableChains(['rejects', 'rejects'], configOf, '0xabc')
    ).toEqual([])
  })

  it('finds none with no chain to ask', async () => {
    expect(await findPayableChains([], configOf, '0xabc')).toEqual([])
  })
})
