import { printJson } from '../client/output'
import { command, requireSession, UsageError } from '../command'

const dataStoreListCmd = command(
  'data-store-list',
  {
    usage: 'data-store-list [<storeId>]',
    help: 'List data-store ids, or item ids within a store',
    needsSession: true
  },
  async (ctx, argv) => {
    if (argv.length > 1) throw new UsageError(dataStoreListCmd)
    const [storeId] = argv
    const sessionId = requireSession(ctx)
    const base = `/v1/accounts/${encodeURIComponent(sessionId)}/data-stores`
    printJson(
      await ctx.client.get(
        storeId != null ? `${base}/${encodeURIComponent(storeId)}` : base
      )
    )
  }
)

const dataStoreGetCmd = command(
  'data-store-get',
  {
    usage: 'data-store-get <storeId> <itemId>',
    help: 'Read a data-store item',
    needsSession: true
  },
  async (ctx, argv) => {
    if (argv.length !== 2) throw new UsageError(dataStoreGetCmd)
    const [storeId, itemId] = argv
    const sessionId = requireSession(ctx)
    printJson(
      await ctx.client.get(
        `/v1/accounts/${encodeURIComponent(
          sessionId
        )}/data-stores/${encodeURIComponent(
          storeId
        )}/items/${encodeURIComponent(itemId)}`
      )
    )
  }
)

const dataStoreSetCmd = command(
  'data-store-set',
  {
    usage: 'data-store-set <storeId> <itemId> <value>',
    help: 'Write a data-store item',
    needsSession: true
  },
  async (ctx, argv) => {
    if (argv.length !== 3) throw new UsageError(dataStoreSetCmd)
    const [storeId, itemId, value] = argv
    const sessionId = requireSession(ctx)
    await ctx.client.put(
      `/v1/accounts/${encodeURIComponent(
        sessionId
      )}/data-stores/${encodeURIComponent(storeId)}/items/${encodeURIComponent(
        itemId
      )}`,
      { value }
    )
    printJson({ ok: true })
  }
)

const dataStoreDeleteCmd = command(
  'data-store-delete',
  {
    usage: 'data-store-delete <storeId> [<itemId>]',
    help: 'Delete a data-store item, or an entire store',
    needsSession: true
  },
  async (ctx, argv) => {
    if (argv.length < 1 || argv.length > 2)
      throw new UsageError(dataStoreDeleteCmd)
    const [storeId, itemId] = argv
    const sessionId = requireSession(ctx)
    const base = `/v1/accounts/${encodeURIComponent(
      sessionId
    )}/data-stores/${encodeURIComponent(storeId)}`
    await ctx.client.delete(
      itemId != null ? `${base}/items/${encodeURIComponent(itemId)}` : base
    )
    printJson({ ok: true })
  }
)
