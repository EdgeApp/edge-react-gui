import { printJson } from '../client/output'
import { command, requireSession, UsageError } from '../command'
import { parseCommandArgs } from '../commandArgs'

command(
  'all-keys',
  {
    usage: 'all-keys',
    help: 'List all keys in the account',
    needsSession: true
  },
  async ctx => {
    const sessionId = requireSession(ctx)
    printJson(
      await ctx.client.get(
        `/accounts/${encodeURIComponent(sessionId)}/all-keys`
      )
    )
  }
)

const keyAddCmd = command(
  'create-wallet',
  {
    usage: "create-wallet --key-info='<key-info-json>'",
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
        `/accounts/${encodeURIComponent(sessionId)}/create-wallet`,
        body
      )
    )
  }
)

const keyGetCmd = command(
  'get-raw-private-key',
  {
    usage: 'get-raw-private-key <walletId>',
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
        `/accounts/${encodeURIComponent(
          sessionId
        )}/get-raw-private-key?walletId=${encodeURIComponent(walletId!)}`
      )
    )
  }
)
