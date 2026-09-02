import { f, opt, s } from '../schema'
import { endpoint, group } from '../types'
import { sessionId } from './common'

export const swapGroup = group({
  id: 'swap',
  title: 'Swap',
  doc: 'Cross-asset exchange. Quotes are live objects held server-side under a `swap_` handle, so approving one means naming its `objectId` rather than re-uploading the quote.',
  endpoints: [
    endpoint({
      id: 'fetchSwapQuotes',
      coreCall: 'account.fetchSwapQuotes',
      summary: 'Fetch swap quotes',
      description:
        'Polls every enabled swap plugin and parks each result as its own 5-minute handle.',
      method: 'POST',
      path: '/account/{sessionId}/fetch-swap-quotes',
      source: 'src/cli/engine/routes/swap.ts',
      cli: [
        {
          command: 'fetch-swap-quotes',
          usage:
            'fetch-swap-quotes --from-wallet-id=<id> --to-wallet-id=<id> --native-amount=<n> [--quote-for=from|to|max] [--plugin-id=<id>] [--from-token-id=<id>] [--to-token-id=<id>]',
          flags: [
            {
              flag: '--from-wallet-id=<id>',
              maps: 'fromWalletId',
              target: 'body'
            },
            { flag: '--to-wallet-id=<id>', maps: 'toWalletId', target: 'body' },
            {
              flag: '--native-amount=<n>',
              maps: 'nativeAmount',
              target: 'body'
            },
            { flag: '--quote-for=<mode>', maps: 'quoteFor', target: 'body' },
            {
              flag: '--plugin-id=<id>',
              maps: 'preferPluginId',
              target: 'body'
            },
            {
              flag: '--from-token-id=<id>',
              maps: 'fromTokenId',
              target: 'body'
            },
            { flag: '--to-token-id=<id>', maps: 'toTokenId', target: 'body' }
          ],
          example:
            'edge-cli fetch-swap-quotes --from-wallet-id=abc123 --to-wallet-id=def456 --native-amount=90000'
        }
      ],
      pathParams: [sessionId],
      body: s.object([
        f('fromWalletId', s.string(), 'Accepts a unique prefix.'),
        f('toWalletId', s.string()),
        f('nativeAmount', s.amount('90000')),
        opt('fromTokenId', s.tokenId()),
        opt('toTokenId', s.tokenId()),
        opt(
          'quoteFor',
          s.string({ enum: ['from', 'to', 'max'] }),
          'Default `from`.'
        ),
        opt(
          'preferPluginId',
          s.string({ example: 'changenow' }),
          'Restrict to one exchange.'
        )
      ]),
      bodyDoc:
        '`quoteFor: "from"` spends that much of the source; `"to"` receives that much at the destination; `"max"` sends everything.',
      success: {
        status: 200,
        schema: s.object([
          f('quoteCount', s.int(1)),
          f('quotes', s.array(s.ref('SwapQuote')))
        ])
      },
      errors: [
        'BAD_REQUEST',
        'SWAP_BELOW_LIMIT',
        'SWAP_ABOVE_LIMIT',
        'SWAP_CURRENCY',
        'SWAP_PERMISSION',
        'SWAP_ADDRESS',
        'SAME_CURRENCY',
        'INSUFFICIENT_FUNDS',
        'WALLET_NOT_FOUND',
        'NETWORK_ERROR'
      ],
      notes: [
        'Every returned quote holds an open plugin object. Approving one deletes only that handle — release the rest with `close-swap-quote`, or let them expire in 5 minutes.',
        'An empty `quotes` array with `quoteCount: 0` is a success, not an error: no plugin could serve the pair.'
      ]
    }),

    endpoint({
      id: 'getSwapQuote',
      coreCall: null,
      coreNote:
        'Engine handle store; the quote is a live EdgeSwapQuote held server-side.',
      summary: 'Re-read a quote',
      method: 'GET',
      path: '/account/{sessionId}/swap-quotes/{objectId}',
      source: 'src/cli/engine/routes/swap.ts',
      cli: [
        {
          command: 'swap-quote-get',
          usage: 'swap-quote-get <objectId>',
          example: 'edge-cli swap-quote-get swap_7Qk3…'
        }
      ],
      pathParams: [
        sessionId,
        { name: 'objectId', schema: s.string({ example: 'swap_7Qk3…' }) }
      ],
      success: { status: 200, schema: s.ref('SwapQuote') },
      errors: [
        'OBJECT_NOT_FOUND',
        'OBJECT_EXPIRED',
        'OBJECT_KIND_MISMATCH',
        'OBJECT_SESSION_MISMATCH'
      ],
      notes: [
        'Check `quoteExpirationDate` as well as `expiresAt` — the plugin’s price can go stale before the handle does.'
      ]
    }),

    endpoint({
      id: 'approveSwapQuote',
      coreCall: 'EdgeSwapQuote.approve',
      summary: 'Execute a quote',
      description:
        '**Moves funds.** Calls `quote.approve()`, then releases the handle.',
      method: 'POST',
      path: '/account/{sessionId}/swap-quotes/{objectId}/approve',
      source: 'src/cli/engine/routes/swap.ts',
      cli: [
        {
          command: 'approve-swap-quote',
          usage: 'approve-swap-quote <objectId>',
          example: 'edge-cli approve-swap-quote swap_7Qk3…'
        }
      ],
      pathParams: [sessionId, { name: 'objectId', schema: s.string() }],
      body: s.object([], { open: true }),
      bodyDoc: 'None. The quote already holds every parameter.',
      success: {
        status: 200,
        schema: s.object([
          f('ok', s.boolean()),
          f('objectId', s.string(), 'The handle that was consumed.'),
          f(
            'orderId',
            s.union(s.string(), s.null()),
            'The exchange’s order reference, when it gives one.'
          ),
          f('destinationAddress', s.union(s.string(), s.null())),
          f(
            'transaction',
            s.core('EdgeTransaction'),
            'The on-chain send to the exchange.'
          )
        ])
      },
      errors: [
        'OBJECT_NOT_FOUND',
        'OBJECT_EXPIRED',
        'OBJECT_KIND_MISMATCH',
        'OBJECT_SESSION_MISMATCH',
        'INSUFFICIENT_FUNDS',
        'NETWORK_ERROR'
      ],
      notes: [
        'The plugin attaches its own `savedAction` / `assetAction` metadata; the engine adds none.',
        'The handle is deleted whether or not you read the response, so record `orderId` from it.'
      ]
    }),

    endpoint({
      id: 'closeSwapQuote',
      coreCall: 'EdgeSwapQuote.close',
      summary: 'Discard a quote',
      description:
        'Closes the plugin object without executing, freeing whatever the exchange was holding.',
      method: 'POST',
      path: '/account/{sessionId}/swap-quotes/{objectId}/close',
      source: 'src/cli/engine/routes/swap.ts',
      cli: [
        {
          command: 'close-swap-quote',
          usage: 'close-swap-quote <objectId>',
          example: 'edge-cli close-swap-quote swap_7Qk3…'
        }
      ],
      pathParams: [sessionId, { name: 'objectId', schema: s.string() }],
      success: { status: 200, schema: s.ref('OkObject') },
      errors: [
        'OBJECT_NOT_FOUND',
        'OBJECT_EXPIRED',
        'OBJECT_KIND_MISMATCH',
        'OBJECT_SESSION_MISMATCH'
      ]
    })
  ]
})
