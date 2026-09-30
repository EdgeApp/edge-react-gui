/**
 * The client half of `admin-watch-sync-repos`: speaks the sync server's JSON-RPC 2.0
 * subscription protocol over `/api/v2/ws` and turns what comes back into
 * newline-delimited JSON.
 *
 *   → subscribeRepos([[repoId], …])   at most 100 per call
 *   ← [result, …]                     -1 | 0 | 1 | 2, parallel to params
 *   ← update([[repoId, checkpoint], …])
 *   ← subLost([[repoId], …])
 */

/** One repo as the `admin-get-sync-repos` route lists it. */
export interface SyncRepo {
  repoId: string
  /** The wallet, or `account` for the account repo. */
  walletId: string
  type?: string
}

/** One of core's own sync-server sockets, as `admin-get-sync-repos` reports it. */
export interface CoreSocket {
  url: string
  connected: boolean
  connecting: boolean
}

/**
 * The host to watch: the one core's socket is connected to, so the watch
 * sees what the engine sees; else one core is connecting to; else the first
 * host core follows. Undefined when there is none.
 */
export function pickWatchUrl(
  servers: string[],
  sockets: CoreSocket[] = []
): string | undefined {
  return (
    sockets.find(socket => socket.connected)?.url ??
    sockets.find(socket => socket.connecting)?.url ??
    servers[0]
  )
}

/** The most repos one `subscribeRepos` call may carry. */
export const SUBSCRIBE_BATCH_SIZE = 100

export type RepoWatchLine =
  | {
      type: 'subscribed'
      repos: Array<{ repoId: string; walletId: string | null; result: unknown }>
    }
  | {
      type: 'update' | 'subLost'
      at: string
      repos: Array<{
        repoId: string
        walletId: string | null
        checkpoint?: string
      }>
    }
  | { type: 'closed'; at: string; code: number; reason: string }

/** Splits a repo list into `subscribeRepos` calls the server will accept. */
export function subscribeBatches<T>(
  repos: T[],
  size: number = SUBSCRIBE_BATCH_SIZE
): T[][] {
  const out: T[][] = []
  for (let i = 0; i < repos.length; i += size) {
    out.push(repos.slice(i, i + size))
  }
  return out
}

/** A `subscribeRepos` request carrying repo IDs without checkpoints. */
export function subscribeRequest(id: number, repos: SyncRepo[]): string {
  return JSON.stringify({
    jsonrpc: '2.0',
    id,
    method: 'subscribeRepos',
    params: repos.map(repo => [repo.repoId])
  })
}

/** The `subscribed` line: each repo beside the result the server gave it. */
export function subscribedLine(
  repos: SyncRepo[],
  results: unknown[]
): RepoWatchLine {
  return {
    type: 'subscribed',
    repos: repos.map((repo, i) => ({
      repoId: repo.repoId,
      walletId: repo.walletId,
      result: results[i] ?? null
    }))
  }
}

/**
 * The line for a server notification, or undefined for anything that is not
 * an `update` or `subLost`. A repo the watch did not subscribe gets a null
 * `walletId` rather than being dropped, so a server bug stays visible.
 */
export function notificationLine(
  message: unknown,
  walletIds: Map<string, string>,
  now: Date
): RepoWatchLine | undefined {
  if (message == null || typeof message !== 'object') return undefined
  const { method, params } = message as { method?: unknown; params?: unknown }
  if (method !== 'update' && method !== 'subLost') return undefined
  if (!Array.isArray(params)) return undefined

  const repos: Array<{
    repoId: string
    walletId: string | null
    checkpoint?: string
  }> = []
  for (const entry of params) {
    if (!Array.isArray(entry) || typeof entry[0] !== 'string') continue
    const [repoId, checkpoint] = entry as [string, unknown]
    repos.push({
      repoId,
      walletId: walletIds.get(repoId) ?? null,
      ...(method === 'update' && typeof checkpoint === 'string'
        ? { checkpoint }
        : {})
    })
  }
  return { type: method, at: now.toISOString(), repos }
}

/** The parts of a WebSocket the watch uses, so tests can supply a fake. */
export interface WatchSocket {
  onopen: ((event: unknown) => void) | null
  onmessage: ((event: { data: unknown }) => void) | null
  onclose: ((event: { code: number; reason: string }) => void) | null
  onerror: ((event: unknown) => void) | null
  send: (text: string) => void
  close: () => void
}

export interface WatchReposOpts {
  url: string
  repos: SyncRepo[]
  makeSocket: (url: string) => WatchSocket
  /** Receives each output line. */
  write: (line: RepoWatchLine) => void
  /** Resolves the watch as interrupted when it fires. */
  signal?: AbortSignal
  now?: () => Date
}

export type WatchEnd =
  | { reason: 'interrupted' }
  | { reason: 'closed'; code: number; closeReason: string }

/**
 * Opens the socket, subscribes every repo, and writes one line for the
 * subscribe results and one per notification until the signal fires or the
 * server closes the socket.
 *
 * @throws if the socket fails before opening, or the server answers a
 *   subscribe with a JSON-RPC error.
 */
export async function watchRepos(opts: WatchReposOpts): Promise<WatchEnd> {
  const { repos, write, signal } = opts
  const now = opts.now ?? (() => new Date())
  const walletIds = new Map(repos.map(repo => [repo.repoId, repo.walletId]))
  const batches = subscribeBatches(repos)
  const results: unknown[][] = batches.map(() => [])
  let pending = batches.length

  return await new Promise<WatchEnd>((resolve, reject) => {
    let settled = false
    let opened = false
    const socket = opts.makeSocket(opts.url)

    const finish = (end: WatchEnd | Error): void => {
      if (settled) return
      settled = true
      signal?.removeEventListener('abort', onAbort)
      if (end instanceof Error) reject(end)
      else resolve(end)
    }
    const onAbort = (): void => {
      finish({ reason: 'interrupted' })
      socket.close()
    }
    if (signal?.aborted === true) {
      onAbort()
      return
    }
    signal?.addEventListener('abort', onAbort)

    socket.onopen = () => {
      opened = true
      if (batches.length === 0) write(subscribedLine([], []))
      batches.forEach((batch, i) => {
        socket.send(subscribeRequest(i + 1, batch))
      })
    }

    socket.onmessage = event => {
      let message: unknown
      try {
        message = JSON.parse(String(event.data))
      } catch {
        return
      }
      if (message == null || typeof message !== 'object') return
      const { id, result, error } = message as {
        id?: unknown
        result?: unknown
        error?: { message?: unknown }
      }
      if (typeof id === 'number' && id >= 1 && id <= batches.length) {
        if (error != null) {
          finish(
            new Error(
              `subscribeRepos failed: ${
                typeof error.message === 'string' ? error.message : 'error'
              }`
            )
          )
          socket.close()
          return
        }
        results[id - 1] = Array.isArray(result) ? result : []
        if (--pending === 0) {
          const aligned = batches.flatMap((batch, i) =>
            batch.map((_, j) => results[i][j])
          )
          write(subscribedLine(repos, aligned))
        }
        return
      }
      const line = notificationLine(message, walletIds, now())
      if (line != null) write(line)
    }

    socket.onerror = () => {
      if (!opened) {
        finish(new Error(`Cannot open a WebSocket to ${opts.url}`))
      }
    }

    socket.onclose = event => {
      if (settled) return
      if (!opened) {
        finish(new Error(`Cannot open a WebSocket to ${opts.url}`))
        return
      }
      write({
        type: 'closed',
        at: now().toISOString(),
        code: event.code,
        reason: event.reason
      })
      finish({ reason: 'closed', code: event.code, closeReason: event.reason })
    }
  })
}
