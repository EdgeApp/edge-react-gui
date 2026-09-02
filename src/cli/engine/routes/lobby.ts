import { asEither, asObject, asString, asValue } from 'cleaners'

import { doc } from '../doc'
import { engineError } from '../errors'
import { route } from '../route'
import { asOk } from '../schemas'
import { getAccount } from './helpers'

const LOBBY_ID_DOC = 'From the QR code, or an `edge://edge/<lobbyId>` link.'

/**
 * Inspect a login request.
 *
 * The other side of `request-edge-login`: shows who is asking, so a human can
 * decide before approving.
 */
export const fetchLobby = route({
  core: 'account.fetchLobby',
  method: 'GET',
  path: '/account/{sessionId}/fetch-lobby',
  cli: { command: 'fetch-lobby', positional: 'lobbyId' },
  query: asObject({ lobbyId: doc(asString, LOBBY_ID_DOC) }).withRest,
  returns: asObject({
    lobbyId: asString,
    loginRequest: doc(
      asEither(
        asObject({
          appId: asString,
          displayName: asString,
          displayImageDarkUrl: asEither(asString, asValue(null)),
          displayImageLightUrl: asEither(asString, asValue(null))
        }),
        asValue(null)
      ),
      'Null when the lobby carries no pending login request.'
    )
  }),
  errors: ['BAD_REQUEST', 'NETWORK_ERROR'],

  async handler(ctx) {
    const { lobbyId } = ctx.query.valid
    const lobby = await getAccount(ctx).fetchLobby(lobbyId)
    const { loginRequest } = lobby
    return {
      lobbyId,
      loginRequest:
        loginRequest == null
          ? null
          : {
              appId: loginRequest.appId,
              displayName: loginRequest.displayName,
              displayImageDarkUrl: loginRequest.displayImageDarkUrl ?? null,
              displayImageLightUrl: loginRequest.displayImageLightUrl ?? null
            }
    }
  }
})

/**
 * Approve a login request.
 *
 * Grants the requesting device access to this account.
 *
 * @note The lobby is re-fetched on approve, so a request that expired between
 *   inspecting and approving fails with `404 NO_LOGIN_REQUEST`.
 * @coreNote Reached through account.fetchLobby(lobbyId).loginRequest.
 */
export const approveLoginRequest = route({
  core: 'EdgeLoginRequest.approve',
  method: 'POST',
  path: '/account/{sessionId}/approve-login-request',
  cli: { command: 'approve-login-request', positional: 'lobbyId' },
  body: asObject({ lobbyId: doc(asString, LOBBY_ID_DOC) }).withRest,
  returns: asOk,
  errors: ['NO_LOGIN_REQUEST', 'BAD_REQUEST', 'NETWORK_ERROR'],

  async handler(ctx) {
    const lobby = await getAccount(ctx).fetchLobby(ctx.body.lobbyId)
    if (lobby.loginRequest == null) {
      throw engineError(
        'NO_LOGIN_REQUEST',
        'Lobby has no pending login request',
        404
      )
    }
    await lobby.loginRequest.approve()
    return { ok: true }
  }
})
