import { describe, expect, it } from '@jest/globals'

import { CLI_EXIT_CODES, errorCodes } from '../../../docs/api/shared'
import {
  errorCodesFor,
  EXIT,
  EXIT_CODE_BY_ERROR,
  exitCodeForApiError
} from '../../cli/client/exitCodes'

describe('exitCodeForApiError', () => {
  it('maps every code in the table to its exit code', () => {
    for (const [code, exit] of Object.entries(EXIT_CODE_BY_ERROR)) {
      expect({ code, exit: exitCodeForApiError(code, 400) }).toStrictEqual({
        code,
        exit
      })
    }
  })

  it('prefers the explicit code over the 503 rule', () => {
    // The engine only ever sends this code with a 503, so testing the status
    // first made EXIT.ENGINE unreachable and reported a daemon that is going
    // away as a network failure.
    expect(exitCodeForApiError('ENGINE_SHUTTING_DOWN', 503)).toBe(EXIT.ENGINE)
    expect(exitCodeForApiError('NETWORK_ERROR', 503)).toBe(EXIT.NETWORK)
  })

  it('falls back to NETWORK for any other 503, and GENERIC otherwise', () => {
    expect(exitCodeForApiError('SOMETHING_NEW', 503)).toBe(EXIT.NETWORK)
    expect(exitCodeForApiError('SOMETHING_NEW', 500)).toBe(EXIT.GENERIC)
    expect(exitCodeForApiError('', 418)).toBe(EXIT.GENERIC)
  })
})

describe('the published exit-code table', () => {
  it('lists every mapped error code', () => {
    // Both sides used to state the membership separately — a 35-line
    // `if`-chain and English prose in a `doc` field — and `ENGINE_SHUTTING_DOWN`
    // was missing from the published one.
    for (const code of Object.keys(EXIT_CODE_BY_ERROR)) {
      const row = CLI_EXIT_CODES.find(r => r.code === EXIT_CODE_BY_ERROR[code])
      expect(row?.doc).toContain(`\`${code}\``)
    }
  })

  it('covers every exit code the CLI can return', () => {
    const published = new Set(CLI_EXIT_CODES.map(r => r.code))
    for (const code of Object.values(EXIT)) {
      expect(published.has(code)).toBe(true)
    }
  })

  it('only maps codes the error catalogue defines', () => {
    const known = new Set(errorCodes.map(e => e.code))
    const unknown = Object.keys(EXIT_CODE_BY_ERROR).filter(
      code => !known.has(code)
    )
    expect(unknown).toStrictEqual([])
  })

  it('groups the codes the same way the table does', () => {
    expect(errorCodesFor(EXIT.NOT_FOUND)).toStrictEqual([
      'NOT_FOUND',
      'WALLET_NOT_FOUND',
      'TOKEN_NOT_FOUND'
    ])
  })
})
