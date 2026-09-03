import { EXIT, printJson } from '../client/output'
import { command } from '../command'
import { parseCommandArgs } from '../commandArgs'

interface ClosedData {
  reason?: string
}

/**
 * Why the engine ended a stream decides the exit code, using the same table
 * one-shot commands use: a session ending is an auth condition, the engine
 * going away is an engine condition.
 */
function exitCodeForClose(reason: string | undefined): number {
  switch (reason) {
    case 'logout':
    case 'expired':
    case 'cancelled':
      return EXIT.AUTH
    case 'engineShutdown':
    case 'shutdown':
      return EXIT.ENGINE
    default:
      return EXIT.ENGINE
  }
}

const subscribeCmd = command(
  'subscribe',
  {
    usage: 'subscribe [--type=<eventType>]',
    help: 'Stream engine events as newline-delimited JSON until interrupted'
  },
  async (ctx, argv) => {
    const args = parseCommandArgs(subscribeCmd, argv, {
      positional: 'none',
      flags: { type: 'repeat' }
    })
    const wanted = new Set(args.strings('type'))

    const controller = new AbortController()
    let closeReason: string | undefined
    let interrupted = false

    const stop = (): void => {
      interrupted = true
      controller.abort()
    }
    process.on('SIGINT', stop)
    process.on('SIGTERM', stop)

    await ctx.client.stream(
      '/engine/events',
      (type, data) => {
        if (type === 'subscription.closed') {
          closeReason = (data as ClosedData)?.reason
        }
        if (wanted.size > 0 && !wanted.has(type)) return
        // One JSON object per line, so the stream pipes into jq or a log.
        printJson({ type, data })
      },
      { signal: controller.signal }
    )

    process.off('SIGINT', stop)
    process.off('SIGTERM', stop)

    if (interrupted) return
    // The engine ended the stream. Say why, and exit accordingly.
    printJson({ type: 'subscription.ended', data: { reason: closeReason } })
    process.exit(exitCodeForClose(closeReason))
  }
)
