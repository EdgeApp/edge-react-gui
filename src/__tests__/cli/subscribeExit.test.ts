import { describe, expect, it } from '@jest/globals'

import { EXIT } from '../../cli/client/exitCodes'
import { eventsPath, exitCodeForClose } from '../../cli/commands/subscribe'

/**
 * What `subscribe` exits with when the engine closes the stream.
 *
 * The engine writes `forceLogout`'s reason through to the
 * `subscription.closed` frame verbatim, and it passes `'expired'` for the
 * idle auto-logout — the way a long-running scoped subscriber actually ends.
 * Honouring only `'logout'` made that exit 7, published as "could not connect
 * to or spawn the engine", so a supervisor branching on 7 restarted an engine
 * that was perfectly healthy.
 */
describe('exitCodeForClose', () => {
  it('reads a session ending as an orderly end for a scoped stream', () => {
    // Every reason the engine passes to `forceLogout` except `shutdown`:
    // `logout` from the route, `expired` from the auto-logout ticker and the
    // sweep, `cancelled` from the pending-login teardown.
    for (const reason of ['logout', 'expired', 'cancelled']) {
      expect(exitCodeForClose(reason, true)).toBe(EXIT.OK)
    }
  })

  it('reads the engine stopping as an engine failure', () => {
    // The engine really is going away, which is what exit 7 means.
    expect(exitCodeForClose('shutdown', true)).toBe(EXIT.ENGINE)
  })

  it('reads anything it does not recognise as an engine failure', () => {
    expect(exitCodeForClose('something new', true)).toBe(EXIT.ENGINE)
    expect(exitCodeForClose(undefined, true)).toBe(EXIT.ENGINE)
  })

  it('reads any close of an unscoped stream as an engine failure', () => {
    // A context stream outlives every account, so only the engine stopping
    // can end it — whatever reason comes with the frame.
    for (const reason of ['logout', 'expired', 'cancelled', 'shutdown']) {
      expect(exitCodeForClose(reason, false)).toBe(EXIT.ENGINE)
    }
  })
})

/**
 * Which flags narrow the stream, and which combination cannot.
 *
 * `--wallet-id` only means anything inside a session: the route's
 * `walletId` filter applies to a session-scoped subscription. Passing it
 * alone used to build the unscoped path, so `subscribe --wallet-id=…`
 * printed every event the engine emits and nothing said the filter had been
 * discarded.
 */
describe('eventsPath', () => {
  it('refuses a wallet filter with nothing to scope it to', () => {
    expect(() => eventsPath({ types: [], walletId: 'w1' })).toThrow(
      '--wallet-id requires --session-id'
    )
    // An empty `--session-id=` is the same state, not a session.
    expect(() =>
      eventsPath({ types: [], sessionId: '', walletId: 'w1' })
    ).toThrow('--wallet-id requires --session-id')
  })

  it('scopes to a wallet inside a session', () => {
    expect(
      eventsPath({ types: ['wallet.balance'], sessionId: 's1', walletId: 'w1' })
    ).toBe('/engine/events?type=wallet.balance&sessionId=s1&walletId=w1')
  })

  it('encodes every value it puts in the query', () => {
    expect(eventsPath({ types: ['a&b'], sessionId: 's/1' })).toBe(
      '/engine/events?type=a%26b&sessionId=s%2F1'
    )
  })

  it('asks for everything when no flag narrows it', () => {
    expect(eventsPath({ types: [] })).toBe('/engine/events')
  })
})
