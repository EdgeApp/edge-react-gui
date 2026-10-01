import { asValue } from 'cleaners'

export {
  exportTransactionsToBitwave,
  exportTransactionsToCSV,
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
