import { describe, expect, it } from '@jest/globals'
import fs from 'fs'
import path from 'path'

import { redactUrl } from '../../cli/engine/server'
import { redactSessionId } from '../../cli/engine/sessions'

const ROOT = path.resolve(__dirname, '../../..')

/**
 * A request line in the engine log must not carry a usable session id.
 *
 * 74 of the 117 routes are `/account/{sessionId}/…`, and a `sessionId` is a
 * bearer token: holding one is full account authority. Every other site in
 * the engine routes through `redactSessionId`; the 4xx/5xx log line did not,
 * so one mistyped `--wallet-id` wrote a live credential into
 * `~/.edge-cli/logs/engine-<profile>.log` — kept for seven days by the sweep,
 * and the file an operator pastes into a bug report.
 */
const ID = 'sess_0123456789abcdef0123456789abcdef'

describe('redactUrl', () => {
  it('truncates the session id in an account path', () => {
    const out = redactUrl(`/account/${ID}/wallet/balance-map`)
    expect(out).toBe(`/account/${redactSessionId(ID)}/wallet/balance-map`)
    expect(out).not.toContain(ID)
  })

  it('leaves enough of it to correlate a line with a session', () => {
    // The reason the path is logged at all, so a full strip would be the
    // wrong fix.
    expect(redactUrl(`/account/${ID}/wallet/dump-data`)).toContain(
      ID.slice(0, 10)
    )
  })

  it('redacts whatever follows, including a query string', () => {
    expect(
      redactUrl(`/account/${ID}/wallet/get-transactions?walletId=abc&limit=5`)
    ).not.toContain(ID)
  })

  it('redacts a positional segment after the session too', () => {
    // `sign-tx/{objectId}` and friends: the id is still segment 2.
    expect(redactUrl(`/account/${ID}/sign-tx/tx_abc`)).not.toContain(ID)
  })

  it('leaves a path with no session alone', () => {
    for (const path of [
      '/engine/status',
      '/engine/sessions',
      '/rates/query',
      '/login-with-password',
      '/'
    ]) {
      expect(redactUrl(path)).toBe(path)
    }
  })

  it('leaves a malformed account path alone rather than throwing', () => {
    // A path the router will refuse anyway still gets logged, so this must
    // not be the thing that fails.
    expect(redactUrl('/account')).toBe('/account')
    expect(redactUrl('/account/')).toBe('/account/')
  })
})

/**
 * A query string carries credentials too, which this used to deny.
 *
 * `redactUrl`'s own docblock said no route declares `sessionId` as a query
 * field. `/engine/events` does, and `subscribe --session-id=<stale id>`
 * answers 401, which is a logged line — so the id went into the file whole.
 * Three other routes carry a secret there that is not a session id at all:
 * `dataKey` on the two admin repo reads, which with the `syncKey` in the
 * path is full offline read of an account repo; `password` on
 * `check-password-rules`; `recoveryKey` on `fetch-recovery-questions`.
 */
describe('redactUrl on a query string', () => {
  it('keeps the session id prefix and nothing more', () => {
    const out = redactUrl(`/engine/events?sessionId=${ID}&type=core.log`)
    expect(out).not.toContain(ID)
    expect(out).toContain(redactSessionId(ID))
    // The names stay: they are what identifies the request.
    expect(out).toContain('type=')
  })

  it('replaces every other value, whatever the field is called', () => {
    const out = redactUrl(
      '/admin/repo-get/syncKeyHere?dataKey=0123456789abcdef&path=Keys/x.json'
    )
    expect(out).not.toContain('0123456789abcdef')
    expect(out).not.toContain('Keys/x.json')
    expect(out).toContain('dataKey=<redacted>')
    expect(out).toContain('path=<redacted>')
  })

  it('redacts a field no route has declared yet', () => {
    // The point of replacing by default: a route that adds a secret query
    // field cannot leak it by forgetting to name it here.
    expect(redactUrl('/x?somethingNew=hunter2')).not.toContain('hunter2')
  })

  it('leaves the names of empty and valueless fields', () => {
    expect(redactUrl('/x?a=&b')).toBe('/x?a&b')
  })

  it('leaves a url with no query alone', () => {
    expect(redactUrl('/engine/status')).toBe('/engine/status')
  })
})

/**
 * The admin routes carry their secret in the *path*.
 *
 * Five take a `syncKey` as the positional, two a `lobbyId` and one an
 * `objectId`, and a `syncKey` with the `dataKey` from the query is full
 * offline read of an account repo — the pair `redactUrl`'s own docblock names
 * as the exposure. Only the query half was redacted, so the key itself went
 * into `~/.edge-cli/logs/engine-<profile>.log` whole, kept for seven days.
 *
 * The rule is the segment after the command, which is the last one, because
 * `routePath` appends the positional. This said "segment 3" and the count
 * said "one lobbyId", and the route neither description fits —
 * `/admin/lobby-handle/delete/{objectId}`, the only two-segment admin
 * command — was also the one case this suite did not drive.
 */
describe('redactUrl on an admin path', () => {
  const SYNC_KEY = 'f1e2d3c4b5a60718293a4b5c6d7e8f90a1b2c3d4'

  it('truncates a syncKey, with its dataKey already replaced', () => {
    const out = redactUrl(
      `/admin/repo-get/${SYNC_KEY}?dataKey=0123456789abcdef&path=Keys/x.json`
    )
    expect(out).not.toContain(SYNC_KEY)
    expect(out).toContain(redactSessionId(SYNC_KEY))
    expect(out).toContain('dataKey=<redacted>')
  })

  it('covers every admin route that takes one', () => {
    for (const route of [
      'repo-get',
      'repo-list',
      'repo-set',
      'repo-delete',
      'sync-repo'
    ]) {
      expect(redactUrl(`/admin/${route}/${SYNC_KEY}`)).not.toContain(SYNC_KEY)
    }
    // And both lobby ids, each a capability of its own.
    for (const route of ['fetch-lobby-request', 'send-lobby-reply']) {
      expect(redactUrl(`/admin/${route}/${SYNC_KEY}`)).not.toContain(SYNC_KEY)
    }
  })

  it('redacts the positional of a two-segment admin command', () => {
    // `/admin/lobby-handle/delete/{objectId}` puts the positional at segment
    // 4, so the old `parts[3]` rule truncated the literal word `delete` and
    // logged the id whole. An `objectId` is an engine handle rather than a
    // credential, but the rule this breaks is the one that keeps the next
    // admin route's positional out of the log.
    const out = redactUrl(`/admin/lobby-handle/delete/${SYNC_KEY}`)
    expect(out).not.toContain(SYNC_KEY)
    expect(out).toContain(redactSessionId(SYNC_KEY))
    // And the command itself still reads, so a line still says what was
    // called.
    expect(out).toContain('/admin/lobby-handle/delete/')
  })

  it('leaves an admin path with no positional alone', () => {
    expect(redactUrl('/admin/hash-username')).toBe('/admin/hash-username')
  })
})

/**
 * Nothing in the engine writes a whole `sessionId` into the log.
 *
 * `redactUrl` covers the request line; the other door is a log call's
 * `extra` object, which `EngineLogger.write` spreads into the JSON line
 * with no redaction of its own. `objectHandles.ts` wrote
 * `sessionId: record.sessionId` on a failed handle release — reachable
 * whenever a swap partner refuses a `quote.close()` at the handle's TTL —
 * so `engine-<profile>.log` held a live bearer token good for
 * `get-login-key`, `get-pin` and `spend`, in the file an operator pastes
 * into a bug report.
 */
describe('log extras', () => {
  it('never pass a whole sessionId', () => {
    const dir = path.join(ROOT, 'src/cli/engine')
    const offenders: string[] = []
    const walk = (at: string): void => {
      for (const entry of fs.readdirSync(at, { withFileTypes: true })) {
        const full = path.join(at, entry.name)
        if (entry.isDirectory()) {
          walk(full)
          continue
        }
        if (!entry.name.endsWith('.ts')) continue
        const text = fs.readFileSync(full, 'utf8')
        for (const m of text.matchAll(/sessionId:\s*([^\n,}]+)/g)) {
          const value = m[1].trim()
          // The convention the rule enforces: whatever a log line passes
          // for `sessionId` is named for its redaction, or is absent.
          if (/redact/i.test(value) || value === 'undefined') continue
          // A response body or a store field is not a log line, so this
          // narrows to the values that sit near a logger call.
          const at = m.index ?? 0
          const before = text.slice(Math.max(0, at - 400), at)
          if (/\b(?:logger|report)\.(?:info|warn|error|write)\(/.test(before)) {
            offenders.push(`${path.relative(ROOT, full)}: sessionId: ${value}`)
          }
        }
      }
    }
    walk(dir)
    expect(offenders).toStrictEqual([])
  })
})
