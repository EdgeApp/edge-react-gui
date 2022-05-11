// @flow
import { type BorrowPluginBlueprint, makeBorrowPluginFactory } from '../../common/BorrowPluginFactory'
import { makeBorrowEngineFactory } from './BorrowEngineFactory'

//
// Mainnet
//

const aaveBorrowPluginBlueprint: BorrowPluginBlueprint = {
  borrowInfo: {
    pluginId: 'aave',
    displayName: 'AAVE',
    currencyPluginId: 'ethereum',
    maxLtvRatio: 0.5
  },
  makeBorrowEngine: makeBorrowEngineFactory({})
}

export const makeAaveBorrowPlugin = makeBorrowPluginFactory(aaveBorrowPluginBlueprint)

//
// Kovan
//

const aaveKovanBorrowPluginBlueprint: BorrowPluginBlueprint = {
  borrowInfo: {
    pluginId: 'aave-kovan',
    displayName: 'AAVE (Kovan)',
    currencyPluginId: 'ethereum',
    maxLtvRatio: 0.5
  },
  makeBorrowEngine: makeBorrowEngineFactory({})
}

export const makeAaveKovanBorrowPlugin = makeBorrowPluginFactory(aaveKovanBorrowPluginBlueprint)
