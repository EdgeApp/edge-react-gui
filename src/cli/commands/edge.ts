import { printJson } from '../client/output'
import { command } from '../command'
import { parseCommandArgs } from '../commandArgs'

interface PendingEdgeLogin {
  pendingId: string
  lobbyId: string
  uri: string
  state: 'pending' | 'started' | 'done' | 'error' | 'closed'
  username: string | null
  session?: { sessionId: string; username?: string } | null
  error?: string | null
}

const POLL_INTERVAL_MS = 2000
const TIMEOUT_MS = 5 * 60 * 1000

async function sleep(ms: number): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, ms))
}

const requestCmd = command(
  'request-edge-login',
  {
    usage: 'request-edge-login [--no-wait]',
    help: 'Request a QR / lobby Edge login and wait for approval'
  },
  async (ctx, argv) => {
    const args = parseCommandArgs(requestCmd, argv, {
      positional: 'none',
      flags: { 'no-wait': 'boolean' }
    })
    const pending = await ctx.client.post<PendingEdgeLogin>(
      '/request-edge-login'
    )
    // `--no-wait` prints the lobby and stops, so the QR can be shown while
    // another process polls the same handle with `poll-edge-login`.
    if (args.boolean('no-wait')) {
      printJson(pending)
      return
    }
    printJson(pending)

    const deadline = Date.now() + TIMEOUT_MS
    let current = pending
    while (
      current.state !== 'done' &&
      current.state !== 'error' &&
      current.state !== 'closed'
    ) {
      if (Date.now() > deadline) {
        throw new Error('Timed out waiting for Edge login approval')
      }
      await sleep(POLL_INTERVAL_MS)
      current = await ctx.client.get<PendingEdgeLogin>(
        `/pending-edge-login/${encodeURIComponent(pending.pendingId)}`
      )
    }

    if (current.state === 'done' && current.session != null) {
      ctx.setSessionId(current.session.sessionId, current.session.username)
      printJson(current)
    } else {
      printJson(current)
      throw new Error(
        current.error ?? `Edge login ended in state "${current.state}"`
      )
    }
  }
)

const pollCmd = command(
  'poll-edge-login',
  {
    usage: 'poll-edge-login <pendingId>',
    help: 'Check a pending QR login once, without waiting',
    needsSession: false
  },
  async (ctx, argv) => {
    const args = parseCommandArgs(pollCmd, argv, {
      positional: 'required',
      flags: {}
    })
    const current = await ctx.client.get<PendingEdgeLogin>(
      `/pending-edge-login/${encodeURIComponent(args.positional ?? '')}`
    )
    // A finished poll carries the session, so store it here rather than
    // making the caller copy a sessionId out of the JSON.
    if (current.state === 'done' && current.session != null) {
      ctx.setSessionId(current.session.sessionId, current.session.username)
    }
    printJson(current)
  }
)
