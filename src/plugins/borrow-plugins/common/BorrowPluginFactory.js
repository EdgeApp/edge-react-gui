// @flow
import { type EdgeCorePluginOptions, type EdgeCurrencyWallet } from 'edge-core-js'

import { type BorrowEngine, type BorrowPlugin, type BorrowPluginInfo } from '../types'

export type BorrowPluginBlueprint = {
  borrowInfo: BorrowPluginInfo,
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
