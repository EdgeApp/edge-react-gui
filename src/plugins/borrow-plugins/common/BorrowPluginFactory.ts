import { EdgeCorePluginOptions, EdgeCurrencyWallet } from 'edge-core-js'

import { BorrowEngine, BorrowPlugin, BorrowPluginInfo } from '../types'

export interface BorrowPluginBlueprint {
  borrowInfo: BorrowPluginInfo
  makeBorrowEngine: (wallet: EdgeCurrencyWallet) => Promise<BorrowEngine>
}

export const makeBorrowPluginFactory =
  (blueprint: BorrowPluginBlueprint) =>
  (opts?: EdgeCorePluginOptions): BorrowPlugin => {
    const { borrowInfo, makeBorrowEngine } = blueprint

    return {
      borrowInfo,
      makeBorrowEngine
    }
  }
