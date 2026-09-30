import { EXIT } from '../client/output'
import {
  type CoreSocket,
  pickWatchUrl,
  type SyncRepo,
  watchRepos,
  type WatchSocket
} from '../client/watchSyncRepos'
import { command, requireSession } from '../command'
import { parseCommandArgs } from '../commandArgs'

interface SyncReposResponse {
  repos: SyncRepo[]
  webSocketServers: string[]
  /** Absent from an engine older than this client. */
  sockets?: CoreSocket[]
}

/**
 * Node's global WebSocket, typed only as far as the watch uses it. The
 * command runs on Node 22+, where the global is always present.
 */
function makeSocket(url: string): WatchSocket {
  const Ctor = (
    globalThis as unknown as { WebSocket?: new (url: string) => WatchSocket }
  ).WebSocket
  if (Ctor == null) throw new Error('This Node has no global WebSocket')
  return new Ctor(url)
}

/**
 * Watches the logged-in account's sync repos over the sync server's own
 * WebSocket, so the subscription protocol is observable without an app.
 * A test and diagnostic tool, like the other `admin-` commands. The
 * engine supplies the repo list and the hosts core uses; the socket belongs
 * to this process.
 */
const watchSyncReposCmd = command(
  'admin-watch-sync-repos',
  {
    usage: 'admin-watch-sync-repos',
    help: "Stream sync-server change notifications for the account's repos",
    needsSession: true
  },
  async (ctx, argv) => {
    parseCommandArgs(watchSyncReposCmd, argv, { positional: 'none' })
    const sessionId = requireSession(ctx)
    const { repos, webSocketServers, sockets } =
      await ctx.client.get<SyncReposResponse>(
        `/admin/${encodeURIComponent(sessionId)}/get-sync-repos`
      )
    const url = pickWatchUrl(webSocketServers, sockets)
    if (url == null) {
      throw new Error(
        'No sync-server WebSocket is configured. Run under -t, where the ' +
          'sync servers (or EDGE_CLI_SERVERS.syncWebSocketServer) name one.'
      )
    }

    const controller = new AbortController()
    const stop = (): void => {
      controller.abort()
    }
    process.on('SIGINT', stop)
    process.on('SIGTERM', stop)
    try {
      const end = await watchRepos({
        url,
        repos,
        makeSocket,
        // One JSON object per line, so the stream pipes into jq or a log.
        write: line => {
          console.log(JSON.stringify(line))
        },
        signal: controller.signal
      })
      if (end.reason === 'closed') process.exitCode = EXIT.NETWORK
    } finally {
      process.off('SIGINT', stop)
      process.off('SIGTERM', stop)
    }
  }
)
