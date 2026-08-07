import { printJson } from '../client/output'
import { command, requireSession } from '../command'
import { parseCommandArgs } from '../commandArgs'

const lobbyLoginFetchCmd = command(
  'lobby-login-fetch',
  {
    usage: 'lobby-login-fetch <lobbyId>',
    help: 'Fetch an Edge login request from a lobby',
    needsSession: true
  },
  async (ctx, argv) => {
    const { positional: lobbyId } = parseCommandArgs(lobbyLoginFetchCmd, argv, {
      positional: 'required'
    })
    const sessionId = requireSession(ctx)
    printJson(
      await ctx.client.get(
        `/v1/accounts/${encodeURIComponent(
          sessionId
        )}/lobbies/${encodeURIComponent(lobbyId!)}`
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
    const { positional: lobbyId } = parseCommandArgs(
      lobbyLoginApproveCmd,
      argv,
      { positional: 'required' }
    )
    const sessionId = requireSession(ctx)
    printJson(
      await ctx.client.post(
        `/v1/accounts/${encodeURIComponent(
          sessionId
        )}/lobbies/${encodeURIComponent(lobbyId!)}/approve`
      )
    )
  }
)
