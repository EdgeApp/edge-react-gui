import { afterEach, describe, expect, it, jest } from '@jest/globals'
import type { EdgeCurrencyWallet } from 'edge-core-js'

import { FiatProviderError } from '../../../plugins/gui/fiatProviderTypes'
import {
  checkLimits,
  moneygramRampPlugin,
  pickAmount
} from '../../../plugins/ramps/moneygram/moneygramRampPlugin'
import { loadOpenTransfers } from '../../../plugins/ramps/moneygram/moneygramStore'
import { toEdgeMemo } from '../../../plugins/ramps/moneygram/moneygramTransfer'
import type {
  AnchorEndpoints,
  MoneygramTransfer
} from '../../../plugins/ramps/moneygram/moneygramTypes'
import {
  asAnchorToml,
  parseStellarToml
} from '../../../plugins/ramps/moneygram/sep1'
import { fetchWithSep10 } from '../../../plugins/ramps/moneygram/sep10'
import { isTerminalStatus } from '../../../plugins/ramps/moneygram/sep24Api'
import type { RampPluginConfig } from '../../../plugins/ramps/rampPluginTypes'
import type { RampPluginStore } from '../../../plugins/ramps/utils/createStore'

jest.mock('../../../components/services/AirshipInstance', () => ({
  ...jest.requireActual<object>('../../../components/services/AirshipInstance'),
  showError: jest.fn(),
  showToast: jest.fn()
}))

const TESTNET = 'Test SDF Network ; September 2015'
const ANCHOR: AnchorEndpoints = {
  homeDomain: 'testanchor.stellar.org',
  signingKey: 'GCHLHDBOKG2JWMJQBTLSL5XG6NO7ESXI2TAQKZXCXWXB5WI2X6W233PR',
  transferServerSep24: 'https://testanchor.stellar.org/sep24',
  webAuthEndpoint: 'https://testanchor.stellar.org/auth'
}
const ACCOUNT = 'GAMYLWB5BQWUZZ3LG4T34XWOEJ7JRUPOEW5UJSVHBMVOMTDEMOH4JA3W'

const STELLAR_TOML = `
# Test anchor
NETWORK_PASSPHRASE="${TESTNET}"
SIGNING_KEY="${ANCHOR.signingKey}"
WEB_AUTH_ENDPOINT="${ANCHOR.webAuthEndpoint}"
TRANSFER_SERVER_SEP0024='${ANCHOR.transferServerSep24}/' # trailing slash
ACCOUNTS=["${ACCOUNT}"]

[DOCUMENTATION]
ORG_NAME="Stellar Development Foundation"
SIGNING_KEY="not a top-level key"
`

const realFetch = global.fetch

afterEach(() => {
  global.fetch = realFetch
})

interface FakeResponse {
  status?: number
  json?: unknown
  text?: string
}

const response = ({ status = 200, json, text }: FakeResponse): Response =>
  ({
    ok: status >= 200 && status < 300,
    status,
    json: async () => json,
    text: async () => text ?? JSON.stringify(json)
  } as unknown as Response)

const makeWallet = (
  id: string,
  pluginId = 'stellartestnet'
): {
  wallet: EdgeCurrencyWallet
  signSep10Challenge: jest.Mock<(...args: unknown[]) => Promise<string>>
} => {
  const signSep10Challenge = jest.fn(
    async (...args: unknown[]) => `signed:${String(args[0])}`
  )
  const wallet = {
    id,
    currencyInfo: { pluginId, currencyCode: 'XLM' },
    getAddresses: async () => [
      { addressType: 'publicAddress', publicAddress: ACCOUNT }
    ],
    otherMethods: { signSep10Challenge }
  } as unknown as EdgeCurrencyWallet
  return { wallet, signSep10Challenge }
}

const makeTransfer = (id: string, status: string): MoneygramTransfer => ({
  id,
  direction: 'sell',
  walletId: 'wallet-id',
  tokenId: null,
  assetCode: 'native',
  fiatCurrencyCode: 'USD',
  status,
  createdAt: '2026-11-06T00:00:00.000Z',
  sendTxid: undefined,
  taggedTxid: undefined,
  anchor: ANCHOR
})

describe('SEP-1 stellar.toml', () => {
  it('reads top-level keys and stops at the first table', () => {
    const fields = parseStellarToml(STELLAR_TOML)
    expect(fields.SIGNING_KEY).toBe(ANCHOR.signingKey)
    expect(fields.NETWORK_PASSPHRASE).toBe(TESTNET)
    expect(fields.TRANSFER_SERVER_SEP0024).toBe(
      `${ANCHOR.transferServerSep24}/`
    )
    // Arrays are not strings, and section keys are out of scope:
    expect(fields.ACCOUNTS).toBeUndefined()
    expect(fields.ORG_NAME).toBeUndefined()
  })

  it('picks the anchor endpoints without a trailing slash', () => {
    const toml = asAnchorToml(parseStellarToml(STELLAR_TOML), ANCHOR.homeDomain)
    expect(toml).toEqual({
      networkPassphrase: TESTNET,
      signingKey: ANCHOR.signingKey,
      transferServerSep24: ANCHOR.transferServerSep24,
      webAuthEndpoint: ANCHOR.webAuthEndpoint
    })
  })

  it('rejects a stellar.toml without a SEP-10 signing key', () => {
    const fields = parseStellarToml(STELLAR_TOML)
    delete fields.SIGNING_KEY
    expect(() => asAnchorToml(fields, ANCHOR.homeDomain)).toThrow(
      'testanchor.stellar.org stellar.toml has no SIGNING_KEY'
    )
  })
})

describe('SEP-10 fetchWithSep10', () => {
  const challengeUrl = `${ANCHOR.webAuthEndpoint}?account=${ACCOUNT}&home_domain=${ANCHOR.homeDomain}`
  const resourceUrl = `${ANCHOR.transferServerSep24}/transaction?id=abc`

  it('signs the challenge with the wallet and sends the JWT', async () => {
    const { wallet, signSep10Challenge } = makeWallet('sep10-first')
    const calls: Array<{ url: string; init?: RequestInit }> = []
    global.fetch = jest.fn(async (url: string, init?: RequestInit) => {
      calls.push({ url, init })
      if (url === challengeUrl) {
        return response({ json: { transaction: 'challenge-xdr' } })
      }
      if (url === ANCHOR.webAuthEndpoint) {
        return response({ json: { token: 'jwt-1' } })
      }
      return response({ json: { ok: true } })
    }) as unknown as typeof fetch

    const result = await fetchWithSep10(wallet, ANCHOR, resourceUrl)
    expect(result.status).toBe(200)

    expect(signSep10Challenge).toHaveBeenCalledWith('challenge-xdr', {
      homeDomain: ANCHOR.homeDomain,
      webAuthDomain: 'testanchor.stellar.org',
      serverSigningKey: ANCHOR.signingKey
    })
    expect(JSON.parse(calls[1].init?.body as string)).toEqual({
      transaction: 'signed:challenge-xdr'
    })
    expect(calls[2].url).toBe(resourceUrl)
    expect(calls[2].init?.headers).toEqual({ Authorization: 'Bearer jwt-1' })

    // A second request reuses the cached JWT:
    await fetchWithSep10(wallet, ANCHOR, resourceUrl)
    expect(signSep10Challenge).toHaveBeenCalledTimes(1)
    expect(calls).toHaveLength(4)
  })

  it('logs in again once when the anchor answers 401', async () => {
    const { wallet, signSep10Challenge } = makeWallet('sep10-expired')
    let tokens = 0
    const authHeaders: string[] = []
    global.fetch = jest.fn(async (url: string, init?: RequestInit) => {
      if (url === challengeUrl) {
        return response({ json: { transaction: 'challenge-xdr' } })
      }
      if (url === ANCHOR.webAuthEndpoint) {
        return response({ json: { token: `jwt-${++tokens}` } })
      }
      const auth = (init?.headers as Record<string, string>).Authorization
      authHeaders.push(auth)
      return response({ status: auth === 'Bearer jwt-1' ? 401 : 200, json: {} })
    }) as unknown as typeof fetch

    const result = await fetchWithSep10(wallet, ANCHOR, resourceUrl)
    expect(result.status).toBe(200)
    expect(authHeaders).toEqual(['Bearer jwt-1', 'Bearer jwt-2'])
    expect(signSep10Challenge).toHaveBeenCalledTimes(2)
  })

  it('does not cache a failed login', async () => {
    const { wallet, signSep10Challenge } = makeWallet('sep10-failed')
    let challengeStatus = 500
    global.fetch = jest.fn(async (url: string) => {
      if (url === challengeUrl) {
        return response({
          status: challengeStatus,
          json: { transaction: 'challenge-xdr' }
        })
      }
      if (url === ANCHOR.webAuthEndpoint) {
        return response({ json: { token: 'jwt-1' } })
      }
      return response({ json: {} })
    }) as unknown as typeof fetch

    await expect(fetchWithSep10(wallet, ANCHOR, resourceUrl)).rejects.toThrow(
      'SEP-10 challenge failed: 500'
    )
    challengeStatus = 200
    const result = await fetchWithSep10(wallet, ANCHOR, resourceUrl)
    expect(result.status).toBe(200)
    expect(signSep10Challenge).toHaveBeenCalledTimes(1)
  })

  it('keeps a separate JWT for each set of anchor endpoints', async () => {
    const { wallet, signSep10Challenge } = makeWallet('sep10-endpoints')
    const otherAnchor: AnchorEndpoints = {
      ...ANCHOR,
      transferServerSep24: 'https://other.example.com/sep24'
    }
    let tokens = 0
    const authHeaders: string[] = []
    global.fetch = jest.fn(async (url: string, init?: RequestInit) => {
      if (url === challengeUrl) {
        return response({ json: { transaction: 'challenge-xdr' } })
      }
      if (url === ANCHOR.webAuthEndpoint) {
        return response({ json: { token: `jwt-${++tokens}` } })
      }
      authHeaders.push((init?.headers as Record<string, string>).Authorization)
      return response({ json: {} })
    }) as unknown as typeof fetch

    await fetchWithSep10(wallet, ANCHOR, resourceUrl)
    await fetchWithSep10(
      wallet,
      otherAnchor,
      `${otherAnchor.transferServerSep24}/transaction?id=abc`
    )
    expect(authHeaders).toEqual(['Bearer jwt-1', 'Bearer jwt-2'])
    expect(signSep10Challenge).toHaveBeenCalledTimes(2)
  })

  it('surfaces a challenge the engine refuses to sign', async () => {
    const { wallet, signSep10Challenge } = makeWallet('sep10-refused')
    signSep10Challenge.mockRejectedValue(
      new Error('SEP-10 challenge is for a different account')
    )
    global.fetch = jest.fn(async () =>
      response({ json: { transaction: 'challenge-xdr' } })
    ) as unknown as typeof fetch

    await expect(fetchWithSep10(wallet, ANCHOR, resourceUrl)).rejects.toThrow(
      'SEP-10 challenge is for a different account'
    )
  })
})

describe('SEP-24 statuses', () => {
  it('treats only final anchor statuses as terminal', () => {
    for (const status of ['completed', 'refunded', 'expired', 'error']) {
      expect(isTerminalStatus(status)).toBe(true)
    }
    for (const status of [
      'incomplete',
      'pending_user_transfer_start',
      'pending_anchor',
      'pending_stellar'
    ]) {
      expect(isTerminalStatus(status)).toBe(false)
    }
  })
})

describe('MoneyGram withdraw memos', () => {
  it('converts withdraw memos for the Stellar engine', () => {
    expect(toEdgeMemo('12345', 'id')).toEqual({
      type: 'number',
      memoName: 'memo_id',
      value: '12345'
    })
    expect(toEdgeMemo('cash out', 'text')).toEqual({
      type: 'text',
      memoName: 'memo_text',
      value: 'cash out'
    })
    expect(toEdgeMemo('cash out', undefined).type).toBe('text')
    // SEP-24 sends hash memos as base64:
    expect(toEdgeMemo('3q2+7w==', 'hash')).toEqual({
      type: 'hex',
      memoName: 'memo_hash',
      value: 'deadbeef'
    })
  })
})

describe('MoneyGram amounts and limits', () => {
  const limits = { enabled: true, min_amount: 1, max_amount: 10 }

  it('picks the amount to send the anchor', () => {
    expect(pickAmount({ exchangeAmount: '2.5' }, limits)).toBe('2.5')
    expect(pickAmount({ maxExchangeAmount: '4' }, limits)).toBe('4')
    expect(pickAmount({ maxExchangeAmount: '25' }, limits)).toBe('10')
    expect(pickAmount({ max: true }, limits)).toBe('10')
    expect(
      pickAmount(
        { max: true },
        { enabled: true, min_amount: undefined, max_amount: 1e-7 }
      )
    ).toBe('0.0000001')
    expect(() =>
      pickAmount(
        { max: true },
        { enabled: true, min_amount: undefined, max_amount: undefined }
      )
    ).toThrow('MoneyGram has no maximum amount for this asset')
  })

  it('throws the quote limit errors from /info', () => {
    const quoteError = (amount: string): unknown => {
      try {
        checkLimits(amount, limits, 'XLM')
      } catch (error: unknown) {
        return error instanceof FiatProviderError ? error.quoteError : error
      }
    }
    expect(quoteError('0.5')).toEqual({
      providerId: 'moneygram',
      errorType: 'underLimit',
      errorAmount: 1,
      displayCurrencyCode: 'XLM'
    })
    expect(quoteError('10.0000001')).toEqual({
      providerId: 'moneygram',
      errorType: 'overLimit',
      errorAmount: 10,
      displayCurrencyCode: 'XLM'
    })
    expect(quoteError('1')).toBeUndefined()
    expect(quoteError('10')).toBeUndefined()
  })
})

describe('MoneyGram transfer store', () => {
  it('loads unfinished transfers and untagged deposits', async () => {
    const items: Record<string, string> = {
      waiting: JSON.stringify(
        makeTransfer('waiting', 'pending_user_transfer_start')
      ),
      done: JSON.stringify(makeTransfer('done', 'completed')),
      refunded: JSON.stringify(makeTransfer('refunded', 'refunded')),
      untagged: JSON.stringify({
        ...makeTransfer('untagged', 'completed'),
        direction: 'buy'
      }),
      tagged: JSON.stringify({
        ...makeTransfer('tagged', 'completed'),
        direction: 'buy',
        taggedTxid: 'txid'
      }),
      garbled: '{not json',
      wrongShape: JSON.stringify({ id: 'wrongShape' })
    }
    const store: RampPluginStore = {
      deleteItem: async () => {},
      listItemIds: async () => Object.keys(items),
      getItem: async (id: string) => items[id],
      setItem: async () => {}
    }
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {})

    const transfers = await loadOpenTransfers(store)
    expect(transfers.map(transfer => transfer.id)).toEqual([
      'waiting',
      'untagged'
    ])
    expect(warn).toHaveBeenCalledTimes(2)
    warn.mockRestore()
  })
})

describe('moneygramRampPlugin checkSupport', () => {
  const makePlugin = (
    withdrawEnabled: boolean
  ): ReturnType<typeof moneygramRampPlugin> => {
    global.fetch = jest.fn(async (url: string) => {
      if (url === 'https://testanchor.stellar.org/.well-known/stellar.toml') {
        return response({ text: STELLAR_TOML })
      }
      if (url === `${ANCHOR.transferServerSep24}/info`) {
        return response({
          json: {
            deposit: {
              native: { enabled: true, min_amount: 1, max_amount: 10 }
            },
            withdraw: { native: { enabled: withdrawEnabled } }
          }
        })
      }
      return response({ status: 404, json: {} })
    }) as unknown as typeof fetch

    return moneygramRampPlugin({
      initOptions: {},
      store: {} as unknown as RampPluginStore,
      account: {},
      navigation: {},
      onLogEvent: () => {},
      disklet: {}
    } as unknown as RampPluginConfig)
  }

  const request = (
    pluginId: string,
    tokenId: string | null,
    direction: 'buy' | 'sell'
  ): Parameters<ReturnType<typeof moneygramRampPlugin>['checkSupport']>[0] => ({
    direction,
    regionCode: { countryCode: 'US' },
    fiatAsset: { currencyCode: 'USD' },
    cryptoAsset: { pluginId, tokenId }
  })

  it('supports native XLM on the network the anchor runs on', async () => {
    const plugin = makePlugin(true)
    expect(
      await plugin.checkSupport(request('stellartestnet', null, 'buy'))
    ).toEqual({ supported: true, supportedAmountTypes: ['crypto'] })
    expect(
      await plugin.checkSupport(request('stellartestnet', null, 'sell'))
    ).toEqual({ supported: true, supportedAmountTypes: ['crypto'] })
  })

  it('rejects other networks, tokens, and disabled directions', async () => {
    const plugin = makePlugin(false)
    // The test anchor runs on testnet, so mainnet XLM is unsupported:
    expect(await plugin.checkSupport(request('stellar', null, 'buy'))).toEqual({
      supported: false
    })
    expect(
      await plugin.checkSupport(request('stellartestnet', 'USDC-GA5Z', 'buy'))
    ).toEqual({ supported: false })
    expect(await plugin.checkSupport(request('ethereum', null, 'buy'))).toEqual(
      { supported: false }
    )
    expect(
      await plugin.checkSupport(request('stellartestnet', null, 'sell'))
    ).toEqual({ supported: false })
  })
})
