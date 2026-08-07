import { printJson } from '../client/output'
import { command, requireSession, UsageError } from '../command'

function accountPath(sessionId: string, suffix: string): string {
  return `/v1/accounts/${encodeURIComponent(sessionId)}${suffix}`
}

const ratesQueryCmd = command(
  'rates-query',
  {
    usage: 'rates-query <jsonBody>',
    help: 'Batch crypto/fiat rate lookups (JSON body). Omit date to use now (ISO sent to rates server)'
  },
  async (ctx, argv) => {
    if (argv.length !== 1) throw new UsageError(ratesQueryCmd)
    let body: unknown
    try {
      body = JSON.parse(argv[0])
    } catch {
      throw new Error('rates-query body must be valid JSON')
    }
    printJson(await ctx.client.post('/v1/rates/query', body))
  }
)

const ratesUsdToNativeCmd = command(
  'rates-usd-to-native',
  {
    usage: 'rates-usd-to-native <usdAmount> <pluginId> [<tokenId>]',
    help: 'Convert a USD amount to native crypto units via rates3/4'
  },
  async (ctx, argv) => {
    if (argv.length < 2 || argv.length > 3)
      throw new UsageError(ratesUsdToNativeCmd)
    const [usdAmount, pluginId, tokenId] = argv
    printJson(
      await ctx.client.post('/v1/rates/usd-to-native', {
        usdAmount,
        pluginId,
        tokenId: tokenId === 'null' || tokenId == null ? null : tokenId
      })
    )
  }
)

const swapQuoteCmd = command(
  'swap-quote',
  {
    usage:
      'swap-quote <fromWalletId> <toWalletId> <nativeAmount> [from|to|max] [<preferPluginId>]',
    help: 'Fetch swap quotes; each quote is an objectId handle (5 min TTL)',
    needsSession: true
  },
  async (ctx, argv) => {
    if (argv.length < 3 || argv.length > 5) throw new UsageError(swapQuoteCmd)
    const [fromWalletId, toWalletId, nativeAmount, quoteFor, preferPluginId] =
      argv
    const sessionId = requireSession(ctx)
    printJson(
      await ctx.client.post(accountPath(sessionId, '/swap/quotes'), {
        fromWalletId,
        toWalletId,
        fromTokenId: null,
        toTokenId: null,
        nativeAmount,
        quoteFor: quoteFor ?? 'from',
        preferPluginId
      })
    )
  }
)

const swapQuoteGetCmd = command(
  'swap-quote-get',
  {
    usage: 'swap-quote-get <objectId>',
    help: 'Inspect a staged swap quote handle',
    needsSession: true
  },
  async (ctx, argv) => {
    if (argv.length !== 1) throw new UsageError(swapQuoteGetCmd)
    const [objectId] = argv
    const sessionId = requireSession(ctx)
    printJson(
      await ctx.client.get(
        accountPath(sessionId, `/swap/quotes/${encodeURIComponent(objectId)}`)
      )
    )
  }
)

const swapApproveCmd = command(
  'swap-approve',
  {
    usage: 'swap-approve <objectId>',
    help: 'Approve/execute a staged swap quote and release the handle',
    needsSession: true
  },
  async (ctx, argv) => {
    if (argv.length !== 1) throw new UsageError(swapApproveCmd)
    const [objectId] = argv
    const sessionId = requireSession(ctx)
    printJson(
      await ctx.client.post(
        accountPath(
          sessionId,
          `/swap/quotes/${encodeURIComponent(objectId)}/approve`
        )
      )
    )
  }
)

const swapQuoteCloseCmd = command(
  'swap-quote-close',
  {
    usage: 'swap-quote-close <objectId>',
    help: 'Close a staged swap quote without executing',
    needsSession: true
  },
  async (ctx, argv) => {
    if (argv.length !== 1) throw new UsageError(swapQuoteCloseCmd)
    const [objectId] = argv
    const sessionId = requireSession(ctx)
    printJson(
      await ctx.client.delete(
        accountPath(sessionId, `/swap/quotes/${encodeURIComponent(objectId)}`)
      )
    )
  }
)
