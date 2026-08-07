import { printJson } from '../client/output'
import {
  type CliContext,
  command,
  requireSession,
  UsageError
} from '../command'

function walletPath(sessionId: string, walletId: string, suffix = ''): string {
  return `/v1/accounts/${encodeURIComponent(
    sessionId
  )}/wallets/${encodeURIComponent(walletId)}${suffix}`
}

const walletCreateCmd = command(
  'wallet-create',
  {
    usage: 'wallet-create <walletType> [<name>]',
    help: 'Create a new currency wallet',
    needsSession: true
  },
  async (ctx, argv) => {
    if (argv.length < 1 || argv.length > 2)
      throw new UsageError(walletCreateCmd)
    const [walletType, name] = argv
    const sessionId = requireSession(ctx)
    printJson(
      await ctx.client.post(
        `/v1/accounts/${encodeURIComponent(sessionId)}/wallets`,
        { walletType, name }
      )
    )
  }
)

command(
  'wallet-list',
  {
    usage: 'wallet-list [--filter=active|archived|hidden|all] [--no-wait]',
    help: 'List wallets in the current account',
    needsSession: true
  },
  async (ctx, argv) => {
    const sessionId = requireSession(ctx)
    const filterArg = argv.find(arg => arg.startsWith('--filter='))
    const filter =
      filterArg != null ? filterArg.slice('--filter='.length) : undefined
    const waitForAll = !argv.includes('--no-wait')
    const query = new URLSearchParams()
    if (filter != null) query.set('filter', filter)
    query.set('waitForAll', String(waitForAll))
    printJson(
      await ctx.client.get(
        `/v1/accounts/${encodeURIComponent(
          sessionId
        )}/wallets?${query.toString()}`
      )
    )
  }
)

const walletInfoCmd = command(
  'wallet-info',
  {
    usage: 'wallet-info <walletId>',
    help: 'Show detailed information about a wallet',
    needsSession: true
  },
  async (ctx, argv) => {
    if (argv.length !== 1) throw new UsageError(walletInfoCmd)
    const [walletId] = argv
    const sessionId = requireSession(ctx)
    printJson(await ctx.client.get(walletPath(sessionId, walletId)))
  }
)

const walletRenameCmd = command(
  'wallet-rename',
  {
    usage: 'wallet-rename <walletId> <name>',
    help: 'Rename a wallet',
    needsSession: true
  },
  async (ctx, argv) => {
    if (argv.length !== 2) throw new UsageError(walletRenameCmd)
    const [walletId, name] = argv
    const sessionId = requireSession(ctx)
    printJson(await ctx.client.patch(walletPath(sessionId, walletId), { name }))
  }
)

async function patchWalletState(
  ctx: CliContext,
  sessionId: string,
  walletId: string,
  state: Record<string, unknown>
): Promise<void> {
  await ctx.client.patch(
    `/v1/accounts/${encodeURIComponent(sessionId)}/wallet-states`,
    { [walletId]: state }
  )
}

const walletArchiveCmd = command(
  'wallet-archive',
  {
    usage: 'wallet-archive <walletId>',
    help: 'Archive a wallet',
    needsSession: true
  },
  async (ctx, argv) => {
    if (argv.length !== 1) throw new UsageError(walletArchiveCmd)
    const [walletId] = argv
    const sessionId = requireSession(ctx)
    await patchWalletState(ctx, sessionId, walletId, { archived: true })
    printJson({ ok: true })
  }
)

const walletUnarchiveCmd = command(
  'wallet-unarchive',
  {
    usage: 'wallet-unarchive <walletId>',
    help: 'Unarchive a wallet',
    needsSession: true
  },
  async (ctx, argv) => {
    if (argv.length !== 1) throw new UsageError(walletUnarchiveCmd)
    const [walletId] = argv
    const sessionId = requireSession(ctx)
    await patchWalletState(ctx, sessionId, walletId, { archived: false })
    printJson({ ok: true })
  }
)

const walletUndeleteCmd = command(
  'wallet-undelete',
  {
    usage: 'wallet-undelete <walletId>',
    help: 'Undelete a wallet',
    needsSession: true
  },
  async (ctx, argv) => {
    if (argv.length !== 1) throw new UsageError(walletUndeleteCmd)
    const [walletId] = argv
    const sessionId = requireSession(ctx)
    await patchWalletState(ctx, sessionId, walletId, { deleted: false })
    printJson({ ok: true })
  }
)

const balanceCmd = command(
  'balance',
  {
    usage: 'balance <walletId> [<tokenId>]',
    help: 'Show native and exchange balance for a wallet (or one token)',
    needsSession: true
  },
  async (ctx, argv) => {
    if (argv.length < 1 || argv.length > 2) throw new UsageError(balanceCmd)
    const [walletId, tokenId] = argv
    const sessionId = requireSession(ctx)
    const suffix =
      tokenId != null ? `/balances/${encodeURIComponent(tokenId)}` : '/balances'
    printJson(await ctx.client.get(walletPath(sessionId, walletId, suffix)))
  }
)

const addressCmd = command(
  'address',
  {
    usage: 'address <walletId> [<tokenId>]',
    help: 'Show receive addresses for a wallet',
    needsSession: true
  },
  async (ctx, argv) => {
    if (argv.length < 1 || argv.length > 2) throw new UsageError(addressCmd)
    const [walletId, tokenId] = argv
    const sessionId = requireSession(ctx)
    const query =
      tokenId != null ? `?tokenId=${encodeURIComponent(tokenId)}` : ''
    printJson(
      await ctx.client.get(
        walletPath(sessionId, walletId, `/addresses${query}`)
      )
    )
  }
)

const txListCmd = command(
  'tx-list',
  {
    usage:
      'tx-list <walletId> [<tokenId>] [<limit>] [<startDate>] [<endDate>] [<search>]',
    help: 'List transactions in a wallet',
    needsSession: true
  },
  async (ctx, argv) => {
    if (argv.length < 1 || argv.length > 6) throw new UsageError(txListCmd)
    const [walletId, tokenId, limit, startDate, endDate, search] = argv
    const sessionId = requireSession(ctx)
    const query = new URLSearchParams()
    if (tokenId != null) query.set('tokenId', tokenId)
    if (limit != null) query.set('limit', limit)
    if (startDate != null) query.set('startDate', startDate)
    if (endDate != null) query.set('endDate', endDate)
    if (search != null) query.set('search', search)
    const qs = query.toString()
    printJson(
      await ctx.client.get(
        walletPath(
          sessionId,
          walletId,
          `/transactions${qs !== '' ? `?${qs}` : ''}`
        )
      )
    )
  }
)

function parseDryRun(argv: string[]): { rest: string[]; dryRun: boolean } {
  const dryRun = argv.includes('--dry-run')
  return { rest: argv.filter(arg => arg !== '--dry-run'), dryRun }
}

const spendCmd = command(
  'spend',
  {
    usage: 'spend <walletId> <address> <amount> [<tokenId>] [--dry-run]',
    help: 'Send funds from a wallet',
    needsSession: true
  },
  async (ctx, argv) => {
    const { rest, dryRun } = parseDryRun(argv)
    if (rest.length < 3 || rest.length > 4) throw new UsageError(spendCmd)
    const [walletId, to, amount, tokenId] = rest
    const sessionId = requireSession(ctx)
    printJson(
      await ctx.client.post(walletPath(sessionId, walletId, '/spend'), {
        to,
        amount,
        tokenId,
        dryRun
      })
    )
  }
)

const spendMaxCmd = command(
  'spend-max',
  {
    usage: 'spend-max <walletId> <address> [<tokenId>] [--dry-run]',
    help: 'Send the entire spendable balance from a wallet',
    needsSession: true
  },
  async (ctx, argv) => {
    const { rest, dryRun } = parseDryRun(argv)
    if (rest.length < 2 || rest.length > 3) throw new UsageError(spendMaxCmd)
    const [walletId, to, tokenId] = rest
    const sessionId = requireSession(ctx)
    printJson(
      await ctx.client.post(walletPath(sessionId, walletId, '/spend'), {
        to,
        tokenId,
        useMax: true,
        dryRun
      })
    )
  }
)

const maxSpendableCmd = command(
  'max-spendable',
  {
    usage: 'max-spendable <walletId> <address> [<tokenId>]',
    help: 'Calculate the maximum spendable amount for a wallet',
    needsSession: true
  },
  async (ctx, argv) => {
    if (argv.length < 2 || argv.length > 3)
      throw new UsageError(maxSpendableCmd)
    const [walletId, to, tokenId] = argv
    const sessionId = requireSession(ctx)
    printJson(
      await ctx.client.post(walletPath(sessionId, walletId, '/max-spendable'), {
        to,
        tokenId
      })
    )
  }
)

const makeSpendCmd = command(
  'make-spend',
  {
    usage:
      "make-spend <walletId> <address> <amount> [<tokenId>] | make-spend <walletId> '<spendInfo-json>'",
    help: 'Build an unsigned spend; returns objectId (expires in 5 min)',
    needsSession: true
  },
  async (ctx, argv) => {
    if (argv.length < 2) throw new UsageError(makeSpendCmd)
    const [walletId, ...rest] = argv
    const sessionId = requireSession(ctx)
    let body: Record<string, unknown>
    if (rest.length === 1 && rest[0].trim().startsWith('{')) {
      body = { spendInfo: JSON.parse(rest[0]) }
    } else if (rest.length >= 2 && rest.length <= 3) {
      const [to, amount, tokenId] = rest
      body = { to, amount, tokenId }
    } else {
      throw new UsageError(makeSpendCmd)
    }
    printJson(
      await ctx.client.post(
        walletPath(sessionId, walletId, '/make-spend'),
        body
      )
    )
  }
)

const signTxCmd = command(
  'sign-tx',
  {
    usage: 'sign-tx <walletId> <objectId>',
    help: 'Sign a previously make-spend transaction by objectId',
    needsSession: true
  },
  async (ctx, argv) => {
    if (argv.length !== 2) throw new UsageError(signTxCmd)
    const [walletId, objectId] = argv
    const sessionId = requireSession(ctx)
    printJson(
      await ctx.client.post(walletPath(sessionId, walletId, '/sign-tx'), {
        objectId
      })
    )
  }
)

const broadcastTxCmd = command(
  'broadcast-tx',
  {
    usage: 'broadcast-tx <walletId> <objectId>',
    help: 'Broadcast a previously signed transaction by objectId',
    needsSession: true
  },
  async (ctx, argv) => {
    if (argv.length !== 2) throw new UsageError(broadcastTxCmd)
    const [walletId, objectId] = argv
    const sessionId = requireSession(ctx)
    printJson(
      await ctx.client.post(walletPath(sessionId, walletId, '/broadcast-tx'), {
        objectId
      })
    )
  }
)

const saveTxCmd = command(
  'save-tx',
  {
    usage: 'save-tx <walletId> <objectId>',
    help: 'Save a transaction by objectId and release the engine handle',
    needsSession: true
  },
  async (ctx, argv) => {
    if (argv.length !== 2) throw new UsageError(saveTxCmd)
    const [walletId, objectId] = argv
    const sessionId = requireSession(ctx)
    printJson(
      await ctx.client.post(walletPath(sessionId, walletId, '/save-tx'), {
        objectId
      })
    )
  }
)

const objectGetCmd = command(
  'object-get',
  {
    usage: 'object-get <objectId>',
    help: 'Inspect an ephemeral engine object handle',
    needsSession: true
  },
  async (ctx, argv) => {
    if (argv.length !== 1) throw new UsageError(objectGetCmd)
    const [objectId] = argv
    if (objectId === '') throw new UsageError(objectGetCmd)
    const sessionId = requireSession(ctx)
    printJson(
      await ctx.client.get(
        `/v1/accounts/${encodeURIComponent(
          sessionId
        )}/objects/${encodeURIComponent(objectId)}`
      )
    )
  }
)

const objectDeleteCmd = command(
  'object-delete',
  {
    usage: 'object-delete <objectId>',
    help: 'Release an ephemeral engine object handle early',
    needsSession: true
  },
  async (ctx, argv) => {
    if (argv.length !== 1) throw new UsageError(objectDeleteCmd)
    const [objectId] = argv
    const sessionId = requireSession(ctx)
    printJson(
      await ctx.client.delete(
        `/v1/accounts/${encodeURIComponent(
          sessionId
        )}/objects/${encodeURIComponent(objectId)}`
      )
    )
  }
)

const tokenListCmd = command(
  'token-list',
  {
    usage: 'token-list <walletId>',
    help: 'List available, enabled, and detected tokens for a wallet',
    needsSession: true
  },
  async (ctx, argv) => {
    if (argv.length !== 1) throw new UsageError(tokenListCmd)
    const [walletId] = argv
    const sessionId = requireSession(ctx)
    printJson(await ctx.client.get(walletPath(sessionId, walletId, '/tokens')))
  }
)

const tokenEnableCmd = command(
  'token-enable',
  {
    usage: 'token-enable <walletId> <tokenId>',
    help: 'Enable a token on a wallet',
    needsSession: true
  },
  async (ctx, argv) => {
    if (argv.length !== 2) throw new UsageError(tokenEnableCmd)
    const [walletId, tokenId] = argv
    const sessionId = requireSession(ctx)
    printJson(
      await ctx.client.post(
        walletPath(sessionId, walletId, '/enabled-tokens'),
        {
          tokenId
        }
      )
    )
  }
)

const tokenDisableCmd = command(
  'token-disable',
  {
    usage: 'token-disable <walletId> <tokenId>',
    help: 'Disable a token on a wallet',
    needsSession: true
  },
  async (ctx, argv) => {
    if (argv.length !== 2) throw new UsageError(tokenDisableCmd)
    const [walletId, tokenId] = argv
    const sessionId = requireSession(ctx)
    printJson(
      await ctx.client.delete(
        walletPath(
          sessionId,
          walletId,
          `/enabled-tokens/${encodeURIComponent(tokenId)}`
        )
      )
    )
  }
)

const tokenDetectedCmd = command(
  'token-detected',
  {
    usage: 'token-detected <walletId>',
    help: 'List detected but unenabled tokens for a wallet',
    needsSession: true
  },
  async (ctx, argv) => {
    if (argv.length !== 1) throw new UsageError(tokenDetectedCmd)
    const [walletId] = argv
    const sessionId = requireSession(ctx)
    const info = await ctx.client.get<{ detectedTokenIds: string[] }>(
      walletPath(sessionId, walletId, '/tokens')
    )
    printJson({ detectedTokenIds: info.detectedTokenIds })
  }
)

const exportPublicCmd = command(
  'export-public',
  {
    usage: 'export-public <walletId>',
    help: 'Export the public key for a wallet (xpub, address, etc.)',
    needsSession: true
  },
  async (ctx, argv) => {
    if (argv.length !== 1) throw new UsageError(exportPublicCmd)
    const [walletId] = argv
    const sessionId = requireSession(ctx)
    printJson(
      await ctx.client.get(
        `/v1/accounts/${encodeURIComponent(
          sessionId
        )}/keys/${encodeURIComponent(walletId)}/public-display`
      )
    )
  }
)

const exportPrivateCmd = command(
  'export-private',
  {
    usage: 'export-private <walletId>',
    help: 'Export the private key for a wallet (WIF, seed, etc.)',
    needsSession: true
  },
  async (ctx, argv) => {
    if (argv.length !== 1) throw new UsageError(exportPrivateCmd)
    const [walletId] = argv
    const sessionId = requireSession(ctx)
    printJson(
      await ctx.client.get(
        `/v1/accounts/${encodeURIComponent(
          sessionId
        )}/keys/${encodeURIComponent(walletId)}/private-display`
      )
    )
  }
)

command(
  'plugin-list',
  {
    usage: 'plugin-list',
    help: 'List currency plugins available for wallet-create'
  },
  async ctx => {
    printJson(await ctx.client.get('/v1/currency-configs'))
  }
)
