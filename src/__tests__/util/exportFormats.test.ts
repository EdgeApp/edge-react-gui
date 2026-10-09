import { describe, expect, it } from '@jest/globals'

import { parseExportFormats } from '../../util/txExport'

/**
 * The parser behind `--export-format` and the `exportFormat` query field.
 *
 * The offline suite drives `csv`, `csv,qbo`, `bitwave` and an unknown token,
 * which leaves everything this function does beyond `split(',')` untested:
 * the dedupe — `csv,csv` must write one file, not two — the lower-casing, and
 * the blank-token filter that makes `'csv, ,qbo'` legal and `''` empty.
 */
describe('parseExportFormats', () => {
  it('reads nothing as no formats', () => {
    expect(parseExportFormats(undefined)).toStrictEqual([])
    expect(parseExportFormats('')).toStrictEqual([])
    // Blank tokens only, which is what a trailing comma leaves.
    expect(parseExportFormats(',')).toStrictEqual([])
  })

  it('reads a list in any case, with spaces', () => {
    expect(parseExportFormats('CSV')).toStrictEqual(['csv'])
    expect(parseExportFormats('csv, qbo')).toStrictEqual(['csv', 'qbo'])
    expect(parseExportFormats('csv, ,qbo')).toStrictEqual(['csv', 'qbo'])
  })

  it('writes one file per format, however often it is named', () => {
    expect(parseExportFormats('csv,csv')).toStrictEqual(['csv'])
    expect(parseExportFormats('csv,CSV, csv')).toStrictEqual(['csv'])
  })

  it('keeps the order the caller asked for', () => {
    expect(parseExportFormats('qbo,csv')).toStrictEqual(['qbo', 'csv'])
  })

  it('names the legal values when a token is not one', () => {
    // The reason this goes through the cleaner rather than `includes`: the
    // hand-rolled check said only `Unknown exportFormat "x"`.
    let message = ''
    try {
      parseExportFormats('csv,xlsx')
    } catch (error) {
      message = error instanceof Error ? error.message : String(error)
    }
    expect(message).toContain('xlsx')
    expect(message).toContain('csv')
    expect(message).toContain('qbo')
    expect(message).toContain('bitwave')
  })
})
