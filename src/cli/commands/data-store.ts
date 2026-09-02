import { printJson } from '../client/output'
import { command, requireSession } from '../command'
import { parseCommandArgs } from '../commandArgs'

function accountPath(sessionId: string, suffix: string): string {
  return `/account/${encodeURIComponent(sessionId)}${suffix}`
}

command(
  'list-store-ids',
  {
    usage: 'list-store-ids',
    help: 'List data-store ids in the account (account.dataStore.listStoreIds)',
    needsSession: true
  },
  async ctx => {
    const sessionId = requireSession(ctx)
    printJson(await ctx.client.get(accountPath(sessionId, '/list-store-ids')))
  }
)

const listItemIdsCmd = command(
  'list-item-ids',
  {
    usage: 'list-item-ids <storeId>',
    help: 'List item ids in one store (account.dataStore.listItemIds)',
    needsSession: true
  },
  async (ctx, argv) => {
    const { positional: storeId } = parseCommandArgs(listItemIdsCmd, argv, {
      positional: 'required'
    })
    const sessionId = requireSession(ctx)
    printJson(
      await ctx.client.get(
        accountPath(
          sessionId,
          `/list-item-ids?storeId=${encodeURIComponent(storeId!)}`
        )
      )
    )
  }
)

const getItemCmd = command(
  'get-item',
  {
    usage: 'get-item <storeId> --item-id=<itemId>',
    help: 'Read one data-store item (account.dataStore.getItem)',
    needsSession: true
  },
  async (ctx, argv) => {
    const args = parseCommandArgs(getItemCmd, argv, {
      positional: 'required',
      flags: { 'item-id': 'string' }
    })
    const sessionId = requireSession(ctx)
    const query = new URLSearchParams({
      storeId: args.positional!,
      itemId: args.requireString('item-id')
    })
    printJson(
      await ctx.client.get(
        accountPath(sessionId, `/get-item?${query.toString()}`)
      )
    )
  }
)

const setItemCmd = command(
  'set-item',
  {
    usage: 'set-item <storeId> --item-id=<itemId> --value=<text>',
    help: 'Write one data-store item (account.dataStore.setItem)',
    needsSession: true
  },
  async (ctx, argv) => {
    const args = parseCommandArgs(setItemCmd, argv, {
      positional: 'required',
      flags: { 'item-id': 'string', value: 'string' }
    })
    const sessionId = requireSession(ctx)
    await ctx.client.post(accountPath(sessionId, '/set-item'), {
      storeId: args.positional,
      itemId: args.requireString('item-id'),
      value: args.requireString('value')
    })
    printJson({ ok: true })
  }
)

const deleteItemCmd = command(
  'delete-item',
  {
    usage: 'delete-item <storeId> --item-id=<itemId>',
    help: 'Delete one data-store item (account.dataStore.deleteItem)',
    needsSession: true
  },
  async (ctx, argv) => {
    const args = parseCommandArgs(deleteItemCmd, argv, {
      positional: 'required',
      flags: { 'item-id': 'string' }
    })
    const sessionId = requireSession(ctx)
    await ctx.client.post(accountPath(sessionId, '/delete-item'), {
      storeId: args.positional,
      itemId: args.requireString('item-id')
    })
    printJson({ ok: true })
  }
)

const deleteStoreCmd = command(
  'delete-store',
  {
    usage: 'delete-store <storeId>',
    help: 'Delete an entire data store (account.dataStore.deleteStore)',
    needsSession: true
  },
  async (ctx, argv) => {
    const { positional: storeId } = parseCommandArgs(deleteStoreCmd, argv, {
      positional: 'required'
    })
    const sessionId = requireSession(ctx)
    await ctx.client.post(accountPath(sessionId, '/delete-store'), { storeId })
    printJson({ ok: true })
  }
)
