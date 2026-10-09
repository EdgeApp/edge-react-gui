/**
 * The export barrel: the formats, their names and the cleaner for them.
 *
 * `scripts/cliNodeSafeSmoke.js` loads this file with `react-native*`
 * poisoned, so everything it re-exports must stay Node-safe: no
 * react-native, no Redux, no Airship.
 */
import { asValue } from 'cleaners'
import type { EdgeTransaction } from 'edge-core-js'

import {
  exportTransactionsToBitwave,
  exportTransactionsToCSVInner,
  exportTransactionsToQBO
} from './format'

export {
  exportTransactionsToBitwave,
  exportTransactionsToCSVInner,
  exportTransactionsToQBO,
  getTransferTx
} from './format'

const TX_EXPORT_FORMATS = ['csv', 'qbo', 'bitwave'] as const
export type TxExportFormat = (typeof TX_EXPORT_FORMATS)[number]

/**
 * One export format.
 *
 * A cleaner rather than `includes(part as TxExportFormat)`: the cast was
 * what made that check load-bearing, so a new format added to
 * `TX_EXPORT_FORMATS` and forgotten here would have been accepted silently.
 */
export const asTxExportFormat = asValue<TxExportFormat[]>(...TX_EXPORT_FORMATS)

/**
 * Parse a comma-separated exportFormat query/flag.
 * Empty / omitted → `[]`. Unknown tokens throw.
 */
export function parseExportFormats(raw: string | undefined): TxExportFormat[] {
  if (raw == null) return []
  const parts = raw
    .split(',')
    .map(part => part.trim().toLowerCase())
    .filter(part => part !== '')
  const formats: TxExportFormat[] = []
  for (const part of parts) {
    // Reports the field and the legal values, where the hand-rolled check
    // said only `Unknown exportFormat "x"`.
    const format = asTxExportFormat(part)
    if (!formats.includes(format)) formats.push(format)
  }
  return formats
}

/**
 * What each format is called on disk, and as a MIME type.
 *
 * Three copies of this used to exist and none was exhaustive: the export
 * scene appended `.csv`, `.qbo` and `.bitwave.csv` with a `mimeType` in three
 * `if` blocks, the CLI's `exportFilePath` stripped the same three suffixes in
 * an `else if` chain and re-added them from two `if`s and a trailing
 * `return`, and the `get-transactions` route published a fourth statement of
 * them as prose. A fourth entry in `TX_EXPORT_FORMATS` was accepted
 * everywhere and then written with a `.csv` name by the CLI while the scene
 * wrote no file for it at all — which is the class this module's own
 * docblock warns about. Keyed by `TxExportFormat`, so adding a format
 * without a name here does not compile.
 */
export const TX_EXPORT_FORMAT_INFO: Record<
  TxExportFormat,
  {
    suffix: string
    mimeType: string
    /** What the share sheet calls it. */
    label: string
  }
> = {
  csv: {
    suffix: '.csv',
    mimeType: 'text/comma-separated-values',
    label: 'CSV'
  },
  qbo: { suffix: '.qbo', mimeType: 'application/vnd.intu.qbo', label: 'QBO' },
  bitwave: {
    suffix: '.bitwave.csv',
    mimeType: 'text/comma-separated-values',
    label: 'Bitwave CSV'
  }
}

/** Every suffix, longest first, so `.bitwave.csv` is stripped before `.csv`. */
export const TX_EXPORT_SUFFIXES: string[] = Object.values(TX_EXPORT_FORMAT_INFO)
  .map(info => info.suffix)
  .sort((a, b) => b.length - a.length)

/** One rendered export file. */
export interface TxExportFile {
  format: TxExportFormat
  contents: string
}

/**
 * Render a set of formats from one set of resolved values.
 *
 * Which of the resolved values each formatter gets was written twice — once
 * in `TransactionsExportScene.handleSubmit` and once in the
 * `get-transactions` handler — and four rounds of review found the two
 * disagreeing about it: the fiat column, the CSV/QBO denomination, the
 * Bitwave denomination and the `DENOMINATION` name, each fixed by editing
 * both dispatches back into agreement. Nothing could compare them: the scene
 * component is not exported, so no test can reach its `handleSubmit`.
 *
 * The three formats genuinely want different denominations. CSV and QBO
 * carry the amount beside a unit — CSV in its `DENOMINATION` column, QBO
 * implicitly — both in the user's chosen *display* units, while Bitwave has
 * no unit field at all: `amountTicker` is the asset's own currency code, so
 * its `amount` has to be in the *exchange* denomination or a row reads
 * `50000 BTC` for 0.0005 BTC.
 *
 * The `switch` is exhaustive with a `never` default, so a fourth format
 * cannot be half-wired: it used to fall into the engine's Bitwave branch and
 * dereference `bitwaveAccountId!` as `undefined`.
 */
export async function buildExportFiles(opts: {
  formats: TxExportFormat[]
  txs: EdgeTransaction[]
  currencyCode: string
  isoFiat: string
  displayDenom: { multiplier: string; name: string }
  exchangeDenom: { multiplier: string }
  /** Required when `formats` includes `bitwave`. */
  bitwaveAccountId?: string
}): Promise<TxExportFile[]> {
  const {
    formats,
    txs,
    currencyCode,
    isoFiat,
    displayDenom,
    exchangeDenom,
    bitwaveAccountId
  } = opts
  const files: TxExportFile[] = []
  for (const format of formats) {
    switch (format) {
      case 'csv':
        files.push({
          format,
          contents: exportTransactionsToCSVInner(
            txs,
            currencyCode,
            isoFiat,
            displayDenom.multiplier,
            displayDenom.name
          )
        })
        break
      case 'qbo':
        files.push({
          format,
          contents: exportTransactionsToQBO(
            txs,
            isoFiat,
            displayDenom.multiplier
          )
        })
        break
      case 'bitwave': {
        if (bitwaveAccountId == null || bitwaveAccountId === '') {
          // Both callers check first — the route answers
          // `400 MISSING_BITWAVE_ACCOUNT_ID` and the scene disables the
          // switch — so this is the guard that keeps the `!` out of the one
          // place the id is spent.
          throw new Error('Bitwave export requires a bitwaveAccountId')
        }
        files.push({
          format,
          contents: await exportTransactionsToBitwave(
            bitwaveAccountId,
            txs,
            currencyCode,
            exchangeDenom.multiplier
          )
        })
        break
      }
      default: {
        const unreached: never = format
        throw new Error(`Unhandled export format ${String(unreached)}`)
      }
    }
  }
  return files
}
