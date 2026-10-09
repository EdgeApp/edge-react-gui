import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest
} from '@jest/globals'
import type {
  EdgeAccount,
  EdgeCurrencyWallet,
  EdgeTransaction
} from 'edge-core-js'

import {
  DEFAULT_TX_LIMIT,
  exportPrefs,
  getTransactions
} from '../../cli/engine/routes/transactions'
import * as exchangeRates from '../../util/exchangeRates'
import { BTC_DENOM } from '../../util/fake/fakeDisklet'

/**
 * The flagship read route, with transactions in it.
 *
 * Nothing had ever run this handler over a non-empty wallet: the offline
 * suite's twelve call sites are five refusals and seven successes on the
 * fake world's empty wallet, which the suite says itself. So every number
 * and every file it produces was unasserted — which is how three defects in
 * one release landed here unnoticed: Bitwave dividing by the display
 * multiplier, `--fiat` moving the spam floor, and `offset` truncating an
 * export while `total` reported the full count.
 */
// No test in this file reaches the rates server. The handler prices
// transactions through `fillTxsFiat` and computes the spam floor through
// `resolveListSpamThreshold`, and both of those call into the rate queue,
// which falls back to `globalThis.fetch` against the production
// `rates3.edge.app` — so `npm test`, the first step of `verify` and of the
// precommit chain, made live requests to a production service. Measured:
// 9.8s for this file with network, and with `fetch` made to throw, 42.4s
// and seven failures. Both entry points are stubbed instead, the way
// `fillTxsFiat.test.ts` and `spamThreshold.test.ts` already do it. The
// individual case that wants an unpriceable rate re-spies.
//
// That also removes the need for real timers: `jestSetup.js` fakes them
// globally and the queue's `FETCH_FREQUENCY` debounce never fires under a
// faked timer, which is why this file used to opt out.
const STUB_RATE = 40000

beforeEach(() => {
  jest
    .spyOn(exchangeRates, 'getHistoricalCryptoRate')
    .mockResolvedValue(STUB_RATE)
  jest
    .spyOn(exchangeRates, 'getHistoricalCryptoRateOrUnavailable')
    .mockResolvedValue(STUB_RATE)
})

afterEach(() => {
  jest.restoreAllMocks()
})

const BITS_DENOM = { name: 'bits', multiplier: '100', symbol: 'ƀ' }

interface Options {
  /** What the synced `Settings.json` holds. */
  settings?: Record<string, unknown>
  /** The synced file's raw text, for one that is there and unreadable. */
  syncedRaw?: string
  txs?: EdgeTransaction[]
  /** Records what `getTransactions` was asked for. */
  asked?: Array<Record<string, unknown>>
  /** Counts reads of the synced `Settings.json`. */
  onSyncedRead?: () => void
  /** Every write to the *wallet's* disklet, where `exportTxInfo.json` lives. */
  walletWrites?: Array<{ path: string; text: string }>
  /**
   * An error the *wallet's* disklet raises instead of answering.
   *
   * For a file that is present and unreadable, which is a different case
   * from absent. The fixture's default is the absent-file spelling.
   */
  walletReadError?: Error
}

const tx = (over: Partial<EdgeTransaction> = {}): EdgeTransaction =>
  ({
    txid: 'tx-1',
    date: 1700000000,
    currencyCode: 'BTC',
    tokenId: null,
    nativeAmount: '-50000',
    networkFee: '1000',
    blockHeight: 800000,
    confirmations: 'confirmed',
    ourReceiveAddresses: [],
    signedTx: '',
    walletId: 'wallet-1',
    isSend: true,
    memos: [],
    metadata: {
      name: 'Coffee',
      category: 'Expense:Beans',
      notes: 'flat white'
    },
    ...over
  } as unknown as EdgeTransaction)

function makeCtx(opts: Options = {}): any {
  const txs = opts.txs ?? [tx()]
  const wallet = {
    id: 'wallet-1',
    currencyInfo: {
      pluginId: 'bitcoin',
      currencyCode: 'BTC',
      denominations: [BTC_DENOM]
    },
    // A config shaped like core's: the denominations are where
    // `getExchangeDenom` and `getDisplayDenom` read from.
    currencyConfig: {
      allTokens: {},
      currencyInfo: {
        pluginId: 'bitcoin',
        currencyCode: 'BTC',
        denominations: [BTC_DENOM]
      }
    },
    async getTransactions(params: Record<string, unknown>) {
      opts.asked?.push(params)
      return txs
    },
    async getNumTransactions() {
      return txs.length
    },
    // `exportTxInfo.json` lives here, and `--save-export-prefs` is the one
    // write a GET makes. Nothing observed it: there is no route that reads
    // the file back, so QA could not verify the write on a real account
    // either — and it is a *synced* file the GUI's export scene reads.
    disklet: {
      getText: async () => {
        if (opts.walletReadError != null) throw opts.walletReadError
        throw Object.assign(new Error('Cannot load "exportTxInfo.json"'), {})
      },
      setText: async (diskletPath: string, text: string) => {
        opts.walletWrites?.push({ path: diskletPath, text })
      }
    }
  } as unknown as EdgeCurrencyWallet
  const account = {
    currencyWallets: { 'wallet-1': wallet },
    // The synced settings the engine reads for the fiat and the units.
    disklet: {
      getText: async () => {
        opts.onSyncedRead?.()
        return opts.syncedRaw ?? JSON.stringify(opts.settings ?? {})
      },
      setText: async () => {}
    },
    currencyConfig: {}
  } as unknown as EdgeAccount
  return {
    params: { sessionId: 'session-1' },
    query: { valid: {} },
    state: {
      logger: { info: () => {}, warn: () => {}, error: () => {} },
      sessions: {
        get: () => ({ account })
      }
    }
  }
}

/** Drive the handler with one query. */
async function run(
  query: Record<string, unknown>,
  opts: Options = {}
): Promise<any> {
  const ctx = makeCtx(opts)
  // The cleaned shape the router hands a handler: `limit` and `offset` carry
  // the cleaner's own defaults, so a case that does not page still has them.
  ctx.query.valid = {
    walletId: 'wallet-1',
    limit: DEFAULT_TX_LIMIT,
    offset: 0,
    ...query
  }
  return await getTransactions.handler(ctx)
}

describe('get-transactions as a listing', () => {
  it('returns the rows with the display overlay beside them', async () => {
    const result = await run({})
    expect(result.total).toBe(1)
    expect(result.isoFiat).toBe('iso:USD')
    const [row] = result.transactions
    // The overlay is response-only, and carries machine values beside the
    // localized prose.
    expect(row.txid).toBe('tx-1')
    expect(row.displayInfo.direction).toBe('send')
    expect(row.displayInfo.category).toStrictEqual({
      category: 'expense',
      subcategory: 'Beans'
    })
  })

  it('reads the account’s own fiat, and the one the caller asks to see', async () => {
    expect((await run({})).isoFiat).toBe('iso:USD')
    expect(
      (await run({}, { settings: { defaultIsoFiat: 'iso:EUR' } })).isoFiat
    ).toBe('iso:EUR')
    expect((await run({ fiat: 'JPY' })).isoFiat).toBe('iso:JPY')
  })

  it('pages with limit and offset', async () => {
    const txs = [tx({ txid: 'a' }), tx({ txid: 'b' }), tx({ txid: 'c' })]
    const page = await run({ limit: 2 }, { txs })
    expect(page.transactions.map((t: any) => t.txid)).toStrictEqual(['a', 'b'])
    expect(page.total).toBe(3)
    const second = await run({ limit: 2, offset: 2 }, { txs })
    expect(second.transactions.map((t: any) => t.txid)).toStrictEqual(['c'])
    // `0` is the documented opt-out.
    const all = await run({ limit: 0 }, { txs })
    expect(all.transactions).toHaveLength(3)
  })

  it('reads the synced settings once on the default path', async () => {
    // The handler needs the account's fiat twice — the display default and
    // the spam floor's currency — and they are the same value whenever
    // `fiat` was not given. `readSyncedSettings` has no process-wide cache,
    // so reading per use parsed the file twice per listing while two
    // comments claimed the repeat had been removed.
    let reads = 0
    const onSyncedRead = (): void => {
      reads++
    }
    await run({}, { onSyncedRead })
    expect(reads).toBe(1)
    // And a caller who asks for another display currency still only costs
    // the one read, for the floor.
    reads = 0
    await run({ fiat: 'JPY' }, { onSyncedRead })
    expect(reads).toBe(1)
    // An export wants `denominationSettings` out of the same file, and takes
    // them from that one read rather than going back for them.
    reads = 0
    await run({ exportFormat: 'csv' }, { onSyncedRead })
    expect(reads).toBe(1)
  })
})

describe('get-transactions and the spam floor', () => {
  it('asks for the account’s floor, not the display fiat’s', async () => {
    // `--fiat` is display-only. Feeding it to the threshold moved the floor:
    // on BTC with JPY it truncated to '0' — the filter silently off — and on
    // a cheap token it moved by orders of magnitude, so two listings of one
    // range returned different rows and different totals.
    const askedUsd: Array<Record<string, unknown>> = []
    await run({}, { asked: askedUsd })
    const askedJpy: Array<Record<string, unknown>> = []
    await run({ fiat: 'JPY' }, { asked: askedJpy })
    expect(askedJpy[0].spamThreshold).toBe(askedUsd[0].spamThreshold)
  })

  it('takes no floor for an export, and the caller’s when given', async () => {
    const asked: Array<Record<string, unknown>> = []
    await run({ exportFormat: 'csv' }, { asked })
    expect(asked[0].spamThreshold).toBe('0')
    const explicit: Array<Record<string, unknown>> = []
    await run(
      { exportFormat: 'csv', spamThreshold: '500' },
      { asked: explicit }
    )
    expect(explicit[0].spamThreshold).toBe('500')
  })
})

/**
 * What is refused before any history or rates work.
 *
 * Each of these depends only on the query, the saved preferences or the
 * account's settings file, and each used to be found after the spam floor's
 * rate query — or after `wallet.getTransactions` and the whole fill — so the
 * caller's `--timeout` was spent before an answer it could have had at once.
 */
/**
 * The caller's deadline, shared by the two rate consumers.
 *
 * The queue turns a duration into a deadline when it enqueues, so handing
 * the fill the same duration the spam floor got — after the floor and
 * `getTransactions` had run — gave the fill a deadline later than the
 * caller's by exactly that time: past the client's own `--timeout`.
 */
describe('get-transactions and the caller’s deadline', () => {
  it('gives the fill only what the spam floor left', async () => {
    const budgets: Array<number | undefined> = []
    jest
      .spyOn(exchangeRates, 'getHistoricalCryptoRate')
      .mockImplementation(async (...args: unknown[]) => {
        budgets.push(args[6] as number | undefined)
        // A slow floor: eight seconds pass before it answers.
        jest.setSystemTime(Date.now() + 8000)
        return STUB_RATE
      })
    jest
      .spyOn(exchangeRates, 'getHistoricalCryptoRateOrUnavailable')
      .mockImplementation(async (...args: unknown[]) => {
        budgets.push(args[6] as number | undefined)
        return STUB_RATE
      })

    const ctx = makeCtx({ txs: [tx({ metadata: {} as any })] })
    // The spam filter on, read from a file that is there, so the floor is
    // really computed rather than declined.
    ctx.state.sessions.get().account.localDisklet = {
      getText: async () => '{"spamFilterOn":true}'
    }
    ctx.query.valid = {
      walletId: 'wallet-1',
      limit: DEFAULT_TX_LIMIT,
      offset: 0
    }
    ctx.arrivedAt = Date.now()
    ctx.req = { headers: { 'x-edge-timeout-ms': '15000' } }
    await getTransactions.handler(ctx)

    expect(budgets).toHaveLength(2)
    expect(budgets[0]).toBe(15000)
    // Fifteen seconds from arrival, eight of them spent on the floor.
    expect(budgets[1]).toBe(7000)
  })
})

describe('get-transactions refusals', () => {
  const failureOf = async (
    query: Record<string, unknown>,
    opts: Options
  ): Promise<{ code?: string; status?: number; message?: string }> =>
    await run(query, opts).then(
      () => ({}),
      (error: unknown) => error as { code?: string; message?: string }
    )

  it('names an unreadable Settings.json rather than answering 500', async () => {
    // A truncated, half-synced file: `JSON.parse`'s `SyntaxError` used to
    // reach the caller as an undeclared `INTERNAL_ERROR`, exit 1.
    const failure = await failureOf({}, { syncedRaw: '{"defaultIsoFiat":' })
    expect(failure.code).toBe('SETTINGS_UNREADABLE')
    expect(failure.status).toBe(503)
    expect(failure.message).toMatch(/Settings\.json/)
  })

  it('refuses an unknown token before pricing anything', async () => {
    const rates = jest.spyOn(exchangeRates, 'getHistoricalCryptoRate')
    const asked: Array<Record<string, unknown>> = []
    const failure = await failureOf({ tokenId: 'not-a-token' }, { asked })
    expect(failure.code).toBe('TOKEN_NOT_FOUND')
    expect(rates).not.toHaveBeenCalled()
    expect(asked).toStrictEqual([])
  })

  it('refuses a missing Bitwave id before reading the history', async () => {
    const asked: Array<Record<string, unknown>> = []
    const failure = await failureOf({ exportFormat: 'bitwave' }, { asked })
    expect(failure.code).toBe('MISSING_BITWAVE_ACCOUNT_ID')
    expect(asked).toStrictEqual([])
  })
})

describe('get-transactions as an export', () => {
  it('ignores the page entirely, offset included', async () => {
    // Ignoring only `limit` left `--export-format=csv --offset=100` writing
    // a file with the newest hundred rows missing while `total` reported the
    // real count.
    const txs = [tx({ txid: 'a' }), tx({ txid: 'b' }), tx({ txid: 'c' })]
    const result = await run(
      { exportFormat: 'csv', offset: 2, limit: 1 },
      { txs }
    )
    expect(result.total).toBe(3)
    const [csv] = result.files
    expect(csv.format).toBe('csv')
    // Three data rows plus the header.
    expect(csv.contents.trim().split('\n')).toHaveLength(4)
  })

  it('writes CSV in the display units and Bitwave in the exchange units', async () => {
    // Bitwave has no unit column — `amountTicker` is the asset's own code —
    // so its amount has to be the exchange denomination or the row reads
    // `50000 BTC` for 0.0005 BTC. CSV and QBO carry the unit, so they take
    // the user's chosen one.
    const settings = {
      denominationSettings: { bitcoin: { BTC: BITS_DENOM } }
    }
    const result = await run(
      {
        exportFormat: 'csv,bitwave',
        bitwaveAccountId: 'acct-1'
      },
      { settings }
    )
    const csv = result.files.find((f: any) => f.format === 'csv').contents
    const bitwave = result.files.find(
      (f: any) => f.format === 'bitwave'
    ).contents
    // 50000 sats is 500 bits and 0.0005 BTC.
    expect(csv).toContain('bits')
    expect(csv).toContain('500')
    expect(bitwave).toContain('0.0005')
    expect(bitwave).toContain('BTC')
  })

  it('refuses a bitwave account id with no bitwave format', async () => {
    await expect(
      run({ exportFormat: 'csv', bitwaveAccountId: 'acct-1' })
    ).rejects.toThrow(/bitwave/)
  })

  it('refuses an unknown format', async () => {
    await expect(run({ exportFormat: 'xlsx' })).rejects.toThrow(/xlsx/)
  })

  it('writes no preferences unless asked', async () => {
    // The flag is documented as the one write a GET makes, and as opt-in:
    // "writing unasked turned a one-off `--bitwave-account-id` into the
    // user's saved account id and flipped Export to Bitwave on for them".
    const walletWrites: Array<{ path: string; text: string }> = []
    await run(
      { exportFormat: 'csv,qbo', bitwaveAccountId: undefined },
      { walletWrites }
    )
    expect(walletWrites).toStrictEqual([])
  })

  it('saves the account id and the chosen formats together', async () => {
    // Both halves, because the flag's own doc says it persists
    // "`bitwaveAccountId` **and** the chosen formats" and it used to be
    // honoured only when the caller asked for bitwave *with* an explicit
    // id — so `--export-format=csv,qbo --save-export-prefs` answered `ok`
    // and wrote nothing, leaving the GUI export scene's switches untouched.
    const walletWrites: Array<{ path: string; text: string }> = []
    await run(
      { exportFormat: 'csv,qbo', saveExportPrefs: true },
      { walletWrites }
    )
    expect(walletWrites).toHaveLength(1)
    expect(walletWrites[0].path).toContain('exportTxInfo.json')
    const saved = JSON.parse(walletWrites[0].text)
    const record = saved[Object.keys(saved)[0]]
    expect(record.isExportCsv).toBe(true)
    expect(record.isExportQbo).toBe(true)
    // The format the caller did not ask for is recorded as off, not left
    // out: a partial patch left the record no longer describing the last
    // export either tool ran.
    expect(record.isExportBitwave).toBe(false)
    // The cleaner's own default for a caller who never mentioned bitwave —
    // an empty string, not an id carried over from somewhere else.
    expect(record.bitwaveAccountId).toBe('')
  })

  it('saves the bitwave account id the caller passed', async () => {
    const walletWrites: Array<{ path: string; text: string }> = []
    await run(
      {
        exportFormat: 'bitwave',
        bitwaveAccountId: 'acct-1',
        saveExportPrefs: true
      },
      { walletWrites }
    )
    const saved = JSON.parse(walletWrites[0].text)
    const record = saved[Object.keys(saved)[0]]
    expect(record.bitwaveAccountId).toBe('acct-1')
    expect(record.isExportBitwave).toBe(true)
  })

  it('refuses rather than writing zeros when the fiat fill gave up', async () => {
    // The chain budget bounds the whole fill and *settles* whatever is left
    // when it expires. A 10,000-transaction export is 102 passes, and a
    // server answering in ~700 ms spends the budget before they finish — so
    // the oldest tail used to be written as a zero fiat amount, in a file a
    // person reconciles against their books, with `total` reporting the real
    // count and nothing logged. A listing answers instead, with
    // `unpricedCount` set.
    const spy = jest
      .spyOn(exchangeRates, 'getHistoricalCryptoRateOrUnavailable')
      .mockResolvedValue(exchangeRates.RATE_UNAVAILABLE)
    try {
      const txs = [tx({ txid: 'a', metadata: undefined })]
      await expect(run({ exportFormat: 'csv' }, { txs })).rejects.toMatchObject(
        {
          code: 'RATES_INCOMPLETE',
          status: 503
        }
      )
      const listing = await run({}, { txs: [tx({ metadata: undefined })] })
      expect(listing.unpricedCount).toBe(1)
    } finally {
      spy.mockRestore()
    }
  })
})

/**
 * "No saved id" and "I could not read your saved id" are different answers.
 *
 * Both reads of `exportTxInfo.json` caught everything, so a file that would
 * not decrypt answered `400 MISSING_BITWAVE_ACCOUNT_ID` from the export and
 * `null` from `export-prefs` — telling the caller their saved id is not
 * there when it is, with nothing logged. `wallet.disklet` is core's
 * `encryptDisklet`, so an interrupted write surfaces as a parse error, which
 * is not a spelling `isMissingFile` knows.
 */
describe('a saved export record that cannot be read', () => {
  const corrupt = (): Error => new SyntaxError('Unexpected end of JSON input')

  it('is not reported as a missing Bitwave id', async () => {
    const failure = await run(
      { exportFormat: 'bitwave' },
      { walletReadError: corrupt() }
    ).then(
      () => undefined,
      (error: unknown) => error as { code?: string; message?: string }
    )
    expect(failure).toBeDefined()
    expect(failure?.code).not.toBe('MISSING_BITWAVE_ACCOUNT_ID')
    expect(String(failure?.message)).toMatch(/Unexpected end of JSON input/)
  })

  it('is still reported as a missing id when the file is simply absent', async () => {
    // The other half: the common case must keep its own answer, which is
    // the caller's to fix.
    const failure = await run({ exportFormat: 'bitwave' }).then(
      () => undefined,
      (error: unknown) => error as { code?: string; message?: string }
    )
    expect(failure).toBeDefined()
    expect(failure?.code).toBe('MISSING_BITWAVE_ACCOUNT_ID')
  })

  it('is not reported as "this asset has none" by export-prefs', async () => {
    const ctx = makeCtx({ walletReadError: corrupt() })
    ctx.query.valid = { walletId: 'wallet-1', tokenId: null }
    await expect(exportPrefs.handler(ctx)).rejects.toThrow(
      /Unexpected end of JSON input/
    )
  })

  it('answers null from export-prefs for an absent file', async () => {
    const ctx = makeCtx({})
    ctx.query.valid = { walletId: 'wallet-1', tokenId: null }
    const result: any = await exportPrefs.handler(ctx)
    expect(result.prefs).toBeNull()
    expect(result.key).toBe('BTC')
  })
})
