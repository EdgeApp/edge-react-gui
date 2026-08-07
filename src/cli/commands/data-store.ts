import { printJson } from '../client/output'
import { command, requireSession } from '../command'
import { parseCommandArgs } from '../commandArgs'

const dataStoreListCmd = command(
  'data-store-list',
  {
    usage: 'data-store-list [<storeId>]',
    help: 'List data-store ids, or item ids within a store',
    needsSession: true
  },
  async (ctx, argv) => {
    const { positional: storeId } = parseCommandArgs(dataStoreListCmd, argv, {
      positional: 'optional'
    })
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
    usage: 'data-store-get <storeId> --item-id=<itemId>',
    help: 'Read a data-store item',
    needsSession: true
  },
  async (ctx, argv) => {
    const args = parseCommandArgs(dataStoreGetCmd, argv, {
      positional: 'required',
      flags: { 'item-id': 'string' }
    })
    const sessionId = requireSession(ctx)
    const storeId = args.positional!
    const itemId = args.requireString('item-id')
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
    usage: 'data-store-set <storeId> --item-id=<itemId> --value=<text>',
    help: 'Write a data-store item',
    needsSession: true
  },
  async (ctx, argv) => {
    const args = parseCommandArgs(dataStoreSetCmd, argv, {
      positional: 'required',
      flags: { 'item-id': 'string', value: 'string' }
    })
    const sessionId = requireSession(ctx)
    const storeId = args.positional!
    const itemId = args.requireString('item-id')
    await ctx.client.put(
      `/v1/accounts/${encodeURIComponent(
        sessionId
      )}/data-stores/${encodeURIComponent(storeId)}/items/${encodeURIComponent(
        itemId
      )}`,
      { value: args.requireString('value') }
    )
    printJson({ ok: true })
  }
)

const dataStoreDeleteCmd = command(
  'data-store-delete',
  {
    usage: 'data-store-delete <storeId> [--item-id=<itemId>]',
    help: 'Delete a data-store item, or an entire store',
    needsSession: true
  },
  async (ctx, argv) => {
    const args = parseCommandArgs(dataStoreDeleteCmd, argv, {
      positional: 'required',
      flags: { 'item-id': 'string' }
    })
    const sessionId = requireSession(ctx)
    const storeId = args.positional!
    const itemId = args.string('item-id')
    const base = `/v1/accounts/${encodeURIComponent(
      sessionId
    )}/data-stores/${encodeURIComponent(storeId)}`
    await ctx.client.delete(
      itemId != null ? `${base}/items/${encodeURIComponent(itemId)}` : base
    )
    printJson({ ok: true })
  }
)
