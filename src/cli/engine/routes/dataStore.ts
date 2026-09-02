import { requireBodyObject, type Router } from '../router'
import { getAccount, requireQueryString, requireString } from './helpers'

export function registerDataStoreRoutes(router: Router): void {
  /** account.dataStore.listStoreIds() */
  router.add('GET', '/account/{sessionId}/list-store-ids', async ctx => {
    const storeIds = await getAccount(ctx).dataStore.listStoreIds()
    return { storeIds }
  })

  /** account.dataStore.listItemIds(storeId) */
  router.add('GET', '/account/{sessionId}/list-item-ids', async ctx => {
    const storeId = requireQueryString(ctx.query, 'storeId')
    const itemIds = await getAccount(ctx).dataStore.listItemIds(storeId)
    return { itemIds }
  })

  /** account.dataStore.getItem(storeId, itemId) */
  router.add('GET', '/account/{sessionId}/get-item', async ctx => {
    const storeId = requireQueryString(ctx.query, 'storeId')
    const itemId = requireQueryString(ctx.query, 'itemId')
    const value = await getAccount(ctx).dataStore.getItem(storeId, itemId)
    return { value }
  })

  /** account.dataStore.setItem(storeId, itemId, value) */
  router.add('POST', '/account/{sessionId}/set-item', async ctx => {
    const body = requireBodyObject(ctx.body)
    const storeId = requireString(body, 'storeId')
    const itemId = requireString(body, 'itemId')
    const value = requireString(body, 'value')
    await getAccount(ctx).dataStore.setItem(storeId, itemId, value)
    return undefined
  })

  /** account.dataStore.deleteItem(storeId, itemId) */
  router.add('POST', '/account/{sessionId}/delete-item', async ctx => {
    const body = requireBodyObject(ctx.body)
    const storeId = requireString(body, 'storeId')
    const itemId = requireString(body, 'itemId')
    await getAccount(ctx).dataStore.deleteItem(storeId, itemId)
    return undefined
  })

  /** account.dataStore.deleteStore(storeId) */
  router.add('POST', '/account/{sessionId}/delete-store', async ctx => {
    const body = requireBodyObject(ctx.body)
    const storeId = requireString(body, 'storeId')
    await getAccount(ctx).dataStore.deleteStore(storeId)
    return undefined
  })
}
