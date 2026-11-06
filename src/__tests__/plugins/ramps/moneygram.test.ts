import { afterEach, describe, expect, it, jest } from '@jest/globals'
import type { EdgeCurrencyWallet } from 'edge-core-js'

import type { AnchorEndpoints } from '../../../plugins/ramps/moneygram/moneygramTypes'
import {
  asAnchorToml,
  parseStellarToml
} from '../../../plugins/ramps/moneygram/sep1'
import { fetchWithSep10 } from '../../../plugins/ramps/moneygram/sep10'
import { isTerminalStatus } from '../../../plugins/ramps/moneygram/sep24Api'

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
