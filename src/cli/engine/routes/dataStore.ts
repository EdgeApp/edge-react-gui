import { asArray, asObject, asString } from 'cleaners'

import { doc } from '../doc'
import { route } from '../route'
import { getAccount } from './helpers'

const STORE_ID_DOC = 'Plugin or app namespace within the account data store.'
const ITEM_ID_DOC = 'Key within the store.'

/**
 * List data-store ids.
 *
 * The account's synced key-value store, where plugins keep their own state.
 */
export const listStoreIds = route({
  core: 'account.dataStore.listStoreIds',
  method: 'GET',
  path: '/account/{sessionId}/list-store-ids',
  cli: 'list-store-ids',
  returns: asObject({
    storeIds: doc(asArray(asString), 'Every store holding at least one item.')
  }),

  async handler(ctx) {
    return { storeIds: await getAccount(ctx).dataStore.listStoreIds() }
  }
})

/**
 * List item ids in a store.
 */
export const listItemIds = route({
  core: 'account.dataStore.listItemIds',
  method: 'GET',
  path: '/account/{sessionId}/list-item-ids',
  cli: { command: 'list-item-ids', positional: 'storeId' },
  query: asObject({ storeId: doc(asString, STORE_ID_DOC) }).withRest,
  returns: asObject({
    itemIds: doc(asArray(asString), 'Keys in this store. Empty if it has none.')
  }),

  async handler(ctx) {
    const itemIds = await getAccount(ctx).dataStore.listItemIds(
      ctx.query.valid.storeId
    )
    return { itemIds }
  }
})

/**
 * Read an item.
 *
 * Values are opaque strings; encoding is the caller's business.
 */
export const getItem = route({
  core: 'account.dataStore.getItem',
  method: 'GET',
  path: '/account/{sessionId}/get-item',
  cli: { command: 'get-item', positional: 'storeId' },
  query: asObject({
    storeId: doc(asString, STORE_ID_DOC),
    itemId: doc(asString, ITEM_ID_DOC)
  }).withRest,
  returns: asObject({ value: doc(asString, 'The stored string.') }),
  errors: ['NOT_FOUND', 'BAD_REQUEST'],

  async handler(ctx) {
    const { storeId, itemId } = ctx.query.valid
    const value = await getAccount(ctx).dataStore.getItem(storeId, itemId)
    return { value }
  }
})

/**
 * Write an item.
 *
 * Creates the store if it does not exist.
 */
export const setItem = route({
  core: 'account.dataStore.setItem',
  method: 'POST',
  path: '/account/{sessionId}/set-item',
  cli: { command: 'set-item', positional: 'storeId' },
  body: asObject({
    storeId: doc(asString, STORE_ID_DOC),
    itemId: doc(asString, ITEM_ID_DOC),
    value: doc(asString, 'The string to store.')
  }).withRest,
  errors: ['BAD_REQUEST'],

  async handler(ctx) {
    const { storeId, itemId, value } = ctx.body
    await getAccount(ctx).dataStore.setItem(storeId, itemId, value)
    return undefined
  }
})

/**
 * Delete an item.
 */
export const deleteItem = route({
  core: 'account.dataStore.deleteItem',
  method: 'POST',
  path: '/account/{sessionId}/delete-item',
  cli: { command: 'delete-item', positional: 'storeId' },
  body: asObject({
    storeId: doc(asString, STORE_ID_DOC),
    itemId: doc(asString, ITEM_ID_DOC)
  }).withRest,
  errors: ['BAD_REQUEST'],

  async handler(ctx) {
    await getAccount(ctx).dataStore.deleteItem(
      ctx.body.storeId,
      ctx.body.itemId
    )
    return undefined
  }
})

/**
 * Delete an entire store.
 *
 * Removes every item in it, which cannot be undone from this API.
 */
export const deleteStore = route({
  core: 'account.dataStore.deleteStore',
  method: 'POST',
  path: '/account/{sessionId}/delete-store',
  cli: { command: 'delete-store', positional: 'storeId' },
  body: asObject({ storeId: doc(asString, STORE_ID_DOC) }).withRest,
  errors: ['BAD_REQUEST'],

  async handler(ctx) {
    await getAccount(ctx).dataStore.deleteStore(ctx.body.storeId)
    return undefined
  }
})
