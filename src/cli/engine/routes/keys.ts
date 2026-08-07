import type { EdgeWalletStates } from 'edge-core-js'

import { engineError } from '../errors'
import { requireBodyObject, type Router } from '../router'
import { getAccount, requireString } from './helpers'

export function registerKeysRoutes(router: Router): void {
  router.add('GET', '/v1/accounts/{sessionId}/keys', ctx => {
    return getAccount(ctx).allKeys
  })

  router.add('POST', '/v1/accounts/{sessionId}/keys', async ctx => {
    const body = requireBodyObject(ctx.body)
    const type = requireString(body, 'type')
    const keys =
      body.keys != null && typeof body.keys === 'object'
        ? (body.keys as Record<string, unknown>)
        : undefined
    const walletId = await getAccount(ctx).createWallet(type, keys)
    return { walletId }
  })

  router.add('GET', '/v1/accounts/{sessionId}/keys/{walletId}', ctx => {
    const info = getAccount(ctx).getWalletInfo(ctx.params.walletId)
    if (info == null) {
      throw engineError(
        'WALLET_NOT_FOUND',
        `No wallet found matching: ${ctx.params.walletId}`,
        404
      )
    }
    return info
  })

  router.add(
    'GET',
    '/v1/accounts/{sessionId}/keys/{walletId}/private-raw',
    async ctx => {
      return await getAccount(ctx).getRawPrivateKey(ctx.params.walletId)
    }
  )

  router.add(
    'GET',
    '/v1/accounts/{sessionId}/keys/{walletId}/public-raw',
    async ctx => {
      return await getAccount(ctx).getRawPublicKey(ctx.params.walletId)
    }
  )

  router.add(
    'GET',
    '/v1/accounts/{sessionId}/keys/{walletId}/private-display',
    async ctx => {
      const key = await getAccount(ctx).getDisplayPrivateKey(
        ctx.params.walletId
      )
      return { key }
    }
  )

  router.add(
    'GET',
    '/v1/accounts/{sessionId}/keys/{walletId}/public-display',
    async ctx => {
      const key = await getAccount(ctx).getDisplayPublicKey(ctx.params.walletId)
      return { key }
    }
  )

  router.add('PATCH', '/v1/accounts/{sessionId}/wallet-states', async ctx => {
    const body = requireBodyObject(ctx.body)
    await getAccount(ctx).changeWalletStates(
      body as unknown as EdgeWalletStates
    )
    return undefined
  })
}
