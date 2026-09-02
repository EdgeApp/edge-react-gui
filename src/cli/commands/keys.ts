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
      await ctx.client.get(`/account/${encodeURIComponent(sessionId)}/all-keys`)
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
        `/account/${encodeURIComponent(sessionId)}/create-wallet`,
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
        `/account/${encodeURIComponent(
          sessionId
        )}/get-raw-private-key?walletId=${encodeURIComponent(walletId!)}`
      )
    )
  }
)

const getWalletInfoCmd = command(
  'get-wallet-info',
  {
    usage: 'get-wallet-info <walletId>',
    help: 'Read one wallet’s key info (account.getWalletInfo)',
    needsSession: true
  },
  async (ctx, argv) => {
    const { positional: id } = parseCommandArgs(getWalletInfoCmd, argv, {
      positional: 'required'
    })
    const sessionId = requireSession(ctx)
    printJson(
      await ctx.client.get(
        `/account/${encodeURIComponent(
          sessionId
        )}/get-wallet-info?id=${encodeURIComponent(id!)}`
      )
    )
  }
)

const getRawPublicKeyCmd = command(
  'get-raw-public-key',
  {
    usage: 'get-raw-public-key <walletId>',
    help: 'Read raw public key material (account.getRawPublicKey)',
    needsSession: true
  },
  async (ctx, argv) => {
    const { positional: walletId } = parseCommandArgs(
      getRawPublicKeyCmd,
      argv,
      {
        positional: 'required'
      }
    )
    const sessionId = requireSession(ctx)
    printJson(
      await ctx.client.get(
        `/account/${encodeURIComponent(
          sessionId
        )}/get-raw-public-key?walletId=${encodeURIComponent(walletId!)}`
      )
    )
  }
)

const splittableTypesCmd = command(
  'list-splittable-wallet-types',
  {
    usage: 'list-splittable-wallet-types <walletId>',
    help: 'List chains a wallet can split into (account.listSplittableWalletTypes)',
    needsSession: true
  },
  async (ctx, argv) => {
    const { positional: walletId } = parseCommandArgs(
      splittableTypesCmd,
      argv,
      {
        positional: 'required'
      }
    )
    const sessionId = requireSession(ctx)
    printJson(
      await ctx.client.get(
        `/account/${encodeURIComponent(
          sessionId
        )}/list-splittable-wallet-types?walletId=${encodeURIComponent(
          walletId!
        )}`
      )
    )
  }
)
