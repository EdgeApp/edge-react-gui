import { engineError } from '../errors'
import { requireBodyObject, type Router } from '../router'
import { getAccount, requireQueryString, requireString } from './helpers'

export function registerLobbyRoutes(router: Router): void {
  /** account.fetchLobby(lobbyId) */
  router.add('GET', '/account/{sessionId}/fetch-lobby', async ctx => {
    const lobbyId = requireQueryString(ctx.query, 'lobbyId')
    const account = getAccount(ctx)
    const lobby = await account.fetchLobby(lobbyId)
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
  })

  /** EdgeLoginRequest.approve(), reached via account.fetchLobby(lobbyId) */
  router.add(
    'POST',
    '/account/{sessionId}/approve-login-request',
    async ctx => {
      const body = requireBodyObject(ctx.body)
      const lobbyId = requireString(body, 'lobbyId')
      const account = getAccount(ctx)
      const lobby = await account.fetchLobby(lobbyId)
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
  )
}
