import { EXIT, printJsonLine } from '../client/output'
import { command } from '../command'
import { parseCommandArgs } from '../commandArgs'

interface ClosedData {
  reason?: string
}

/**
 * Why the stream ended, as an exit code.
 *
 * A context-scoped stream ends only when the engine does, so any reason means
 * the engine went away. A stream opened with `--session-id` is also closed by
 * that session logging out, which is an orderly end rather than a failure:
 * this comment used to say every subscriber was context-scoped, which stopped
 * being true when the route gained a scope.
 */
function exitCodeForClose(reason: string | undefined, scoped: boolean): number {
  if (scoped && reason === 'logout') return EXIT.OK
  return EXIT.ENGINE
}

const subscribeCmd = command(
  'subscribe',
  {
    usage:
      'subscribe [--session-id=<sessionId>] [--wallet-id=<walletId>] [--type=<eventType>]',
    help: 'Stream engine events as newline-delimited JSON until interrupted'
  },
  async (ctx, argv) => {
    // All three flags the route declares. `--session-id` and `--wallet-id`
    // were published in the usage line and then refused here with
    // `Unknown option`, so the account-scoped stream the engine supports had
    // no CLI path at all.
    const args = parseCommandArgs(subscribeCmd, argv, {
      positional: 'none',
      flags: {
        type: 'repeat',
        'session-id': 'string',
        'wallet-id': 'string'
      }
    })
    const wanted = new Set(args.strings('type'))
    const sessionId = args.string('session-id')
    const walletId = args.string('wallet-id')

    const controller = new AbortController()
    let closeReason: string | undefined
    let interrupted = false

    const stop = (): void => {
      // Registering these handlers removes Node's own terminate-on-SIGINT, so
      // a second signal has to end the process itself: aborting an already
      // aborted controller is a no-op, and a cold start can sit in
      // `ensureEngine` for up to 30s before the abort is observed.
      // 128 + SIGINT, the shell's own convention for a signalled exit.
      if (interrupted) process.exit(130)
      interrupted = true
      controller.abort()
    }
    process.on('SIGINT', stop)
    process.on('SIGTERM', stop)

    // The engine filters too, so an unwanted type never crosses the socket.
    // The client-side check below stays: it also covers a type the engine
    // sends unconditionally, like `subscription.closed`.
    const query = [...wanted].map(t => `type=${encodeURIComponent(t)}`)
    if (sessionId != null && sessionId !== '') {
      query.push(`sessionId=${encodeURIComponent(sessionId)}`)
      // Only meaningful with a session, which is what the route documents.
      if (walletId != null && walletId !== '') {
        query.push(`walletId=${encodeURIComponent(walletId)}`)
      }
    }
    const path =
      query.length > 0 ? `/engine/events?${query.join('&')}` : '/engine/events'

    try {
      await ctx.client.stream(
        path,
        (type, data) => {
          if (type === 'subscription.closed') {
            closeReason = (data as ClosedData)?.reason
          }
          if (wanted.size > 0 && !wanted.has(type)) return
          // One JSON object per line, so the stream pipes into jq or a log.
          printJsonLine({ type, data })
        },
        { signal: controller.signal }
      )
    } finally {
      // `finally`, because a stream that rejects — a 4xx from the engine, a
      // socket error — used to leave both listeners behind, and inside the
      // interactive prompt each failed `subscribe` leaked two of them until
      // Node warned at eleven.
      process.off('SIGINT', stop)
      process.off('SIGTERM', stop)
    }

    if (interrupted) return
    // The engine ended the stream. Say why, and exit accordingly.
    printJsonLine({ type: 'subscription.ended', data: { reason: closeReason } })
    // Not `process.exit`: this command is documented as newline-delimited
    // JSON for piping, and exiting here discarded whatever stdout had not
    // flushed — including this final frame.
    //
    // Not in the prompt either: `process.exitCode` is a global, so one
    // subscription whose engine restarted would otherwise decide the exit
    // code of the whole interactive session.
    if (ctx.interactive !== true) {
      process.exitCode = exitCodeForClose(
        closeReason,
        sessionId != null && sessionId !== ''
      )
    }
  }
)
