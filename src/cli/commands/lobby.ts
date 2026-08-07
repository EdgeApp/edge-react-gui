import { printJson } from '../client/output'
import { command, requireSession, UsageError } from '../command'

const lobbyLoginFetchCmd = command(
  'lobby-login-fetch',
  {
    usage: 'lobby-login-fetch <lobbyId>',
    help: 'Fetch an Edge login request from a lobby',
    needsSession: true
  },
  async (ctx, argv) => {
    if (argv.length !== 1) throw new UsageError(lobbyLoginFetchCmd)
    const [lobbyId] = argv
    const sessionId = requireSession(ctx)
    printJson(
      await ctx.client.get(
        `/v1/accounts/${encodeURIComponent(
          sessionId
        )}/lobbies/${encodeURIComponent(lobbyId)}`
      )
    )
  }
)

const lobbyLoginApproveCmd = command(
  'lobby-login-approve',
  {
    usage: 'lobby-login-approve <lobbyId>',
    help: "Approve a lobby's pending login request",
    needsSession: true
  },
  async (ctx, argv) => {
    if (argv.length !== 1) throw new UsageError(lobbyLoginApproveCmd)
    const [lobbyId] = argv
    const sessionId = requireSession(ctx)
    printJson(
      await ctx.client.post(
        `/v1/accounts/${encodeURIComponent(
          sessionId
        )}/lobbies/${encodeURIComponent(lobbyId)}/approve`
      )
    )
  }
)
