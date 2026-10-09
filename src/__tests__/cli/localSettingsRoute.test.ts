import { describe, expect, it, jest } from '@jest/globals'

import { localSettings } from '../../cli/engine/routes/localSettings'
import { makeFakeDiskletAccount } from '../../util/fake/fakeDisklet'

/**
 * Whether `local-settings` can tell a choice from a default.
 *
 * The read is deliberately lenient — a read-only route must not answer `500`
 * for a file it can report defaults for — and that left the two cases
 * identical on the wire: a `Settings.json` that is present and unreadable
 * answered `{ spamFilterOn: true }`, exactly like a user who has the filter
 * on. `localAccountSettings`' own rule is that "a caller that caches must
 * not then mark itself authoritative", which a REST caller could not apply
 * because nothing in the response said which reading it had.
 *
 * The offline suite reaches this route on the fake world, whose file is
 * readable, so the untrusted arm is only reachable here.
 */
async function run(
  account: ReturnType<typeof makeFakeDiskletAccount>,
  warnings: string[]
): Promise<any> {
  const ctx: any = {
    params: { sessionId: 'session-1' },
    query: { valid: {} },
    state: {
      logger: {
        info: () => {},
        warn: (message: string) => warnings.push(message),
        error: () => {}
      },
      sessions: { get: () => ({ account }) }
    }
  }
  return await (localSettings.handler(ctx) as Promise<any>)
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
