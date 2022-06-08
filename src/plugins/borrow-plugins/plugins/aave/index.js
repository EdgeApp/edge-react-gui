// @flow

import { ethers } from 'ethers'

import { type BorrowPluginBlueprint, makeBorrowPluginFactory } from '../../common/BorrowPluginFactory'
import { makeAaveNetworkFactory } from './AaveNetwork'
import { makeBorrowEngineFactory } from './BorrowEngineFactory'
import { asEthTokenContractAddress } from './cleaners/asEthTokenContractAddress'

// -----------------------------------------------------------------------------
// Ethereum Mainnet
// -----------------------------------------------------------------------------

const aaveNetwork = makeAaveNetworkFactory({
  provider: ethers.getDefaultProvider('mainnet'),

  contractAddresses: {
    lendingPool: '0x7d2768de32b0b80b7a3454c06bdac94a69ddc7a9',
    protocolDataProvider: '0x057835ad21a177dbdd3090bb1cae03eacf78fc6d'
  },
  // TODO: categorize into collateral/loan
  enabledTokens: {
    DAI: true,
    WBTC: true
  }
})

const aaveBlueprint: BorrowPluginBlueprint = {
  borrowInfo: {
    pluginId: 'aave',
    displayName: 'AAVE',
    currencyPluginId: 'ethereum',
    maxLtvRatio: 0.5
  },
  makeBorrowEngine: makeBorrowEngineFactory({
    aaveNetwork,
    asTokenContractAddress: asEthTokenContractAddress
  })
}

export const makeAaveBorrowPlugin = makeBorrowPluginFactory(aaveBlueprint)

// -----------------------------------------------------------------------------
// Kovan Testnet
// -----------------------------------------------------------------------------

const aaveKovanNetwork = makeAaveNetworkFactory({
  provider: ethers.getDefaultProvider('kovan'),

  contractAddresses: {
    lendingPool: '0xE0fBa4Fc209b4948668006B2bE61711b7f465bAe',
    protocolDataProvider: '0x3c73a5e5785cac854d468f727c606c07488a29d6'
  },
  enabledTokens: {
    DAI: true,
    WETH: true,
    WBTC: true,
    USDC: true
  }
})

const aaveKovanBlueprint: BorrowPluginBlueprint = {
  borrowInfo: {
    pluginId: 'aaveKovan',
    displayName: 'AAVE (Kovan)',
    currencyPluginId: 'kovan',
    maxLtvRatio: 0.5
  },
  makeBorrowEngine: makeBorrowEngineFactory({
    aaveNetwork: aaveKovanNetwork,
    asTokenContractAddress: asEthTokenContractAddress,
    enabledTokens: {
      // TODO:Make use of this?
      DAI: {
        isCollateral: false,
        isDebt: true
      },
      WBTC: {
        isCollateral: true,
        isDebt: false
      }
    }
  })
}

export const makeAaveKovanBorrowPlugin = makeBorrowPluginFactory(aaveKovanBlueprint)

// -----------------------------------------------------------------------------
// Development
// -----------------------------------------------------------------------------

const aaveDevNetwork = makeAaveNetworkFactory({
  provider: ethers.getDefaultProvider('http://localhost:8545'),

  contractAddresses: {
    lendingPool: '0xE0fBa4Fc209b4948668006B2bE61711b7f465bAe',
    protocolDataProvider: '0x3c73a5e5785cac854d468f727c606c07488a29d6'
  },
  enabledTokens: {
    DAI: true,
    WETH: true,
    WBTC: true,
    USDC: true
  }
})

const aaveDevBlueprint: BorrowPluginBlueprint = {
  borrowInfo: {
    pluginId: 'aaveDev',
    displayName: 'AAVE (Dev)',
    currencyPluginId: 'ethDev',
    maxLtvRatio: 0.5
  },
  makeBorrowEngine: makeBorrowEngineFactory({
    aaveNetwork: aaveDevNetwork,
    asTokenContractAddress: asEthTokenContractAddress,
    enabledTokens: {
      DAI: {
        isCollateral: false,
        isDebt: true
      },
      WBTC: {
        isCollateral: true,
        isDebt: false
      }
    }
  })
}

export const makeAaveDevPlugin = makeBorrowPluginFactory(aaveDevBlueprint)
