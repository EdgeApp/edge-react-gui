import { printJson } from '../client/output'
import { command, requireSession } from '../command'
import { parseCommandArgs } from '../commandArgs'

function accountPath(sessionId: string, suffix: string): string {
  return `/accounts/${encodeURIComponent(sessionId)}${suffix}`
}

const ratesQueryCmd = command(
  'rates-query',
  {
    usage: "rates-query --body='<json>'",
    help: 'Batch crypto/fiat rate lookups (JSON body). Omit date to use now (ISO sent to rates server)'
  },
  async (ctx, argv) => {
    const args = parseCommandArgs(ratesQueryCmd, argv, {
      positional: 'none',
      flags: { body: 'string' }
    })
    const body = JSON.parse(args.requireString('body'))
    printJson(await ctx.client.post('/rates/query', body))
  }
)

const ratesUsdToNativeCmd = command(
  'rates-usd-to-native',
  {
    usage:
      'rates-usd-to-native --usd-amount=<n> --plugin-id=<id> [--token-id=<id>]',
    help: 'Convert a USD amount to native crypto units via rates3/4'
  },
  async (ctx, argv) => {
    const args = parseCommandArgs(ratesUsdToNativeCmd, argv, {
      positional: 'none',
      flags: {
        'usd-amount': 'string',
        'plugin-id': 'string',
        'token-id': 'string'
      }
    })
    printJson(
      await ctx.client.post('/rates/usd-to-native', {
        usdAmount: args.requireString('usd-amount'),
        pluginId: args.requireString('plugin-id'),
        tokenId: args.string('token-id') ?? null
      })
    )
  }
)

const swapQuoteCmd = command(
  'fetch-swap-quotes',
  {
    usage:
      'fetch-swap-quotes --from-wallet-id=<id> --to-wallet-id=<id> --native-amount=<n> [--quote-for=from|to|max] [--plugin-id=<id>] [--from-token-id=<id>] [--to-token-id=<id>]',
    help: 'Fetch swap quotes; each quote is an objectId handle (5 min TTL)',
    needsSession: true
  },
  async (ctx, argv) => {
    const args = parseCommandArgs(swapQuoteCmd, argv, {
      positional: 'none',
      flags: {
        'from-wallet-id': 'string',
        'to-wallet-id': 'string',
        'native-amount': 'string',
        'quote-for': 'string',
        'plugin-id': 'string',
        'from-token-id': 'string',
        'to-token-id': 'string'
      }
    })
    const sessionId = requireSession(ctx)
    printJson(
      await ctx.client.post(accountPath(sessionId, '/fetch-swap-quotes'), {
        fromWalletId: args.requireString('from-wallet-id'),
        toWalletId: args.requireString('to-wallet-id'),
        fromTokenId: args.string('from-token-id') ?? null,
        toTokenId: args.string('to-token-id') ?? null,
        nativeAmount: args.requireString('native-amount'),
        quoteFor: args.string('quote-for') ?? 'from',
        preferPluginId: args.string('plugin-id')
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
    const { positional: objectId } = parseCommandArgs(swapQuoteGetCmd, argv, {
      positional: 'required'
    })
    const sessionId = requireSession(ctx)
    printJson(
      await ctx.client.get(
        accountPath(sessionId, `/swap-quotes/${encodeURIComponent(objectId!)}`)
      )
    )
  }
)

const swapApproveCmd = command(
  'approve-swap-quote',
  {
    usage: 'approve-swap-quote <objectId>',
    help: 'Approve/execute a staged swap quote and release the handle',
    needsSession: true
  },
  async (ctx, argv) => {
    const { positional: objectId } = parseCommandArgs(swapApproveCmd, argv, {
      positional: 'required'
    })
    const sessionId = requireSession(ctx)
    printJson(
      await ctx.client.post(
        accountPath(
          sessionId,
          `/swap-quotes/${encodeURIComponent(objectId!)}/approve`
        )
      )
    )
  }
)

const swapQuoteCloseCmd = command(
  'close-swap-quote',
  {
    usage: 'close-swap-quote <objectId>',
    help: 'Close a staged swap quote without executing',
    needsSession: true
  },
  async (ctx, argv) => {
    const { positional: objectId } = parseCommandArgs(swapQuoteCloseCmd, argv, {
      positional: 'required'
    })
    const sessionId = requireSession(ctx)
    printJson(
      await ctx.client.post(
        accountPath(
          sessionId,
          `/swap-quotes/${encodeURIComponent(objectId!)}/close`
        )
      )
    )
  }
)
