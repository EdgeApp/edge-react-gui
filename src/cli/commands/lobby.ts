import { printJson } from '../client/output'
import { command, requireSession } from '../command'
import { parseCommandArgs } from '../commandArgs'

const lobbyLoginFetchCmd = command(
  'fetch-lobby',
  {
    usage: 'fetch-lobby <lobbyId>',
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
        `/accounts/${encodeURIComponent(
          sessionId
        )}/fetch-lobby?lobbyId=${encodeURIComponent(lobbyId!)}`
      )
    )
  }
)

const lobbyLoginApproveCmd = command(
  'approve-login-request',
  {
    usage: 'approve-login-request <lobbyId>',
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
        `/accounts/${encodeURIComponent(sessionId)}/approve-login-request`,
        { lobbyId }
      )
    )
  }
)
