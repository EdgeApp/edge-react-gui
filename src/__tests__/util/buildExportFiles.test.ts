import { describe, expect, it } from '@jest/globals'
import type { EdgeTransaction } from 'edge-core-js'

import {
  buildExportFiles,
  TX_EXPORT_FORMAT_INFO,
  TX_EXPORT_SUFFIXES
} from '../../util/txExport'

/**
 * Which resolved value each export format gets.
 *
 * This dispatch was written twice — `TransactionsExportScene.handleSubmit`
 * had three `if (isExportX)` blocks and the `get-transactions` handler an
 * `if/else if/else` — and four rounds of review found the two disagreeing
 * about it: the fiat column, the CSV/QBO denomination, the Bitwave
 * denomination, the `DENOMINATION` name. Each was fixed by editing both
 * dispatches back into agreement, and nothing could compare them:
 * `TransactionsExportSceneComponent` is not exported, so no test can reach
 * its `handleSubmit`, and `TransactionExportActions.test.ts`,
 * `displayDenom.test.ts` and `getTransactions.test.ts` all drive the
 * formatters or the engine handler rather than the choice of argument.
 *
 * So the assertion that matters is the denominations: CSV and QBO carry the
 * amount in the user's *display* units, beside a unit field (explicit in
 * CSV's `DENOMINATION`, implicit in QBO), while Bitwave's `amount` has to be
 * in the *exchange* denomination, because `amountTicker` is the asset's own
 * currency code and a row would otherwise read `50000 BTC` for 0.0005 BTC.
 */
const DISPLAY = { multiplier: '100', name: 'bits' }
const EXCHANGE = { multiplier: '100000000' }

const txs: EdgeTransaction[] = [
  {
    blockHeight: 500000,
    currencyCode: 'BTC',
    date: 1524476980,
    isSend: false,
    memos: [],
    metadata: {
      name: 'Crazy Person',
      category: 'Income:Mo Money',
      exchangeAmount: { 'iso:USD': 12000.45 },
      notes: 'thanks'
    },
    nativeAmount: '50000',
    networkFee: '1000',
    networkFees: [],
    ourReceiveAddresses: [],
    signedTx: '',
    tokenId: null,
    txid: 'txid1',
    walletId: ''
  } as unknown as EdgeTransaction
]

async function build(
  formats: Array<'csv' | 'qbo' | 'bitwave'>
): Promise<Record<string, string>> {
  const files = await buildExportFiles({
    formats,
    txs,
    currencyCode: 'BTC',
    isoFiat: 'iso:USD',
    displayDenom: DISPLAY,
    exchangeDenom: EXCHANGE,
    bitwaveAccountId: 'account-1'
  })
  const out: Record<string, string> = {}
  for (const file of files) out[file.format] = file.contents
  return out
}

describe('buildExportFiles', () => {
  it('renders one file per format, in the order asked for', async () => {
    const files = await buildExportFiles({
      formats: ['qbo', 'csv'],
      txs,
      currencyCode: 'BTC',
      isoFiat: 'iso:USD',
      displayDenom: DISPLAY,
      exchangeDenom: EXCHANGE
    })
    expect(files.map(file => file.format)).toStrictEqual(['qbo', 'csv'])
  })

  it('spends the display denomination on CSV, name and all', async () => {
    const { csv } = await build(['csv'])
    // 50000 native over a multiplier of 100 is 500 bits, which is also what
    // the GUI's wallet row shows for an account set to "bits". With the
    // exchange multiplier it read 0.0005.
    expect(csv).toContain('500')
    expect(csv).not.toContain('0.0005')
    expect(csv).toContain('bits')
    expect(csv).toContain('DENOMINATION')
  })

  it('spends the display denomination on QBO', async () => {
    const { qbo } = await build(['qbo'])
    // QBO has no unit field at all, so the figure has to match the CSV's —
    // the two files are of the same transaction in the same units.
    expect(qbo).toContain('<TRNAMT>500')
    expect(qbo).not.toContain('<TRNAMT>0.0005')
  })

  it('spends the exchange denomination on Bitwave', async () => {
    const { bitwave } = await build(['bitwave'])
    // `amountTicker` is BTC, so the amount is in BTC: 0.0005, not 500.
    expect(bitwave).toContain('0.0005')
    expect(bitwave).toContain('BTC')
    // And the account id reaches the formatter.
    expect(bitwave).toContain('account-1')
  })

  it('refuses a bitwave export with no account id', async () => {
    // Both callers check first, so this guard is what keeps the `!` out of
    // the one place the id is spent — the engine's `else` arm used to pass
    // `bitwaveAccountId!` as `undefined` for any format it did not name.
    await expect(
      buildExportFiles({
        formats: ['bitwave'],
        txs,
        currencyCode: 'BTC',
        isoFiat: 'iso:USD',
        displayDenom: DISPLAY,
        exchangeDenom: EXCHANGE
      })
    ).rejects.toThrow(/bitwaveAccountId/)
  })
})

describe('TX_EXPORT_FORMAT_INFO', () => {
  it('names every format exactly once', () => {
    // Keyed by `TxExportFormat`, so a new format without an entry does not
    // compile — this pins the other direction, that no two formats share a
    // file name.
    const suffixes = Object.values(TX_EXPORT_FORMAT_INFO).map(
      info => info.suffix
    )
    expect(new Set(suffixes).size).toBe(suffixes.length)
  })

  it('orders the suffixes so the longest matches first', () => {
    // `exportFilePath` strips a suffix by the first match, and
    // `.bitwave.csv` ends with `.csv`: stripping in declaration order left
    // `name.bitwave` as the stem.
    expect(TX_EXPORT_SUFFIXES[0]).toBe('.bitwave.csv')
    for (let i = 1; i < TX_EXPORT_SUFFIXES.length; ++i) {
      expect(TX_EXPORT_SUFFIXES[i - 1].length).toBeGreaterThanOrEqual(
        TX_EXPORT_SUFFIXES[i].length
      )
    }
  })
})
