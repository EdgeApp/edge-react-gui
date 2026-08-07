import { requireBodyObject, type Router } from '../router'
import { getAccount, requireString } from './helpers'

export function registerDataStoreRoutes(router: Router): void {
  router.add('GET', '/v1/accounts/{sessionId}/data-stores', async ctx => {
    const storeIds = await getAccount(ctx).dataStore.listStoreIds()
    return { storeIds }
  })

  router.add(
    'GET',
    '/v1/accounts/{sessionId}/data-stores/{storeId}',
    async ctx => {
      const itemIds = await getAccount(ctx).dataStore.listItemIds(
        ctx.params.storeId
      )
      return { itemIds }
    }
  )

  router.add(
    'DELETE',
    '/v1/accounts/{sessionId}/data-stores/{storeId}',
    async ctx => {
      await getAccount(ctx).dataStore.deleteStore(ctx.params.storeId)
      return undefined
    }
  )

  router.add(
    'GET',
    '/v1/accounts/{sessionId}/data-stores/{storeId}/items/{itemId}',
    async ctx => {
      const value = await getAccount(ctx).dataStore.getItem(
        ctx.params.storeId,
        ctx.params.itemId
      )
      return { value }
    }
  )

  router.add(
    'PUT',
    '/v1/accounts/{sessionId}/data-stores/{storeId}/items/{itemId}',
    async ctx => {
      const body = requireBodyObject(ctx.body)
      const value = requireString(body, 'value')
      await getAccount(ctx).dataStore.setItem(
        ctx.params.storeId,
        ctx.params.itemId,
        value
      )
      return undefined
    }
  )

  router.add(
    'DELETE',
    '/v1/accounts/{sessionId}/data-stores/{storeId}/items/{itemId}',
    async ctx => {
      await getAccount(ctx).dataStore.deleteItem(
        ctx.params.storeId,
        ctx.params.itemId
      )
      return undefined
    }
  )
}
