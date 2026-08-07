/**
 * Internal / debugging commands over context.$internalStuff. Prefixed with
 * "admin-" so they stay out of normal workflows. Paths mirror
 * src/cli/engine/routes/admin.ts exactly.
 */
import { printJson } from '../client/output'
import { command, UsageError } from '../command'

function parseJsonArg(
  cmd: ConstructorParameters<typeof UsageError>[0],
  json: string
): unknown {
  try {
    return JSON.parse(json)
  } catch {
    throw new UsageError(cmd, 'Argument must be valid JSON')
  }
}

const adminAuthRequestCmd = command(
  'admin-auth-request',
  {
    usage: "admin-auth-request <method> <path> ['<body-json>']",
    help: 'Make a raw request to the login/auth server'
  },
  async (ctx, argv) => {
    if (argv.length < 2 || argv.length > 3)
      throw new UsageError(adminAuthRequestCmd)
    const [method, path, bodyJson] = argv
    const body =
      bodyJson != null ? parseJsonArg(adminAuthRequestCmd, bodyJson) : undefined
    printJson(
      await ctx.client.post('/v1/admin/auth-request', { method, path, body })
    )
  }
)

const adminHashUsernameCmd = command(
  'admin-hash-username',
  {
    usage: 'admin-hash-username <username>',
    help: 'Hash a username the same way the login server does'
  },
  async (ctx, argv) => {
    if (argv.length !== 1) throw new UsageError(adminHashUsernameCmd)
    const [username] = argv
    const query = new URLSearchParams({ username })
    printJson(
      await ctx.client.get(`/v1/admin/hash-username?${query.toString()}`)
    )
  }
)

const adminLobbyCreateCmd = command(
  'admin-lobby-create',
  {
    usage: "admin-lobby-create ['<lobby-request-json>'] [<periodSeconds>]",
    help: 'Create a lobby and return its id and current replies'
  },
  async (ctx, argv) => {
    if (argv.length > 2) throw new UsageError(adminLobbyCreateCmd)
    const [lobbyRequestJson, periodArg] = argv
    const lobbyRequest =
      lobbyRequestJson != null
        ? parseJsonArg(adminLobbyCreateCmd, lobbyRequestJson)
        : undefined
    let period: number | undefined
    if (periodArg != null) {
      period = Number(periodArg)
      if (!Number.isFinite(period)) throw new UsageError(adminLobbyCreateCmd)
    }
    printJson(
      await ctx.client.post('/v1/admin/lobby', { lobbyRequest, period })
    )
  }
)

const adminLobbyFetchCmd = command(
  'admin-lobby-fetch',
  {
    usage: 'admin-lobby-fetch <lobbyId>',
    help: "Fetch a lobby's contents"
  },
  async (ctx, argv) => {
    if (argv.length !== 1) throw new UsageError(adminLobbyFetchCmd)
    const [lobbyId] = argv
    printJson(
      await ctx.client.get(`/v1/admin/lobby/${encodeURIComponent(lobbyId)}`)
    )
  }
)

const adminLobbyReplyCmd = command(
  'admin-lobby-reply',
  {
    usage:
      "admin-lobby-reply <lobbyId> '<lobby-request-json>' ['<reply-data-json>']",
    help: 'Send a reply to a lobby'
  },
  async (ctx, argv) => {
    if (argv.length < 2 || argv.length > 3)
      throw new UsageError(adminLobbyReplyCmd)
    const [lobbyId, lobbyRequestJson, replyDataJson] = argv
    const lobbyRequest = parseJsonArg(adminLobbyReplyCmd, lobbyRequestJson)
    const replyData =
      replyDataJson != null
        ? parseJsonArg(adminLobbyReplyCmd, replyDataJson)
        : undefined
    await ctx.client.post(
      `/v1/admin/lobby/${encodeURIComponent(lobbyId)}/reply`,
      { lobbyRequest, replyData }
    )
    printJson({ ok: true })
  }
)

const adminRepoSyncCmd = command(
  'admin-repo-sync',
  {
    usage: 'admin-repo-sync <syncKey>',
    help: 'Sync a repo by its base58 sync key'
  },
  async (ctx, argv) => {
    if (argv.length !== 1) throw new UsageError(adminRepoSyncCmd)
    const [syncKey] = argv
    printJson(await ctx.client.post('/v1/admin/repos/sync', { syncKey }))
  }
)

const adminRepoListCmd = command(
  'admin-repo-list',
  {
    usage: 'admin-repo-list <syncKey> <dataKey> [<path>]',
    help: 'List files in a repo (optionally under a subdirectory)'
  },
  async (ctx, argv) => {
    if (argv.length < 2 || argv.length > 3)
      throw new UsageError(adminRepoListCmd)
    const [syncKey, dataKey, path] = argv
    const query =
      path != null ? `?${new URLSearchParams({ path }).toString()}` : ''
    printJson(
      await ctx.client.get(
        `/v1/admin/repos/${encodeURIComponent(syncKey)}/${encodeURIComponent(
          dataKey
        )}/files${query}`
      )
    )
  }
)

const adminRepoGetCmd = command(
  'admin-repo-get',
  {
    usage: 'admin-repo-get <syncKey> <dataKey> <path>',
    help: 'Read one file from a repo'
  },
  async (ctx, argv) => {
    if (argv.length !== 3) throw new UsageError(adminRepoGetCmd)
    const [syncKey, dataKey, path] = argv
    const query = new URLSearchParams({ path })
    printJson(
      await ctx.client.get(
        `/v1/admin/repos/${encodeURIComponent(syncKey)}/${encodeURIComponent(
          dataKey
        )}/file?${query.toString()}`
      )
    )
  }
)

const adminRepoSetCmd = command(
  'admin-repo-set',
  {
    usage: 'admin-repo-set <syncKey> <dataKey> <path> <text>',
    help: 'Write one file in a repo'
  },
  async (ctx, argv) => {
    if (argv.length !== 4) throw new UsageError(adminRepoSetCmd)
    const [syncKey, dataKey, path, text] = argv
    const query = new URLSearchParams({ path })
    await ctx.client.put(
      `/v1/admin/repos/${encodeURIComponent(syncKey)}/${encodeURIComponent(
        dataKey
      )}/file?${query.toString()}`,
      { text }
    )
    printJson({ ok: true })
  }
)

const adminRepoDeleteCmd = command(
  'admin-repo-delete',
  {
    usage: 'admin-repo-delete <syncKey> <dataKey> <path>',
    help: 'Delete one file from a repo'
  },
  async (ctx, argv) => {
    if (argv.length !== 3) throw new UsageError(adminRepoDeleteCmd)
    const [syncKey, dataKey, path] = argv
    const query = new URLSearchParams({ path })
    await ctx.client.delete(
      `/v1/admin/repos/${encodeURIComponent(syncKey)}/${encodeURIComponent(
        dataKey
      )}/file?${query.toString()}`
    )
    printJson({ ok: true })
  }
)
