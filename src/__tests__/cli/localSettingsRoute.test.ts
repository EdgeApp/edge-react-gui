import { describe, expect, it, jest } from '@jest/globals'

import {
  changeLocalSettings,
  localSettings
} from '../../cli/engine/routes/localSettings'
import { makeFakeDiskletAccount } from '../../util/fake/fakeDisklet'

/**
 * Whether `local-settings` can tell a choice from a default.
 *
 * The read is deliberately lenient — a read-only route must not answer `500`
 * for a file it can report defaults for — so a `Settings.json` that is
 * present and unreadable answers `{ spamFilterOn: true }`, exactly like a
 * user who has the filter on, and `trusted` is what tells the two apart.
 * `localAccountSettings`' own rule is that "a caller that caches must not
 * then mark itself authoritative", which a REST caller can apply only
 * because the response says which reading it has.
 *
 * The offline suite reaches this route on the fake world, whose file is
 * readable, so the untrusted arm is only reachable here.
 */
async function run(
  account: ReturnType<typeof makeFakeDiskletAccount>,
  warnings: string[],
  body?: unknown
): Promise<any> {
  const ctx: any = {
    params: { sessionId: 'session-1' },
    query: { valid: {} },
    body,
    state: {
      logger: {
        info: () => {},
        warn: (message: string) => warnings.push(message),
        error: () => {}
      },
      sessions: { get: () => ({ account }) }
    }
  }
  const handler =
    body == null ? localSettings.handler : changeLocalSettings.handler
  return await (handler(ctx) as Promise<any>)
}

describe('local-settings', () => {
  it('answers trusted for a file it could read', async () => {
    const warnings: string[] = []
    const result = await run(
      makeFakeDiskletAccount({ local: JSON.stringify({}) }),
      warnings
    )
    expect(result).toStrictEqual({ spamFilterOn: true, trusted: true })
    expect(warnings).toStrictEqual([])
  })

  it('answers trusted for an account that has never written one', async () => {
    // An absent file genuinely *is* the defaults, which is what a fresh
    // account has — so this reading is the user's, as far as it goes.
    const warnings: string[] = []
    const result = await run(makeFakeDiskletAccount({}), warnings)
    expect(result).toStrictEqual({ spamFilterOn: true, trusted: true })
    expect(warnings).toStrictEqual([])
  })

  it('carries the stored value through', async () => {
    const warnings: string[] = []
    const result = await run(
      makeFakeDiskletAccount({
        local: JSON.stringify({ spamFilterOn: false })
      }),
      warnings
    )
    expect(result).toStrictEqual({ spamFilterOn: false, trusted: true })
  })

  it('marks a present, unreadable file untrusted and reports it', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {})
    try {
      const warnings: string[] = []
      const result = await run(
        makeFakeDiskletAccount({
          // `account.localDisklet` is core's `encryptDisklet`, so a truncated
          // file fails inside the parse rather than matching `isMissingFile`.
          localError: new SyntaxError('Unexpected end of JSON input')
        }),
        warnings
      )
      expect(result.trusted).toBe(false)
      // The default is still reported, because a read-only route answers
      // rather than failing — the flag is what keeps it from reading as a
      // choice.
      expect(result.spamFilterOn).toBe(true)
      // And the engine log says it happened: the reader's own `console.warn`
      // goes to the startup log a clean stop deletes.
      expect(warnings).toHaveLength(1)
      expect(warnings[0]).toContain('Settings.json')
    } finally {
      warn.mockRestore()
    }
  })
})

/**
 * Whether a write has a way out of an unreadable file.
 *
 * The read-modify-write is strict on purpose — its base must not be the 13
 * defaults, or one `--spam-filter-on` puts them over the user's
 * `spendingLimits`. It must not answer the same `500` forever, though:
 * `Settings.json` does not repair itself, and it is on
 * `account.localDisklet`, so there is nothing the caller can do about it
 * from outside.
 */
describe('change-local-settings', () => {
  it('writes without moving anything when the file reads', async () => {
    const warnings: string[] = []
    const result = await run(
      makeFakeDiskletAccount({ local: JSON.stringify({ spamFilterOn: true }) }),
      warnings,
      { spamFilterOn: false }
    )
    expect(result).toStrictEqual({
      spamFilterOn: false,
      recovery: undefined
    })
    expect(warnings).toStrictEqual([])
  })

  it('files an unreadable file away and says so', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {})
    try {
      const warnings: string[] = []
      const written: Array<[string, string]> = []
      const deleted: string[] = []
      const result = await run(
        makeFakeDiskletAccount({
          local: '{"spamFilterOn":',
          onLocalWrite: (path, text) => written.push([path, text]),
          onLocalDelete: path => deleted.push(path)
        }),
        warnings,
        { spamFilterOn: false }
      )
      expect(result.spamFilterOn).toBe(false)
      // Named on the wire, not only in a log: the call wrote the defaults
      // plus one field, and a caller that cached the result as the user's
      // settings would be wrong about every other one.
      const { recovery } = result
      if (recovery?.kind !== 'moved') throw new Error('expected a move')
      expect(recovery.to).toMatch(/^Settings\.json\.unreadable-\d+$/)
      expect(written[0]).toStrictEqual([recovery.to, '{"spamFilterOn":'])
      expect(deleted).toStrictEqual(['Settings.json'])
      expect(warnings).toHaveLength(1)
      expect(warnings[0]).toContain(recovery.to)
    } finally {
      warn.mockRestore()
    }
  })

  it('says so when the file was deleted rather than moved', async () => {
    // Content that will not decrypt leaves nothing to keep. That outcome is
    // named on the wire and logged, rather than answering like an ordinary
    // write.
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {})
    try {
      const warnings: string[] = []
      const result = await run(
        makeFakeDiskletAccount({
          localError: new SyntaxError('Unexpected end of JSON input')
        }),
        warnings,
        { spamFilterOn: false }
      )
      expect(result.recovery).toStrictEqual({
        kind: 'deleted',
        reason: 'Unexpected end of JSON input'
      })
      expect(warnings).toHaveLength(1)
      expect(warnings[0]).toContain('deleted')
    } finally {
      warn.mockRestore()
    }
  })
})
