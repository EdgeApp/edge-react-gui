import { printJson } from '../client/output'
import { command, requireSession, UsageError } from '../command'
import { parseCommandArgs } from '../commandArgs'

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
    usage: "key-add --key-info='<key-info-json>'",
    help: 'Create a wallet from raw key JSON, e.g. {"type":"wallet:bitcoin","keys":{...}}',
    needsSession: true
  },
  async (ctx, argv) => {
    const args = parseCommandArgs(keyAddCmd, argv, {
      positional: 'none',
      flags: { 'key-info': 'string' }
    })
    let body: unknown
    try {
      body = JSON.parse(args.requireString('key-info'))
    } catch {
      throw new UsageError(keyAddCmd, '--key-info must be valid JSON')
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
    const { positional: walletId } = parseCommandArgs(keyGetCmd, argv, {
      positional: 'required'
    })
    const sessionId = requireSession(ctx)
    printJson(
      await ctx.client.get(
        `/v1/accounts/${encodeURIComponent(
          sessionId
        )}/keys/${encodeURIComponent(walletId!)}/private-raw`
      )
    )
  }
)
