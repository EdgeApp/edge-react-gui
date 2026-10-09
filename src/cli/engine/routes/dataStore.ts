import { asArray, asObject, asString } from 'cleaners'

import { isMissingFile } from '../../../util/predicates'
import { doc } from '../doc'
import { EngineError, engineError } from '../errors'
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
  cli: 'list-item-ids',
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
 * Whether a `getItem` failure means the item is not there.
 *
 * Core answers an absent item with its own sentinel,
 * `No item named "<itemId>"`, because the disklet helper underneath it
 * swallows every read failure — missing file, bad JSON, a cleaner that
 * refused the contents — and returns `undefined`. That message, plus a
 * genuine missing-file error, is the whole of "absent" as this route can see
 * it.
 *
 * Everything else `getItem` can throw comes from `getDisklet()`, the first
 * thing it does: an account repo that will not open. That is a fault, and
 * `admin-repo-get` already draws the same line.
 */
export function isAbsentItem(error: unknown): boolean {
  if (isMissingFile(error)) return true
  const message = error instanceof Error ? error.message : ''
  return message.startsWith('No item named ')
}

/**
 * Read an item.
 *
 * Values are opaque strings; encoding is the caller's business.
 */
export const getItem = route({
  core: 'account.dataStore.getItem',
  method: 'GET',
  path: '/account/{sessionId}/get-item',
  cli: 'get-item',
  query: asObject({
    storeId: doc(asString, STORE_ID_DOC),
    itemId: doc(asString, ITEM_ID_DOC)
  }).withRest,
  returns: asObject({ value: doc(asString, 'The stored string.') }),
  errors: ['NOT_FOUND', 'BAD_REQUEST'],

  async handler(ctx) {
    const { storeId, itemId } = ctx.query.valid
    // The account is resolved outside the `try`: a session error is a 401,
    // and rewriting it as a 404 told a scripted caller that the item was
    // missing rather than that it had to log in again.
    const account = getAccount(ctx)
    try {
      const value = await account.dataStore.getItem(storeId, itemId)
      return { value }
    } catch (error: unknown) {
      // Anything that already carries a code and a status says what it means.
      if (error instanceof EngineError) throw error
      // Only an absent item is the 404 this route declares. Every other
      // failure used to come out as one too, so an account repo that would
      // not open told a scripted caller the item was missing — and a caller
      // that treats 404 as absent then writes over live plugin state.
      if (!isAbsentItem(error)) throw error
      throw engineError(
        'NOT_FOUND',
        error instanceof Error
          ? error.message
          : `No item ${itemId} in store ${storeId}`,
        404
      )
    }
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
  cli: 'set-item',
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
  cli: 'delete-item',
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
  cli: 'delete-store',
  body: asObject({ storeId: doc(asString, STORE_ID_DOC) }).withRest,
  errors: ['BAD_REQUEST'],

  async handler(ctx) {
    await getAccount(ctx).dataStore.deleteStore(ctx.body.storeId)
    return undefined
  }
})
