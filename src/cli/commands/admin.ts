/**
 * Internal / debugging commands over context.$internalStuff. Prefixed with
 * "admin-" so they stay out of normal workflows. Paths mirror
 * src/cli/engine/routes/admin.ts exactly.
 */
import { printJson } from '../client/output'
import { command, UsageError } from '../command'
import { parseCommandArgs } from '../commandArgs'

function parseJsonFlag(
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
    usage: "admin-auth-request --method=<m> --path=<path> [--body='<json>']",
    help: 'Make a raw request to the login/auth server'
  },
  async (ctx, argv) => {
    const args = parseCommandArgs(adminAuthRequestCmd, argv, {
      positional: 'none',
      flags: { method: 'string', path: 'string', body: 'string' }
    })
    const bodyRaw = args.string('body')
    const body =
      bodyRaw != null ? parseJsonFlag(adminAuthRequestCmd, bodyRaw) : undefined
    printJson(
      await ctx.client.post('/v1/admin/auth-request', {
        method: args.requireString('method'),
        path: args.requireString('path'),
        body
      })
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
    const { positional: username } = parseCommandArgs(
      adminHashUsernameCmd,
      argv,
      { positional: 'required' }
    )
    const query = new URLSearchParams({ username: username! })
    printJson(
      await ctx.client.get(`/v1/admin/hash-username?${query.toString()}`)
    )
  }
)

const adminLobbyCreateCmd = command(
  'admin-lobby-create',
  {
    usage: "admin-lobby-create [--body='<json>'] [--period-seconds=<n>]",
    help: 'Create a lobby and return its id and current replies'
  },
  async (ctx, argv) => {
    const args = parseCommandArgs(adminLobbyCreateCmd, argv, {
      positional: 'none',
      flags: { body: 'string', 'period-seconds': 'string' }
    })
    const bodyRaw = args.string('body')
    const lobbyRequest =
      bodyRaw != null ? parseJsonFlag(adminLobbyCreateCmd, bodyRaw) : undefined
    const periodRaw = args.string('period-seconds')
    let period: number | undefined
    if (periodRaw != null) {
      period = Number(periodRaw)
      if (!Number.isFinite(period)) {
        throw new UsageError(
          adminLobbyCreateCmd,
          '--period-seconds must be a number'
        )
      }
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
    const { positional: lobbyId } = parseCommandArgs(adminLobbyFetchCmd, argv, {
      positional: 'required'
    })
    printJson(
      await ctx.client.get(`/v1/admin/lobby/${encodeURIComponent(lobbyId!)}`)
    )
  }
)

const adminLobbyReplyCmd = command(
  'admin-lobby-reply',
  {
    usage:
      "admin-lobby-reply <lobbyId> --lobby-request='<json>' [--reply-data='<json>']",
    help: 'Send a reply to a lobby'
  },
  async (ctx, argv) => {
    const args = parseCommandArgs(adminLobbyReplyCmd, argv, {
      positional: 'required',
      flags: { 'lobby-request': 'string', 'reply-data': 'string' }
    })
    const lobbyRequest = parseJsonFlag(
      adminLobbyReplyCmd,
      args.requireString('lobby-request')
    )
    const replyRaw = args.string('reply-data')
    const replyData =
      replyRaw != null ? parseJsonFlag(adminLobbyReplyCmd, replyRaw) : undefined
    await ctx.client.post(
      `/v1/admin/lobby/${encodeURIComponent(args.positional!)}/reply`,
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
    const { positional: syncKey } = parseCommandArgs(adminRepoSyncCmd, argv, {
      positional: 'required'
    })
    printJson(await ctx.client.post('/v1/admin/repos/sync', { syncKey }))
  }
)

const adminRepoListCmd = command(
  'admin-repo-list',
  {
    usage: 'admin-repo-list <syncKey> --data-key=<key> [--path=<path>]',
    help: 'List files in a repo (optionally under a subdirectory)'
  },
  async (ctx, argv) => {
    const args = parseCommandArgs(adminRepoListCmd, argv, {
      positional: 'required',
      flags: { 'data-key': 'string', path: 'string' }
    })
    const path = args.string('path')
    const query =
      path != null ? `?${new URLSearchParams({ path }).toString()}` : ''
    printJson(
      await ctx.client.get(
        `/v1/admin/repos/${encodeURIComponent(
          args.positional!
        )}/${encodeURIComponent(args.requireString('data-key'))}/files${query}`
      )
    )
  }
)

const adminRepoGetCmd = command(
  'admin-repo-get',
  {
    usage: 'admin-repo-get <syncKey> --data-key=<key> --path=<path>',
    help: 'Read one file from a repo'
  },
  async (ctx, argv) => {
    const args = parseCommandArgs(adminRepoGetCmd, argv, {
      positional: 'required',
      flags: { 'data-key': 'string', path: 'string' }
    })
    const query = new URLSearchParams({ path: args.requireString('path') })
    printJson(
      await ctx.client.get(
        `/v1/admin/repos/${encodeURIComponent(
          args.positional!
        )}/${encodeURIComponent(
          args.requireString('data-key')
        )}/file?${query.toString()}`
      )
    )
  }
)

const adminRepoSetCmd = command(
  'admin-repo-set',
  {
    usage:
      'admin-repo-set <syncKey> --data-key=<key> --path=<path> --text=<text>',
    help: 'Write one file in a repo'
  },
  async (ctx, argv) => {
    const args = parseCommandArgs(adminRepoSetCmd, argv, {
      positional: 'required',
      flags: { 'data-key': 'string', path: 'string', text: 'string' }
    })
    const query = new URLSearchParams({ path: args.requireString('path') })
    await ctx.client.put(
      `/v1/admin/repos/${encodeURIComponent(
        args.positional!
      )}/${encodeURIComponent(
        args.requireString('data-key')
      )}/file?${query.toString()}`,
      { text: args.requireString('text') }
    )
    printJson({ ok: true })
  }
)

const adminRepoDeleteCmd = command(
  'admin-repo-delete',
  {
    usage: 'admin-repo-delete <syncKey> --data-key=<key> --path=<path>',
    help: 'Delete one file from a repo'
  },
  async (ctx, argv) => {
    const args = parseCommandArgs(adminRepoDeleteCmd, argv, {
      positional: 'required',
      flags: { 'data-key': 'string', path: 'string' }
    })
    const query = new URLSearchParams({ path: args.requireString('path') })
    await ctx.client.delete(
      `/v1/admin/repos/${encodeURIComponent(
        args.positional!
      )}/${encodeURIComponent(
        args.requireString('data-key')
      )}/file?${query.toString()}`
    )
    printJson({ ok: true })
  }
)
