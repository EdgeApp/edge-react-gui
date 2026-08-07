import { engineError } from '../errors'
import type { Router } from '../router'
import { getAccount } from './helpers'

export function registerLobbyRoutes(router: Router): void {
  router.add('GET', '/v1/accounts/{sessionId}/lobbies/{lobbyId}', async ctx => {
    const account = getAccount(ctx)
    const lobby = await account.fetchLobby(ctx.params.lobbyId)
    const { loginRequest } = lobby
    return {
      lobbyId: ctx.params.lobbyId,
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

  router.add(
    'POST',
    '/v1/accounts/{sessionId}/lobbies/{lobbyId}/approve',
    async ctx => {
      const account = getAccount(ctx)
      const lobby = await account.fetchLobby(ctx.params.lobbyId)
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
