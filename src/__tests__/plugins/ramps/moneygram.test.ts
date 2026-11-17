import { afterEach, describe, expect, it, jest } from '@jest/globals'
import type {
  EdgeAccount,
  EdgeActivationQuote,
  EdgeCurrencyWallet,
  EdgeTokenMap
} from 'edge-core-js'

import { showButtonsModal } from '../../../components/modals/ButtonsModal'
import { FiatProviderError } from '../../../plugins/gui/fiatProviderTypes'
import {
  checkLimits,
  findAnchorAsset,
  moneygramRampPlugin,
  pickAmount
} from '../../../plugins/ramps/moneygram/moneygramRampPlugin'
import { loadOpenTransfers } from '../../../plugins/ramps/moneygram/moneygramStore'
import {
  findSentPayment,
  hasPaymentInstructions,
  toEdgeMemo,
  type TransferContext,
  watchTransfer
} from '../../../plugins/ramps/moneygram/moneygramTransfer'
import { activateTokenForDeposit } from '../../../plugins/ramps/moneygram/moneygramTrustline'
import type {
  AnchorEndpoints,
  MoneygramTransfer,
  Sep24Transaction
} from '../../../plugins/ramps/moneygram/moneygramTypes'
import {
  asAnchorToml,
  parseStellarToml,
  parseTomlCurrencies
} from '../../../plugins/ramps/moneygram/sep1'
import { fetchWithSep10 } from '../../../plugins/ramps/moneygram/sep10'
import {
  isTerminalStatus,
  makeSep24Api
} from '../../../plugins/ramps/moneygram/sep24Api'
import type { RampPluginConfig } from '../../../plugins/ramps/rampPluginTypes'
import type { RampPluginStore } from '../../../plugins/ramps/utils/createStore'
import { rampQuoteHasAmounts } from '../../../plugins/ramps/utils/rampQuotePriority'

jest.mock('../../../components/modals/ButtonsModal', () => ({
  showButtonsModal: jest.fn()
}))

jest.mock('../../../components/services/AirshipInstance', () => ({
  ...jest.requireActual<object>('../../../components/services/AirshipInstance'),
  showError: jest.fn(),
  showToast: jest.fn()
}))

jest.mock('../../../plugins/ramps/moneygram/sep24Api', () => {
  const actual = jest.requireActual<{ makeSep24Api: typeof makeSep24Api }>(
    '../../../plugins/ramps/moneygram/sep24Api'
  )
  return { ...actual, makeSep24Api: jest.fn(actual.makeSep24Api) }
})

jest.mock('../../../util/utils', () => ({
  ...jest.requireActual<object>('../../../util/utils'),
  snooze: async () => {}
}))

jest.mock('../../../util/waitForWalletOtherMethods', () => ({
  waitForWalletOtherMethods: async () => {}
}))

const TESTNET = 'Test SDF Network ; September 2015'
const ANCHOR: AnchorEndpoints = {
  homeDomain: 'testanchor.stellar.org',
  signingKey: 'GCHLHDBOKG2JWMJQBTLSL5XG6NO7ESXI2TAQKZXCXWXB5WI2X6W233PR',
  transferServerSep24: 'https://testanchor.stellar.org/sep24',
  webAuthEndpoint: 'https://testanchor.stellar.org/auth'
}
const ACCOUNT = 'GAMYLWB5BQWUZZ3LG4T34XWOEJ7JRUPOEW5UJSVHBMVOMTDEMOH4JA3W'
const USDC_ISSUER = 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5'
const OTHER_ISSUER = 'GCDNJUBQSX7AJWLJACMJ7I4BC3Z47BQUTMHEICZLE6MU4KQBRYG5JY6B'
const USDC_TOKEN_ID = `USDC-${USDC_ISSUER}`
const FAKE_USDC_TOKEN_ID = `USDC-${OTHER_ISSUER}`

const TOKENS: EdgeTokenMap = {
  [USDC_TOKEN_ID]: {
    currencyCode: 'USDC',
    displayName: 'USD Coin',
    denominations: [{ name: 'USDC', multiplier: '10000000' }],
    networkLocation: { code: 'USDC', issuer: USDC_ISSUER }
  },
  [FAKE_USDC_TOKEN_ID]: {
    currencyCode: 'USDC',
    displayName: 'Look-alike USDC',
    denominations: [{ name: 'USDC', multiplier: '10000000' }],
    networkLocation: { code: 'USDC', issuer: OTHER_ISSUER }
  }
}

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

[[CURRENCIES]]
code = "USDC"
issuer = "${USDC_ISSUER}" # Circle test USDC
status = "test"

[[CURRENCIES]]
code = "native"
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

  it('reads the code and issuer of each listed currency', () => {
    expect(parseTomlCurrencies(STELLAR_TOML)).toEqual([
      { code: 'USDC', issuer: USDC_ISSUER },
      { code: 'native', issuer: undefined }
    ])
  })

  it('picks the anchor endpoints without a trailing slash', () => {
    const toml = asAnchorToml(
      parseStellarToml(STELLAR_TOML),
      parseTomlCurrencies(STELLAR_TOML),
      ANCHOR.homeDomain
    )
    expect(toml).toEqual({
      currencies: [
        { code: 'USDC', issuer: USDC_ISSUER },
        { code: 'native', issuer: undefined }
      ],
      networkPassphrase: TESTNET,
      signingKey: ANCHOR.signingKey,
      transferServerSep24: ANCHOR.transferServerSep24,
      webAuthEndpoint: ANCHOR.webAuthEndpoint
    })
  })

  it('rejects login or transfer servers off the home domain', () => {
    for (const [key, value] of [
      ['TRANSFER_SERVER_SEP0024', 'https://evil.example.com/sep24'],
      ['TRANSFER_SERVER_SEP0024', 'http://testanchor.stellar.org/sep24'],
      ['WEB_AUTH_ENDPOINT', 'https://stellar.org/auth']
    ]) {
      const fields = { ...parseStellarToml(STELLAR_TOML), [key]: value }
      expect(() => asAnchorToml(fields, [], ANCHOR.homeDomain)).toThrow(
        `testanchor.stellar.org stellar.toml ${key} is not on the domain`
      )
    }
  })

  it('rejects a stellar.toml without a SEP-10 signing key', () => {
    const fields = parseStellarToml(STELLAR_TOML)
    delete fields.SIGNING_KEY
    expect(() => asAnchorToml(fields, [], ANCHOR.homeDomain)).toThrow(
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

describe('MoneyGram withdraw payments', () => {
  const pending: Sep24Transaction = {
    id: 'withdraw-1',
    kind: 'withdrawal',
    status: 'pending_user_transfer_start',
    amount_in: '5',
    amount_out: undefined,
    message: undefined,
    more_info_url: undefined,
    stellar_transaction_id: undefined,
    withdraw_anchor_account: ACCOUNT,
    withdraw_memo: '9191312236600194934',
    withdraw_memo_type: 'id'
  }

  it('waits for the amount, account and memo before paying', () => {
    expect(hasPaymentInstructions(pending)).toBe(true)
    expect(
      hasPaymentInstructions({ ...pending, withdraw_memo: undefined })
    ).toBe(false)
    expect(
      hasPaymentInstructions({ ...pending, withdraw_anchor_account: undefined })
    ).toBe(false)
    expect(hasPaymentInstructions({ ...pending, amount_in: undefined })).toBe(
      false
    )
  })

  it('finds a payment the wallet already sent for the transfer', async () => {
    const fiatAction = (orderId: string, providerId = 'moneygram'): object => ({
      actionType: 'fiat',
      orderId,
      fiatPlugin: { providerId, providerDisplayName: 'Some ramp' }
    })
    const getTransactions = jest.fn(async () => [
      { txid: 'plain-send' },
      { txid: 'other-ramp', savedAction: fiatAction('withdraw-1', 'paybis') },
      { txid: 'other-order', savedAction: fiatAction('withdraw-0') },
      { txid: 'paid', savedAction: fiatAction('withdraw-1') }
    ])
    const wallet = { getTransactions } as unknown as EdgeCurrencyWallet

    expect(
      await findSentPayment(wallet, makeTransfer('withdraw-1', 'pending'))
    ).toBe('paid')
    expect(
      await findSentPayment(wallet, makeTransfer('withdraw-2', 'pending'))
    ).toBeUndefined()
    expect(getTransactions).toHaveBeenCalledWith({ tokenId: null })
  })
})

describe('MoneyGram watchTransfer', () => {
  const pending: Sep24Transaction = {
    id: 'watch-1',
    kind: 'withdrawal',
    status: 'pending_user_transfer_start',
    amount_in: '5',
    amount_out: '4.5',
    message: undefined,
    more_info_url: undefined,
    stellar_transaction_id: undefined,
    withdraw_anchor_account: ACCOUNT,
    withdraw_memo: '9191312236600194934',
    withdraw_memo_type: 'id'
  }

  const setup = (
    statuses: Sep24Transaction[],
    getTransactions: () => Promise<unknown[]> = async () => [],
    initial: MoneygramTransfer = makeTransfer(
      'watch-1',
      'pending_user_transfer_start'
    )
  ): {
    account: { loggedIn: boolean }
    context: TransferContext
    navigate: jest.Mock<(name: string, params: any) => void>
    saveTxAction: jest.Mock<(action: unknown) => Promise<void>>
    saved: () => MoneygramTransfer
    run: () => Promise<void>
  } => {
    const getTransaction = jest.fn(async () => statuses.shift() ?? pending)
    jest
      .mocked(makeSep24Api)
      .mockReturnValueOnce({ getTransaction } as unknown as ReturnType<
        typeof makeSep24Api
      >)
    const saveTxAction = jest.fn(async (action: unknown) => {})
    const wallet = {
      id: 'wallet-id',
      currencyInfo: { pluginId: 'stellartestnet', currencyCode: 'XLM' },
      currencyConfig: {
        allTokens: {},
        currencyInfo: {
          pluginId: 'stellartestnet',
          denominations: [{ name: 'XLM', multiplier: '10000000' }]
        }
      },
      getTransactions,
      saveTxAction
    }
    const account = {
      loggedIn: true,
      activeWalletIds: ['wallet-id'],
      waitForCurrencyWallet: async () => wallet
    }
    const setItem = jest.fn(async (id: string, value: string) => {})
    const navigate = jest.fn<(name: string, params: any) => void>()
    const context = {
      account: account as unknown as EdgeAccount,
      navigation: { navigate } as unknown as RampPluginConfig['navigation'],
      onLogEvent: jest.fn(),
      store: { setItem } as unknown as RampPluginStore
    }
    return {
      account,
      context,
      navigate,
      saveTxAction,
      saved: () => JSON.parse(String(setItem.mock.calls.at(-1)?.[1])),
      run: async () => {
        await watchTransfer(context, initial, { askBeforeSend: () => false })
      }
    }
  }

  afterEach(() => {
    jest.mocked(showButtonsModal).mockReset()
  })

  it('asks again after a send that failed, then saves the txid', async () => {
    const { navigate, run, saved } = setup([
      pending,
      pending,
      { ...pending, status: 'completed' }
    ])
    navigate
      .mockImplementationOnce((name, params) => params.onDone(null))
      .mockImplementationOnce((name, params) =>
        params.onDone(null, { txid: 'paid-txid' })
      )
    jest.mocked(showButtonsModal).mockResolvedValue('send')

    await run()

    expect(navigate).toHaveBeenCalledTimes(2)
    expect(showButtonsModal).toHaveBeenCalledTimes(1)
    expect(navigate.mock.calls[1][1].lockTilesMap).toEqual({
      address: true,
      amount: true,
      memo: true,
      wallet: true
    })
    expect(navigate.mock.calls[1][1].spendInfo.memos).toEqual([
      { type: 'number', memoName: 'memo_id', value: '9191312236600194934' }
    ])
    expect(saved()).toMatchObject({
      sendTxid: 'paid-txid',
      status: 'completed'
    })
  })

  it('lets withdraws resumed together take turns at the send scene', async () => {
    const { context, navigate } = setup([
      pending,
      { ...pending, status: 'completed' }
    ])
    const second: Sep24Transaction[] = [
      { ...pending, id: 'watch-2' },
      { ...pending, id: 'watch-2', status: 'completed' }
    ]
    jest.mocked(makeSep24Api).mockReturnValueOnce({
      getTransaction: async () => second.shift() ?? second[0]
    } as unknown as ReturnType<typeof makeSep24Api>)
    // Timers are fake here, so let the watchers' promise chains settle:
    const flush = async (): Promise<void> => {
      for (let i = 0; i < 100; ++i) await Promise.resolve()
    }
    const askBeforeSend = (): boolean => false

    const watches = Promise.all([
      watchTransfer(
        context,
        makeTransfer('watch-1', 'pending_user_transfer_start'),
        { askBeforeSend }
      ),
      watchTransfer(
        context,
        makeTransfer('watch-2', 'pending_user_transfer_start'),
        { askBeforeSend }
      )
    ])
    await flush()
    // The second send waits until the first one's scene reports back:
    expect(navigate).toHaveBeenCalledTimes(1)

    navigate.mock.calls[0][1].onDone(null, { txid: 'paid-1' })
    await flush()
    expect(navigate).toHaveBeenCalledTimes(2)
    navigate.mock.calls[1][1].onDone(null, { txid: 'paid-2' })
    await watches

    expect(
      navigate.mock.calls.map(call => call[1].spendInfo.savedAction.orderId)
    ).toEqual(['watch-1', 'watch-2'])
  })

  it('opens nothing once the account logs out mid-poll', async () => {
    const holder: { account?: { loggedIn: boolean } } = {}
    const { account, navigate, run } = setup([pending], async () => {
      if (holder.account != null) holder.account.loggedIn = false
      return []
    })
    holder.account = account

    await run()

    expect(showButtonsModal).not.toHaveBeenCalled()
    expect(navigate).not.toHaveBeenCalled()
  })

  it('tags no deposit once the account logs out mid-tag', async () => {
    const holder: { account?: { loggedIn: boolean } } = {}
    const { account, run, saveTxAction } = setup(
      [
        {
          ...pending,
          kind: 'deposit',
          status: 'completed',
          stellar_transaction_id: 'deposit-txid'
        }
      ],
      async () => {
        if (holder.account != null) holder.account.loggedIn = false
        return [{ txid: 'deposit-txid', ourReceiveAddresses: [] }]
      },
      { ...makeTransfer('watch-1', 'completed'), direction: 'buy' }
    )
    holder.account = account

    await run()

    expect(saveTxAction).not.toHaveBeenCalled()
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
              native: { enabled: true, min_amount: 1, max_amount: 10 },
              USDC: { enabled: true, min_amount: 1, max_amount: 10 }
            },
            withdraw: {
              native: { enabled: withdrawEnabled },
              USDC: { enabled: withdrawEnabled }
            }
          }
        })
      }
      return response({ status: 404, json: {} })
    }) as unknown as typeof fetch

    return moneygramRampPlugin({
      initOptions: {},
      store: {} as unknown as RampPluginStore,
      account: { currencyConfig: { stellartestnet: { allTokens: TOKENS } } },
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

  it('supports a token the anchor lists from the same issuer', async () => {
    const plugin = makePlugin(true)
    expect(
      await plugin.checkSupport(request('stellartestnet', USDC_TOKEN_ID, 'buy'))
    ).toEqual({ supported: true, supportedAmountTypes: ['crypto'] })
    expect(
      await plugin.checkSupport(
        request('stellartestnet', FAKE_USDC_TOKEN_ID, 'buy')
      )
    ).toEqual({ supported: false })
  })

  it('quotes as an unpriced placeholder so ranking never sees a zero rate', async () => {
    const plugin = makePlugin(true)
    const quotes = await plugin.fetchQuotes({
      wallet: { currencyInfo: { pluginId: 'stellartestnet' } },
      tokenId: null,
      displayCurrencyCode: 'XLM',
      amountQuery: { exchangeAmount: '2.5' },
      fiatCurrencyCode: 'iso:USD',
      amountType: 'crypto',
      direction: 'buy',
      regionCode: { countryCode: 'US' }
    } as unknown as Parameters<typeof plugin.fetchQuotes>[0])
    expect(quotes).toHaveLength(1)
    expect(rampQuoteHasAmounts(quotes[0])).toBe(false)
    expect(quotes[0].specialQuoteRateMessage).toBeDefined()
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

describe('MoneyGram anchor assets', () => {
  const currencies = parseTomlCurrencies(STELLAR_TOML)

  it('maps XLM and listed tokens to the anchor code and issuer', () => {
    expect(findAnchorAsset(currencies, TOKENS, null)).toEqual({
      code: 'native'
    })
    expect(findAnchorAsset(currencies, TOKENS, USDC_TOKEN_ID)).toEqual({
      code: 'USDC',
      issuer: USDC_ISSUER
    })
  })

  it('skips tokens from another issuer or without a location', () => {
    expect(
      findAnchorAsset(currencies, TOKENS, FAKE_USDC_TOKEN_ID)
    ).toBeUndefined()
    expect(findAnchorAsset(currencies, TOKENS, 'missing')).toBeUndefined()
    expect(
      findAnchorAsset(
        currencies,
        { odd: { ...TOKENS[USDC_TOKEN_ID], networkLocation: undefined } },
        'odd'
      )
    ).toBeUndefined()
  })
})

describe('MoneyGram trustline activation', () => {
  const showModal = showButtonsModal as jest.Mock<
    (...args: unknown[]) => Promise<string | undefined>
  >

  const setup = (
    unactivatedTokenIds: string[]
  ): {
    account: EdgeAccount
    wallet: EdgeCurrencyWallet
    activateWallet: jest.Mock<(...args: unknown[]) => Promise<unknown>>
    approve: jest.Mock<(...args: unknown[]) => Promise<unknown>>
    close: jest.Mock<() => Promise<void>>
  } => {
    const approve = jest.fn(async (...args: unknown[]) => ({
      transactions: []
    }))
    const close = jest.fn(async () => {})
    const quote: Partial<EdgeActivationQuote> = {
      networkFee: {
        nativeAmount: '100',
        tokenId: null,
        currencyPluginId: 'stellartestnet'
      },
      approve,
      close
    }
    const activateWallet = jest.fn(async (...args: unknown[]) => quote)
    const account = { activateWallet } as unknown as EdgeAccount
    const wallet = {
      id: 'wallet-id',
      unactivatedTokenIds,
      currencyInfo: {
        pluginId: 'stellartestnet',
        currencyCode: 'XLM',
        denominations: [{ name: 'XLM', multiplier: '10000000' }]
      },
      currencyConfig: {
        allTokens: TOKENS,
        currencyInfo: {
          pluginId: 'stellartestnet',
          currencyCode: 'XLM',
          denominations: [{ name: 'XLM', multiplier: '10000000' }]
        }
      }
    } as unknown as EdgeCurrencyWallet
    return { account, wallet, activateWallet, approve, close }
  }

  afterEach(() => {
    showModal.mockReset()
  })

  it('skips a token the wallet already trusts', async () => {
    const { account, wallet, activateWallet } = setup([])
    expect(await activateTokenForDeposit(account, wallet, USDC_TOKEN_ID)).toBe(
      true
    )
    expect(activateWallet).not.toHaveBeenCalled()
    expect(showModal).not.toHaveBeenCalled()
  })

  it('opens the trustline once the user agrees to the fee', async () => {
    const { account, wallet, activateWallet, approve } = setup([USDC_TOKEN_ID])
    showModal.mockResolvedValue('activate')
    expect(await activateTokenForDeposit(account, wallet, USDC_TOKEN_ID)).toBe(
      true
    )
    expect(activateWallet).toHaveBeenCalledWith({
      activateWalletId: 'wallet-id',
      activateTokenIds: [USDC_TOKEN_ID],
      paymentInfo: { walletId: 'wallet-id', tokenId: null }
    })
    expect(showModal.mock.calls[0][0]).toMatchObject({
      message: expect.stringContaining('0.00001 XLM')
    })
    expect(approve).toHaveBeenCalledTimes(1)
  })

  it('closes the quote when the user declines', async () => {
    const { account, wallet, approve, close } = setup([USDC_TOKEN_ID])
    showModal.mockResolvedValue('cancel')
    expect(await activateTokenForDeposit(account, wallet, USDC_TOKEN_ID)).toBe(
      false
    )
    expect(approve).not.toHaveBeenCalled()
    expect(close).toHaveBeenCalledTimes(1)
  })

  it('closes the quote when the activation fails', async () => {
    const { account, wallet, approve, close } = setup([USDC_TOKEN_ID])
    showModal.mockResolvedValue('activate')
    approve.mockRejectedValueOnce(new Error('broadcast failed'))
    await expect(
      activateTokenForDeposit(account, wallet, USDC_TOKEN_ID)
    ).rejects.toThrow('broadcast failed')
    expect(close).toHaveBeenCalledTimes(1)
  })
})
