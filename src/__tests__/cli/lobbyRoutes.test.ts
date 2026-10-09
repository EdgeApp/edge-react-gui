import { describe, expect, it } from '@jest/globals'
import { base64 } from 'rfc4648'

import {
  adminMakeLobby,
  adminSendLobbyReply,
  decodeLobbyRequest
} from '../../cli/engine/routes/admin'
import { thrownSync } from '../../util/fake/thrownEngineError'

/**
 * Whether `admin-send-lobby-reply` can succeed for any input at all.
 *
 * It could not. The field that decides the encryption was declared
 * `asObject(asUnknown)` and cast to a hand-written shape whose
 * `publicKey?: string` disagreed with core's published `EdgeLobbyRequest`,
 * where it is a required `Uint8Array`: core destructures it straight into
 * `encryptLobbyReply` → `deriveSharedKey` → `secp256k1.keyFromPublic`, so a
 * base64 string threw `Unknown point format` — a `500 INTERNAL_ERROR` from a
 * route declaring `BAD_REQUEST`. No JSON body can carry a `Uint8Array`, so
 * there was no request that worked, and the only exercise of the route
 * asserted that very `INTERNAL_ERROR` under the name "to an unknown lobby".
 */

/** A real compressed secp256k1 point: 33 bytes, leading 0x03. */
const PUBLIC_KEY_BASE64 = 'A5TtBTRQirwe15Yjdeq2xShERYJSy9fmo+iCXjy7swpi'

function bodyOf<T>(route: { body?: unknown }, raw: unknown): T {
  return (route.body as (raw: unknown) => T)(raw)
}

describe('admin-send-lobby-reply', () => {
  it('decodes the public key the fetch route publishes', () => {
    // `admin-fetch-lobby-request` returns core's *cleaned* request, whose
    // `publicKey` is a `Uint8Array`, and `jsonReplacer` serialises it as
    // base64 — so this is the exact object the field's description tells a
    // caller to feed back.
    const body = bodyOf<{ lobbyRequest: unknown }>(adminSendLobbyReply, {
      lobbyId: 'somelobby',
      lobbyRequest: { publicKey: PUBLIC_KEY_BASE64, timeout: 600 }
    })
    const request = decodeLobbyRequest(body.lobbyRequest)
    expect(request.publicKey).toBeInstanceOf(Uint8Array)
    expect(request.publicKey).toHaveLength(33)
    expect(base64.stringify(request.publicKey)).toBe(PUBLIC_KEY_BASE64)
  })

  it('keeps the rest of the request, which core reads', () => {
    const body = bodyOf<{ lobbyRequest: unknown }>(adminSendLobbyReply, {
      lobbyId: 'somelobby',
      lobbyRequest: {
        publicKey: PUBLIC_KEY_BASE64,
        timeout: 600,
        loginRequest: { appId: 'edge.app' }
      }
    })
    const request = decodeLobbyRequest(body.lobbyRequest)
    expect(request.loginRequest?.appId).toBe('edge.app')
    expect(request.timeout).toBe(600)
  })

  it('rejects a request with no public key, from the declaration', () => {
    // `{}` used to pass the declaration and die inside core. It is the
    // caller's mistake, so it is a 400 the cleaner names.
    expect(() =>
      bodyOf(adminSendLobbyReply, { lobbyId: 'x', lobbyRequest: {} })
    ).toThrow(/publicKey/)
  })

  it('rejects a public key that is not base64, as a 400', () => {
    const body = bodyOf<{ lobbyRequest: unknown }>(adminSendLobbyReply, {
      lobbyId: 'x',
      lobbyRequest: { publicKey: 'not base64 at all!!' }
    })
    expect(
      thrownSync(() => decodeLobbyRequest(body.lobbyRequest))
    ).toMatchObject({ code: 'BAD_REQUEST', status: 400 })
  })
})

describe('admin-make-lobby', () => {
  it('takes only the two fields core reads, and defaults to {}', () => {
    // Core generates the lobby's keypair itself and writes `publicKey` over
    // whatever it was handed, so requiring it here — as core's
    // `EdgeLobbyRequest` does — would refuse every correct call.
    // Absent rather than `{}` in the body — a fallback there published the
    // field with no properties — and the handler passes `{}` on.
    const body = bodyOf<{
      lobbyRequest?: { timeout?: number; loginRequest?: { appId: string } }
    }>(adminMakeLobby, {})
    expect(body.lobbyRequest).toBeUndefined()

    const given = bodyOf<{
      lobbyRequest?: { timeout?: number; loginRequest?: { appId: string } }
    }>(adminMakeLobby, {
      lobbyRequest: { timeout: 60, loginRequest: { appId: 'edge.app' } }
    })
    expect(given.lobbyRequest?.timeout).toBe(60)
    expect(given.lobbyRequest?.loginRequest?.appId).toBe('edge.app')
  })

  it('refuses a wrong-typed field at the boundary', () => {
    // `asObject(asUnknown)` plus a cast left these to core's own uncleaner:
    // `wasEdgeLobbyRequest` walks the shape, so each of them threw from
    // inside core as a `500 INTERNAL_ERROR` on a route whose declared
    // errors are `NETWORK_ERROR` alone — where the declaration should have
    // answered a 400 naming the field.
    for (const lobbyRequest of [
      { loginRequest: { appId: 42 } },
      { loginRequest: {} },
      { loginRequest: 'x' },
      { timeout: 'soon' }
    ]) {
      expect(() => bodyOf(adminMakeLobby, { lobbyRequest })).toThrow()
    }
  })
})
