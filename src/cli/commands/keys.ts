import { printJson } from '../client/output'
import { command, requireSession, UsageError } from '../command'

command(
  'key-list',
  {
    usage: 'key-list',
    help: 'List all keys in the account',
    needsSession: true
  },
  async ctx => {
    const sessionId = requireSession(ctx)
    printJson(
      await ctx.client.get(`/v1/accounts/${encodeURIComponent(sessionId)}/keys`)
    )
  }
)

const keyAddCmd = command(
  'key-add',
  {
    usage: "key-add '<key-info-json>'",
    help: 'Create a wallet from raw key JSON, e.g. {"type":"wallet:bitcoin","keys":{...}}',
    needsSession: true
  },
  async (ctx, argv) => {
    if (argv.length !== 1) throw new UsageError(keyAddCmd)
    const [json] = argv
    let body: unknown
    try {
      body = JSON.parse(json)
    } catch {
      throw new UsageError(keyAddCmd, 'Argument must be valid JSON')
    }
    const sessionId = requireSession(ctx)
    printJson(
      await ctx.client.post(
        `/v1/accounts/${encodeURIComponent(sessionId)}/keys`,
        body
      )
    )
  }
)

const keyGetCmd = command(
  'key-get',
  {
    usage: 'key-get <walletId>',
    help: 'Read the raw private key material for a wallet',
    needsSession: true
  },
  async (ctx, argv) => {
    if (argv.length !== 1) throw new UsageError(keyGetCmd)
    const [walletId] = argv
    const sessionId = requireSession(ctx)
    printJson(
      await ctx.client.get(
        `/v1/accounts/${encodeURIComponent(
          sessionId
        )}/keys/${encodeURIComponent(walletId)}/private-raw`
      )
    )
  }
)

const keyUndeleteCmd = command(
  'key-undelete',
  {
    usage: 'key-undelete <walletId>',
    help: "Clear a key's deleted flag",
    needsSession: true
  },
  async (ctx, argv) => {
    if (argv.length !== 1) throw new UsageError(keyUndeleteCmd)
    const [walletId] = argv
    const sessionId = requireSession(ctx)
    await ctx.client.patch(
      `/v1/accounts/${encodeURIComponent(sessionId)}/wallet-states`,
      { [walletId]: { deleted: false } }
    )
    printJson({ ok: true })
  }
)
