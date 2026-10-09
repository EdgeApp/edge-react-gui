import { describe, expect, it } from '@jest/globals'

import {
  nextEnabledTokenIds,
  readBalances,
  readEnabledTokens,
  readExportedFiles,
  readPendingEdgeLogin,
  readSession
} from '../../cli/clientResponses'

/**
 * The five responses the client acts on rather than prints.
 *
 * `ApiClient.request` ends `return parsed as T`, so every other command
 * trusts the engine's shape — harmless when the value is printed and
 * forgotten. These five are not: a login writes `sessionId` into the `0600`
 * session file, and the edge-login poll drives a five-minute loop off
 * `state`. The module exists so that a version-skewed engine is a named
 * failure here instead of an `undefined` deep inside the client, and that
 * arm is the one the offline suites cannot reach — the fake engine always
 * answers the right shape, which is exactly the case this is for.
 */
const session = {
  sessionId: 'abc123',
  username: 'clitester',
  rootLoginId: 'root123',
  loginMethod: 'password',
  autoLogoutSeconds: 3600,
  autoLogoutRead: true,
  expiresAt: null,
  lastActivityAt: '2024-01-01T00:00:00.000Z',
  createdAt: '2024-01-01T00:00:00.000Z'
}

describe('readSession', () => {
  it('passes a well-formed body through', () => {
    expect(readSession(session, 'login').sessionId).toBe('abc123')
  })

  it('names the call when the body is empty', () => {
    expect(() => readSession({}, 'login')).toThrow(/login response/)
  })

  it('names the call when there is no body at all', () => {
    expect(() => readSession(null, 'keepalive')).toThrow(/keepalive response/)
  })

  it('refuses a sessionId of the wrong type', () => {
    // The field the client writes to disk. A cast would have stored the
    // number and failed later, somewhere else.
    expect(() => readSession({ ...session, sessionId: 7 }, 'login')).toThrow(
      /not in the expected shape/
    )
  })

  it('tells the operator how to compare versions', () => {
    // The message is the whole point of the module: it has to say which
    // call answered unexpectedly and what to look at.
    expect(() => readSession({}, 'login')).toThrow(/apiVersion/)
  })
})

describe('readPendingEdgeLogin', () => {
  const pending = {
    objectId: 'obj1',
    pendingId: 'obj1',
    kind: 'pendingLogin',
    expiresAt: null,
    lobbyId: 'lobby1',
    uri: 'edge://edge/lobby1',
    state: 'pending',
    username: null,
    session: null,
    error: null
  }

  it('passes a well-formed body through', () => {
    const clean = readPendingEdgeLogin(pending, 'request-edge-login')
    expect(clean.state).toBe('pending')
  })

  it('refuses a state the poll loop does not know', () => {
    // The loop branches on `state`; an unknown one would read as "keep
    // polling" for the full five minutes.
    expect(() =>
      readPendingEdgeLogin({ ...pending, state: 'finished' }, 'poll-edge-login')
    ).toThrow(/poll-edge-login response/)
  })
})

/**
 * The three readers the cleaners round added, and the one that matters.
 *
 * `change-enabled-token-ids --add/--remove` reads the current set and posts
 * back the *complete desired set*, so a response whose `enabledTokenIds`
 * did not arrive used to make `new Set(undefined)` — an empty set, not a
 * throw — and `--add X` replaced every enabled asset in the account's
 * synced wallet file, on every device. The previous round added the reader
 * and claimed this file covered the throw; it did not, because this file
 * imported two readers and the module names five.
 */
describe('readEnabledTokens', () => {
  it('passes a well-formed body through', () => {
    const clean = readEnabledTokens({ enabledTokenIds: ['a', 'b'] }, 'tokens')
    expect(clean.enabledTokenIds).toStrictEqual(['a', 'b'])
  })

  it('throws rather than reading an absent set as empty', () => {
    expect(() => readEnabledTokens({}, 'tokens')).toThrow(/tokens response/)
    expect(() => readEnabledTokens(null, 'tokens')).toThrow(/apiVersion/)
  })
})

describe('readBalances', () => {
  it('throws for a body with no balances', () => {
    expect(() => readBalances({}, 'balance-map')).toThrow(
      /balance-map response/
    )
  })
})

describe('readExportedFiles', () => {
  it('throws before anything is written to disk', () => {
    // Each `contents` goes to a path built from its `format`, so a shape
    // that is not what it claims must not reach `writeExportFiles`.
    expect(() =>
      readExportedFiles({ files: [{ format: 'nope', contents: '' }] }, 'export')
    ).toThrow(/export response/)
    expect(() => readExportedFiles({}, 'export')).toThrow(/export response/)
  })
})

/**
 * The arithmetic that decides whether a wallet keeps its tokens.
 *
 * It lived inline in the command handler, where nothing could reach it: the
 * one offline case that runs this path uses `--remove` of a token that is
 * not enabled, on the fake world's UTXO wallet, whose set is empty — so it
 * passed identically for `new Set(undefined)` and for the repair.
 */
describe('nextEnabledTokenIds', () => {
  it('keeps what was there when adding', () => {
    expect(nextEnabledTokenIds(['a', 'b'], ['c'], [])).toStrictEqual([
      'a',
      'b',
      'c'
    ])
  })

  it('leaves a non-empty set alone when removing a non-member', () => {
    expect(nextEnabledTokenIds(['a', 'b'], [], ['z'])).toStrictEqual(['a', 'b'])
  })

  it('applies the removals after the additions', () => {
    expect(nextEnabledTokenIds(['a'], ['b'], ['a'])).toStrictEqual(['b'])
    // And a flag that both adds and removes one id removes it, which is
    // the order the handler documented.
    expect(nextEnabledTokenIds(['a'], ['c'], ['c'])).toStrictEqual(['a'])
  })

  it('does not treat an empty current set as a reason to wipe', () => {
    expect(nextEnabledTokenIds([], ['a'], [])).toStrictEqual(['a'])
  })
})
