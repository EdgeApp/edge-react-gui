import { makeOuterPlugin } from '../common/innerPlugin'
import { currencyInfo, networkInfo } from './zcashInfo'
import type { ZcashTools } from './ZcashTools'
import {
  asZcashInfoPayload,
  ZcashInfoPayload,
  ZcashNetworkInfo
} from './zcashTypes'

export const zcash = makeOuterPlugin<
  ZcashNetworkInfo,
  ZcashTools,
  ZcashInfoPayload
>({
  currencyInfo,
  asInfoPayload: asZcashInfoPayload,
  networkInfo,

  async getInnerPlugin() {
    return await import('./ZcashTools.node')
  }
})
