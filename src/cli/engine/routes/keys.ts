import type { EdgeWalletStates } from 'edge-core-js'

import { engineError } from '../errors'
import { requireBodyObject, type Router } from '../router'
import { getAccount, requireQueryString, requireString } from './helpers'

export function registerKeysRoutes(router: Router): void {
  /** account.allKeys */
  router.add('GET', '/account/{sessionId}/all-keys', ctx => {
    return { allKeys: getAccount(ctx).allKeys }
  })

  /** account.createWallet(type, keys) */
  router.add('POST', '/account/{sessionId}/create-wallet', async ctx => {
    const body = requireBodyObject(ctx.body)
    const type = requireString(body, 'type')
    const keys =
      body.keys != null && typeof body.keys === 'object'
        ? (body.keys as Record<string, unknown>)
        : undefined
    const walletId = await getAccount(ctx).createWallet(type, keys)
    return { walletId }
  })

  /** account.getWalletInfo(id) */
  router.add('GET', '/account/{sessionId}/get-wallet-info', ctx => {
    const id = requireQueryString(ctx.query, 'id')
    const info = getAccount(ctx).getWalletInfo(id)
    if (info == null) {
      throw engineError(
        'WALLET_NOT_FOUND',
        `No wallet found matching: ${id}`,
        404
      )
    }
    return info
  })

  /** account.getRawPrivateKey(walletId) */
  router.add('GET', '/account/{sessionId}/get-raw-private-key', async ctx => {
    const walletId = requireQueryString(ctx.query, 'walletId')
    return await getAccount(ctx).getRawPrivateKey(walletId)
  })

  /** account.getRawPublicKey(walletId) */
  router.add('GET', '/account/{sessionId}/get-raw-public-key', async ctx => {
    const walletId = requireQueryString(ctx.query, 'walletId')
    return await getAccount(ctx).getRawPublicKey(walletId)
  })

  /** account.getDisplayPrivateKey(privateWalletInfo) */
  router.add(
    'GET',
    '/account/{sessionId}/get-display-private-key',
    async ctx => {
      const walletId = requireQueryString(ctx.query, 'walletId')
      const key = await getAccount(ctx).getDisplayPrivateKey(walletId)
      return { key }
    }
  )

  /** account.getDisplayPublicKey(publicWalletInfo) */
  router.add(
    'GET',
    '/account/{sessionId}/get-display-public-key',
    async ctx => {
      const walletId = requireQueryString(ctx.query, 'walletId')
      const key = await getAccount(ctx).getDisplayPublicKey(walletId)
      return { key }
    }
  )

  /** account.listSplittableWalletTypes(walletId) */
  router.add(
    'GET',
    '/account/{sessionId}/list-splittable-wallet-types',
    async ctx => {
      const walletId = requireQueryString(ctx.query, 'walletId')
      const walletTypes = await getAccount(ctx).listSplittableWalletTypes(
        walletId
      )
      return { walletTypes }
    }
  )

  /** account.changeWalletStates(walletStates) */
  router.add('POST', '/account/{sessionId}/change-wallet-states', async ctx => {
    const body = requireBodyObject(ctx.body)
    const walletStates = body.walletStates
    if (
      walletStates == null ||
      typeof walletStates !== 'object' ||
      Array.isArray(walletStates)
    ) {
      throw engineError(
        'BAD_REQUEST',
        'Missing required field "walletStates"',
        400
      )
    }
    await getAccount(ctx).changeWalletStates(
      walletStates as unknown as EdgeWalletStates
    )
    return undefined
  })
}
