import { sleep } from '../../util/sleep'
import { printJson } from '../client/output'
import { renderTerminalQr } from '../client/terminalQr'
import { readPendingEdgeLogin } from '../clientResponses'
import { command } from '../command'
import { parseCommandArgs } from '../commandArgs'

const POLL_INTERVAL_MS = 2000
const TIMEOUT_MS = 5 * 60 * 1000

/**
 * Draw `uri` as a QR code on stdout, below the JSON.
 *
 * Sized for the terminal stdout is, when it is one. The note that the
 * terminal is too small goes to stderr, like the CLI's other warnings.
 */
function printQr(uri: string): void {
  const out = process.stdout
  const qr = renderTerminalQr(
    uri,
    out.isTTY ? { columns: out.columns, rows: out.rows } : {}
  )
  out.write(qr.lines.join('\n') + '\n')
  if (qr.tooBig) {
    console.error(
      `The QR code needs ${qr.width} columns and ${qr.height + 1} rows: ` +
        'enlarge the terminal or zoom out to scan it, or enter the uri in ' +
        "the app's Scan QR."
    )
  }
}

const requestCmd = command(
  'request-edge-login',
  {
    usage: 'request-edge-login [--no-wait] [--show-qr]'
  },
  async (ctx, argv) => {
    const args = parseCommandArgs(requestCmd, argv, {
      flags: { 'no-wait': 'boolean', 'show-qr': 'boolean' }
    })
    const pending = readPendingEdgeLogin(
      await ctx.client.post('/request-edge-login'),
      'request-edge-login'
    )
    printJson(pending)
    if (args.boolean('show-qr')) printQr(pending.uri)
    // `--no-wait` prints the lobby and stops, so the QR can be shown while
    // another process polls the same handle with `poll-edge-login`.
    if (args.boolean('no-wait')) return

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
      current = readPendingEdgeLogin(
        await ctx.client.get(
          `/pending-edge-login/${encodeURIComponent(pending.pendingId)}`
        ),
        'poll-edge-login'
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
    needsSession: false
  },
  async (ctx, argv) => {
    const args = parseCommandArgs(pollCmd, argv, {
      positional: 'required',
      flags: {}
    })
    const current = readPendingEdgeLogin(
      await ctx.client.get(
        `/pending-edge-login/${encodeURIComponent(args.positional ?? '')}`
      ),
      'poll-edge-login'
    )
    // A finished poll carries the session, so store it here rather than
    // making the caller copy a sessionId out of the JSON.
    if (current.state === 'done' && current.session != null) {
      ctx.setSessionId(current.session.sessionId, current.session.username)
    }
    printJson(current)
  }
)
