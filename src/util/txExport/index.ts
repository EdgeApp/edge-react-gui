export {
  exportTransactionsToBitwave,
  exportTransactionsToCSV,
  exportTransactionsToCSVInner,
  exportTransactionsToQBO,
  getTransferTx
} from './format'

export const TX_EXPORT_FORMATS = ['csv', 'qbo', 'bitwave'] as const
export type TxExportFormat = (typeof TX_EXPORT_FORMATS)[number]

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
    if (!TX_EXPORT_FORMATS.includes(part as TxExportFormat)) {
      throw new Error(`Unknown exportFormat "${part}"`)
    }
    if (!formats.includes(part as TxExportFormat)) {
      formats.push(part as TxExportFormat)
    }
  }
  return formats
}
