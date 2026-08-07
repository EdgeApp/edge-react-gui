import { printJson } from '../client/output'
import { command } from '../command'

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

command(
  'edge-login',
  {
    usage: 'edge-login',
    help: 'Request a QR / lobby Edge login and wait for approval'
  },
  async ctx => {
    const pending = await ctx.client.post<PendingEdgeLogin>('/v1/login/edge')
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
        `/v1/login/edge/${encodeURIComponent(pending.pendingId)}`
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
