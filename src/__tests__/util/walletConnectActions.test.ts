import { describe, expect, it } from '@jest/globals'

import { makeFakeCurrencyConfig } from '../../util/fake/fakeCurrencyConfig'
import {
  asWcRequestDescription,
  describeWcAction,
  getWcRisks,
  type WcAction
} from '../../util/walletConnectActions'

const WALLET = '0xCb563b7B20eaD56c1Be5AA733164D34D4617EAB7'
const OTHER = '0x52908400098527886E0F7030069857D2E4169EE7'
const SPENDER = '0xDe709F2102306220921060314715629080e2fB77'
const USDC = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
const USDC_TOKEN_ID = 'a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'
const DAI = '0x6B175474E89094C44Da98b954EedeAC495271d0F'
const NFT = '0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D'

const currencyConfig = makeFakeCurrencyConfig(
  {
    pluginId: 'ethereum',
    currencyCode: 'ETH',
    denominations: [{ multiplier: '1000000000000000000', name: 'ETH' }]
  },
  {
    [USDC_TOKEN_ID]: {
      currencyCode: 'USDC',
      denominations: [{ multiplier: '1000000', name: 'USDC' }],
      displayName: 'USD Coin',
      networkLocation: { contractAddress: USDC }
    }
  }
)
const opts = { currencyConfig, walletAddress: WALLET }

const makeApprove = (
  fields: Partial<Extract<WcAction, { type: 'approve' }>>
): WcAction => ({
  type: 'approve',
  contractAddress: USDC,
  tokenId: USDC_TOKEN_ID,
  owner: WALLET,
  spender: SPENDER,
  nativeAmount: '2500000',
  unlimited: false,
  expiration: undefined,
  oneTime: false,
  ...fields
})

const makeSignIn = (
  domain: string,
  fields: Partial<Extract<WcAction, { type: 'signIn' }>> = {}
): WcAction => ({
  type: 'signIn',
  domain,
  address: WALLET,
  statement: undefined,
  uri: `https://${domain}`,
  chainId: '1',
  expirationTime: undefined,
  ...fields
})

describe('asWcRequestDescription', () => {
  it('accepts a payload with no description', () => {
    expect(
      asWcRequestDescription({ nativeAmount: '0', networkFee: '0' })
    ).toEqual({ actions: undefined, warnings: undefined, details: undefined })
  })

  it('accepts what the plugin sends once it crosses the bridge', () => {
    // JSON drops the plugin's undefined fields:
    const clean = asWcRequestDescription(
      JSON.parse(
        JSON.stringify({
          actions: [
            { type: 'signText', text: 'Hi' },
            { type: 'signBytes', hex: '0xff', byteLength: 1 },
            {
              type: 'signIn',
              domain: 'a.example',
              address: WALLET,
              uri: 'u',
              chainId: '1'
            },
            {
              type: 'approve',
              contractAddress: DAI,
              spender: SPENDER,
              nativeAmount: '1',
              unlimited: false
            },
            {
              type: 'transfer',
              contractAddress: USDC,
              tokenId: USDC_TOKEN_ID,
              from: WALLET,
              to: OTHER,
              nativeAmount: '1'
            },
            { type: 'signTypedData', primaryType: 'Mail' },
            { type: 'transfer', from: WALLET, to: OTHER, nativeAmount: '1' },
            {
              type: 'approveAll',
              contractAddress: NFT,
              operator: SPENDER,
              approved: true
            },
            {
              type: 'contractCall',
              contractAddress: OTHER,
              selector: '0x49404b7c',
              nativeAmount: '0'
            },
            { type: 'contractCall', nativeAmount: '0' }
          ],
          warnings: [
            { code: 'wrongChain', chainId: '137' },
            { code: 'wrongAddress', address: OTHER },
            { code: 'unreadable' },
            { code: 'truncated' }
          ],
          details: [{ title: 'Mail', rows: [{ name: 'to', value: OTHER }] }]
        })
      )
    )
    expect(clean.actions?.map(action => action.type)).toEqual([
      'signText',
      'signBytes',
      'signIn',
      'approve',
      'transfer',
      'signTypedData',
      'transfer',
      'approveAll',
      'contractCall',
      'contractCall'
    ])
    expect(clean.warnings?.length).toBe(4)
    expect(clean.details?.[0].rows).toEqual([{ name: 'to', value: OTHER }])
  })

  it('rejects an action it would not know how to show', () => {
    expect(() =>
      asWcRequestDescription({ actions: [{ type: 'selfDestruct' }] })
    ).toThrow()
  })
})

describe('describeWcAction', () => {
  it('describes a text message', () => {
    expect(
      describeWcAction({ type: 'signText', text: 'Hi\nthere' }, opts)
    ).toEqual({ title: 'Message', body: 'Hi\nthere', isRisky: false })
  })

  it('describes unreadable data, and marks where it was cut', () => {
    expect(
      describeWcAction(
        { type: 'signBytes', hex: '0xfffe', byteLength: 2 },
        opts
      )
    ).toEqual({ title: 'Data', body: '0xfffe\n2 bytes', isRisky: true })
    expect(
      describeWcAction(
        { type: 'signBytes', hex: '0xfffe', byteLength: 300 },
        opts
      ).body
    ).toBe('0xfffe...\n300 bytes')
  })

  it('describes a sign-in', () => {
    expect(describeWcAction(makeSignIn('app.example.com'), opts)).toEqual({
      title: 'Sign-In',
      body: 'Sign in to app.example.com',
      isRisky: false
    })
    expect(
      describeWcAction(
        makeSignIn('app.example.com', {
          statement: 'Welcome back',
          expirationTime: '2026-10-06T12:00:00Z'
        }),
        opts
      ).body
    ).toBe(
      'Sign in to app.example.com\nWelcome back\nUntil Oct 6, 2026 5:00 AM'
    )
  })

  it('describes an allowance for a known token', () => {
    expect(describeWcAction(makeApprove({}), opts)).toEqual({
      title: 'Token Approval',
      body: 'Allow 0xDe70...e2fB77 to spend 2.5 USDC\nDoes not expire',
      isRisky: false
    })
  })

  it('marks an unlimited allowance as risky', () => {
    expect(describeWcAction(makeApprove({ unlimited: true }), opts)).toEqual({
      title: 'Token Approval',
      body: 'Allow 0xDe70...e2fB77 to spend unlimited USDC\nDoes not expire',
      isRisky: true
    })
  })

  it('shows when an allowance ends', () => {
    expect(
      describeWcAction(makeApprove({ expiration: 1793566113 }), opts).body
    ).toBe(
      'Allow 0xDe70...e2fB77 to spend 2.5 USDC\nUntil Nov 1, 2026 12:48 PM'
    )
    expect(
      describeWcAction(
        makeApprove({ expiration: 1793566113, oneTime: true }),
        opts
      ).body
    ).toBe(
      'Allow 0xDe70...e2fB77 to spend 2.5 USDC\nOne time only, until Nov 1, 2026 12:48 PM'
    )
    expect(describeWcAction(makeApprove({ oneTime: true }), opts).body).toBe(
      'Allow 0xDe70...e2fB77 to spend 2.5 USDC\nOne time only'
    )
  })

  it('shows an unknown token by its contract and raw amount', () => {
    const token = { contractAddress: DAI, tokenId: undefined }
    expect(describeWcAction(makeApprove(token), opts).body).toBe(
      'Allow 0xDe70...e2fB77 to spend 2,500,000 base units of token 0x6B17...271d0F\nDoes not expire'
    )
    expect(
      describeWcAction(makeApprove({ ...token, unlimited: true }), opts).body
    ).toBe(
      'Allow 0xDe70...e2fB77 to spend unlimited token 0x6B17...271d0F\nDoes not expire'
    )
  })

  it('describes a revoked allowance', () => {
    expect(describeWcAction(makeApprove({ nativeAmount: '0' }), opts)).toEqual({
      title: 'Token Approval',
      body: 'Stop 0xDe70...e2fB77 from spending USDC',
      isRisky: false
    })
  })

  it('describes a signed transfer', () => {
    const transfer: WcAction = {
      type: 'transfer',
      contractAddress: USDC,
      tokenId: USDC_TOKEN_ID,
      from: WALLET,
      to: OTHER,
      nativeAmount: '250000',
      expiration: 1793566113
    }
    expect(describeWcAction(transfer, opts)).toEqual({
      title: 'Token Transfer',
      body: '0.25 USDC to 0x5290...169EE7\nUntil Nov 1, 2026 12:48 PM',
      isRisky: false
    })
    // Another account's funds, sent to us:
    expect(
      describeWcAction({ ...transfer, from: OTHER, to: WALLET }, opts).body
    ).toBe(
      '0.25 USDC from 0x5290...169EE7 to this wallet\nUntil Nov 1, 2026 12:48 PM'
    )
  })

  it("describes a payment in the chain's own coin", () => {
    expect(
      describeWcAction(
        {
          type: 'transfer',
          contractAddress: undefined,
          tokenId: undefined,
          from: WALLET,
          to: OTHER,
          nativeAmount: '10000000000000000',
          expiration: undefined
        },
        opts
      )
    ).toEqual({
      title: 'Token Transfer',
      body: '0.01 ETH to 0x5290...169EE7',
      isRisky: false
    })
  })

  it('describes an approval for a whole NFT collection', () => {
    const approveAll: WcAction = {
      type: 'approveAll',
      contractAddress: NFT,
      operator: SPENDER,
      approved: true
    }
    expect(describeWcAction(approveAll, opts)).toEqual({
      title: 'NFT Collection Approval',
      body: 'Allow 0xDe70...e2fB77 to move every NFT in 0xBC4C...36f13D',
      isRisky: true
    })
    expect(describeWcAction({ ...approveAll, approved: false }, opts)).toEqual({
      title: 'NFT Collection Approval',
      body: 'Stop 0xDe70...e2fB77 from moving the NFTs in 0xBC4C...36f13D',
      isRisky: false
    })
  })

  it('describes a call it has no summary for', () => {
    const call: WcAction = {
      type: 'contractCall',
      contractAddress: OTHER,
      selector: '0x49404b7c',
      functionName: undefined,
      nativeAmount: '0'
    }
    expect(describeWcAction(call, opts)).toEqual({
      title: 'Contract Call',
      body: '0x49404b7c on 0x5290...169EE7',
      isRisky: false
    })
    expect(
      describeWcAction(
        {
          ...call,
          functionName: 'multicall',
          nativeAmount: '250000000000000000'
        },
        opts
      ).body
    ).toBe('multicall on 0x5290...169EE7\nSends 0.25 ETH')
    expect(describeWcAction({ ...call, selector: undefined }, opts).body).toBe(
      '0x5290...169EE7'
    )
    expect(
      describeWcAction(
        { ...call, contractAddress: undefined, selector: undefined },
        opts
      ).body
    ).toBe('Creates a new contract')
  })

  it('describes typed data it has no summary for', () => {
    expect(
      describeWcAction(
        {
          type: 'signTypedData',
          primaryType: 'Mail',
          domainName: 'Ether Mail',
          contractAddress: undefined
        },
        opts
      )
    ).toEqual({
      title: 'Typed Data',
      body: 'Mail for Ether Mail',
      isRisky: false
    })
    expect(
      describeWcAction(
        {
          type: 'signTypedData',
          primaryType: 'Mail',
          domainName: undefined,
          contractAddress: undefined
        },
        opts
      ).body
    ).toBe('Mail')
  })
})

describe('getWcRisks', () => {
  it('finds nothing in an ordinary request', () => {
    expect(getWcRisks([makeApprove({})], [], opts)).toEqual([])
  })

  it('spells out an unlimited allowance', () => {
    expect(getWcRisks([makeApprove({ unlimited: true })], [], opts)).toEqual([
      'This lets 0xDe70...e2fB77 spend all of your USDC, now and in the future'
    ])
  })

  it('spells out an approval for a whole NFT collection', () => {
    const approveAll: WcAction = {
      type: 'approveAll',
      contractAddress: NFT,
      operator: SPENDER,
      approved: true
    }
    expect(getWcRisks([approveAll], [], opts)).toEqual([
      'This lets 0xDe70...e2fB77 take every NFT you hold in collection 0xBC4C...36f13D'
    ])
    expect(getWcRisks([{ ...approveAll, approved: false }], [], opts)).toEqual(
      []
    )
  })

  it('explains each plugin warning', () => {
    expect(
      getWcRisks(
        [],
        [
          { code: 'wrongChain', chainId: '137' },
          { code: 'wrongAddress', address: OTHER },
          { code: 'unreadable' },
          { code: 'truncated' }
        ],
        opts
      )
    ).toEqual([
      'This request is for another network (chain 137)',
      'This request names another account: 0x5290...169EE7',
      'Edge cannot read this data. Signing it could approve something you cannot see',
      'This request is too large to show in full'
    ])
  })

  it('accepts a sign-in for the site that asked', () => {
    const origins = [
      'https://opensea.io',
      'https://OpenSea.io/collection?x=1',
      'https://user@opensea.io#top'
    ]
    for (const dAppOrigin of origins) {
      expect(
        getWcRisks([makeSignIn('opensea.io')], [], { ...opts, dAppOrigin })
      ).toEqual([])
    }
    expect(
      getWcRisks([makeSignIn('localhost:3000')], [], {
        ...opts,
        dAppOrigin: 'http://localhost:3000'
      })
    ).toEqual([])
  })

  it('warns about a sign-in for any other site', () => {
    const origins: Array<[string, string]> = [
      ['https://free-nfts.example', 'free-nfts.example'],
      ['https://opensea.io.evil.example/', 'opensea.io.evil.example'],
      // The user name in front is not the host:
      ['https://opensea.io@evil.example/', 'evil.example'],
      ['https://opensea.io:8443', 'opensea.io:8443']
    ]
    for (const [dAppOrigin, host] of origins) {
      expect(
        getWcRisks([makeSignIn('opensea.io')], [], { ...opts, dAppOrigin })
      ).toEqual([
        `This sign-in is for opensea.io, but the request came from ${host}`
      ])
    }
  })

  it('cannot check a sign-in without knowing who asked', () => {
    expect(getWcRisks([makeSignIn('opensea.io')], [], opts)).toEqual([])
    expect(
      getWcRisks([makeSignIn('opensea.io')], [], {
        ...opts,
        dAppOrigin: 'not a url'
      })
    ).toEqual([])
  })
})
