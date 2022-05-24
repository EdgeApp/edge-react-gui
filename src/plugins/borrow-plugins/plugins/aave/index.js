// @flow
import { type BorrowPluginBlueprint, makeBorrowPluginFactory } from '../../common/BorrowPluginFactory'
import { makeBorrowEngineFactory } from './BorrowEngineFactory'

// -----------------------------------------------------------------------------
// Ethereum Mainnet
// -----------------------------------------------------------------------------

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

// -----------------------------------------------------------------------------
// Kovan Testnet
// -----------------------------------------------------------------------------

const aaveKovanBorrowPluginBlueprint: BorrowPluginBlueprint = {
  borrowInfo: {
    pluginId: 'aaveKovan',
    displayName: 'AAVE (Kovan)',
    currencyPluginId: 'kovan',
    maxLtvRatio: 0.5
  },
  makeBorrowEngine: makeBorrowEngineFactory({})
}

export const makeAaveKovanBorrowPlugin = makeBorrowPluginFactory(aaveKovanBorrowPluginBlueprint)
