import { describe, expect, it } from '@jest/globals'

import { CLI_EXIT_CODES, errorCodes } from '../../../docs/api/shared'
import {
  errorCodesFor,
  EXIT,
  EXIT_BY_STATUS,
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

  it('exits NETWORK for a rates fill the queue gave up on', () => {
    // `RATES_INCOMPLETE` is the refusal `get-transactions --export-format`
    // answers rather than writing a zero fiat amount for part of its range,
    // and the documented way out is to raise `--timeout` — which is advice
    // that only makes sense if a script can tell it apart from a generic
    // failure. It rides the unlisted-503 rule rather than having a row of
    // its own, which is the rule the guide states, and this is the case
    // that pins it: the refusal cannot be driven through the client against
    // a healthy rates server, so nothing else does.
    expect(exitCodeForApiError('RATES_INCOMPLETE', 503)).toBe(EXIT.NETWORK)
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

  it('classifies every published code, or says it is deliberate', () => {
    // The 404 half was derived from the catalogue and complete; nothing did
    // that for the other statuses, so nine codes fell through to `1` —
    // "failed, with no more specific mapping" — while their status-mates
    // were mapped. `OBJECT_KIND_MISMATCH` and `MISSING_BITWAVE_ACCOUNT_ID`
    // beside `BAD_REQUEST`, the four `SWAP_*` limit codes beside
    // `INSUFFICIENT_FUNDS`, `OBJECT_EXPIRED` — which is the literal "the
    // quote expired, start again" signal. A script branching on the
    // published table read its own correctable mistake as unclassified.
    //
    // `INTERNAL_ERROR` and `OBSOLETE_API` are generic on purpose: one is the
    // unmapped failure by definition, and the other means "this build is too
    // old", which has no exit code and should not get an invented one. Every
    // other published code has to resolve to something.
    const genericByDesign = new Set(['INTERNAL_ERROR', 'OBSOLETE_API'])
    const unclassified = errorCodes
      .filter(
        entry =>
          exitCodeForApiError(entry.code, entry.status) === EXIT.GENERIC &&
          !genericByDesign.has(entry.code)
      )
      .map(entry => `${entry.status} ${entry.code}`)
    expect(unclassified).toStrictEqual([])
    // And every status the catalogue uses has a fallback, so a code added
    // with a new status cannot land in `GENERIC` silently.
    const statuses = [...new Set(errorCodes.map(entry => entry.status))]
    expect(statuses.length).toBeGreaterThan(8)
    const unmappedStatuses = statuses
      .filter(status => EXIT_BY_STATUS[status] == null)
      .sort((a, b) => a - b)
    expect(unmappedStatuses).toStrictEqual([426])
  })

  it('maps every 404 in the catalogue to the not-found exit', () => {
    // The guide publishes `4 | Not found` and the reference's own table
    // listed three of the seven published 404s, so `OBJECT_NOT_FOUND` — the
    // most likely failure in the staged spend and swap flows, since a handle
    // lives five minutes — exited `1`, "failed, with no more specific
    // mapping". The membership is derived from the catalogue now rather
    // than from a hand-kept list, so a new 404 code cannot be added without
    // a row here.
    const missing = errorCodes
      .filter(entry => entry.status === 404)
      .map(entry => entry.code)
      .filter(code => EXIT_CODE_BY_ERROR[code] !== EXIT.NOT_FOUND)
    expect(missing).toStrictEqual([])
    // The sweep must do work.
    expect(
      errorCodes.filter(entry => entry.status === 404).length
    ).toBeGreaterThan(4)
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
    // All seven published 404s, in the order the published doc renders
    // them. Four were absent, so a stale object handle or a cancelled edge
    // login exited `1`.
    expect(errorCodesFor(EXIT.NOT_FOUND)).toStrictEqual([
      'NOT_FOUND',
      'NO_LOGIN_REQUEST',
      'OBJECT_NOT_FOUND',
      'PENDING_LOGIN_NOT_FOUND',
      'TOKEN_NOT_FOUND',
      'USER_NOT_FOUND',
      'WALLET_NOT_FOUND'
    ])
  })
})
