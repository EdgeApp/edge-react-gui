import { command, UsageError } from '../command'
import { requireAccount } from '../util/session'

command(
  'lobby-login-fetch',
  {
    usage: 'lobbyId',
    help: 'Fetches an Edge login request from the lobby server',
    needsAccount: true
  },
  async function (console, session, argv) {
    if (argv.length !== 1) throw new UsageError(this)
    const account = requireAccount(session)
    const lobbyId = argv[0]

    const lobby = await account.fetchLobby(lobbyId)
    const { loginRequest } = lobby
    console.log(`loginRequest: ${loginRequest != null ? 'yes' : 'no'}`)
    if (loginRequest != null) {
      const { appId, displayImageDarkUrl, displayImageLightUrl, displayName } =
        loginRequest
      console.log(` appId: ${appId}`)
      console.log(` displayName: ${displayName}`)
      if (displayImageDarkUrl != null) {
        console.log(` displayImageDarkUrl: ${displayImageDarkUrl}`)
      }
      if (displayImageLightUrl != null) {
        console.log(` displayImageLightUrl: ${displayImageLightUrl}`)
      }
    }
  }
)

command(
  'lobby-login-approve',
  {
    usage: 'lobbyId',
    help: 'Approves an edge-login request',
    needsAccount: true
  },
  async function (console, session, argv) {
    if (argv.length !== 1) throw new UsageError(this)
    const account = requireAccount(session)
    const lobbyId = argv[0]

    const lobby = await account.fetchLobby(lobbyId)
    const { loginRequest } = lobby
    if (loginRequest == null) {
      throw new Error('This lobby is not requesting an edge login.')
    }

    await loginRequest.approve()
  }
)
