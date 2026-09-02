import type { EdgeEncodeUri } from 'edge-core-js'

import { findWallet } from '../resolve'
import { requireBodyObject, type Router } from '../router'
import { getAccount, requireString } from './helpers'

export function registerUriRoutes(router: Router): void {
  /** wallet.parseUri(uri, currencyCode) */
  router.add(
    'POST',
    '/accounts/{sessionId}/wallets/{walletId}/parse-uri',
    async ctx => {
      const body = requireBodyObject(ctx.body)
      const uri = requireString(body, 'uri')
      const currencyCode =
        typeof body.currencyCode === 'string' ? body.currencyCode : undefined
      const wallet = findWallet(getAccount(ctx), ctx.params.walletId)
      return await wallet.parseUri(uri, currencyCode)
    }
  )

  /** wallet.encodeUri(obj) */
  router.add(
    'POST',
    '/accounts/{sessionId}/wallets/{walletId}/encode-uri',
    async ctx => {
      const body = requireBodyObject(ctx.body)
      const publicAddress = requireString(body, 'publicAddress')
      const wallet = findWallet(getAccount(ctx), ctx.params.walletId)
      const obj: EdgeEncodeUri = {
        publicAddress,
        nativeAmount:
          typeof body.nativeAmount === 'string' ? body.nativeAmount : undefined,
        label: typeof body.label === 'string' ? body.label : undefined,
        message: typeof body.message === 'string' ? body.message : undefined,
        currencyCode:
          typeof body.currencyCode === 'string' ? body.currencyCode : undefined
      }
      const uri = await wallet.encodeUri(obj)
      return { uri }
    }
  )
}
