// @flow

import { ethers } from 'ethers'

import { type BorrowPluginBlueprint, makeBorrowPluginFactory } from '../../common/BorrowPluginFactory'
import { makeAaveNetworkFactory } from './AaveNetwork'
import { makeBorrowEngineFactory } from './BorrowEngineFactory'
import { asEthTokenContractAddress } from './cleaners/asEthTokenContractAddress'

// -----------------------------------------------------------------------------
// Matic Mainnet
// -----------------------------------------------------------------------------
const maticNetwork = {
  name: 'matic',
  chainId: 137,
  _defaultProvider: providers => new providers.JsonRpcProvider('https://polygon-rpc.com')
}

const aaveMaticNetwork = makeAaveNetworkFactory({
  provider: ethers.getDefaultProvider(maticNetwork),

  contractAddresses: {
    lendingPool: '0x8dff5e27ea6b7ac08ebfdf9eb090f32ee9a30fcf',
    protocolDataProvider: '0x7551b5D2763519d4e37e8B81929D336De671d46d'
  },
  enabledTokens: {
    DAI: true,
    WBTC: true
  }
})

const aaveMaticBlueprint: BorrowPluginBlueprint = {
  borrowInfo: {
    borrowPluginId: 'aavePolygon',
    currencyPluginId: 'polygon',
    displayName: 'AAVE',
    maxLtvRatio: 0.5
  },
  makeBorrowEngine: makeBorrowEngineFactory({
    aaveNetwork: aaveMaticNetwork,
    asTokenContractAddress: asEthTokenContractAddress
  })
}

export const makeAaveMaticBorrowPlugin = makeBorrowPluginFactory(aaveMaticBlueprint)

// -----------------------------------------------------------------------------
// Matic Testnet (Mumbai)
// -----------------------------------------------------------------------------
const mumbaiNetwork = {
  name: 'mumbai',
  chainId: 80001,
  _defaultProvider: providers => new providers.JsonRpcProvider('https://rpc-mumbai.maticvigil.com')
}

const aaveMumbaiNetwork = makeAaveNetworkFactory({
  provider: ethers.getDefaultProvider(maticMumbaiNetwork),

  contractAddresses: {
    lendingPool: '0x9198f13b08e299d85e096929fa9781a1e3d5d827',
    protocolDataProvider: '0xfa3bd19110d986c5e5e9dd5f69362d05035d045b'
  },
  enabledTokens: {
    USDC: true,
    WBTC: true
  }
})

const aaveMumbaiBlueprint: BorrowPluginBlueprint = {
  borrowInfo: {
    borrowPluginId: 'aaveMumbai',
    currencyPluginId: 'mumbai',
    displayName: 'AAVE (Mumbai)',
    maxLtvRatio: 0.5
  },
  makeBorrowEngine: makeBorrowEngineFactory({
    aaveNetwork: aaveMumbaiNetwork,
    asTokenContractAddress: asEthTokenContractAddress
  })
}

export const makeAaveMumbaiPlugin = makeBorrowPluginFactory(aaveMumbaiBlueprint)

// -----------------------------------------------------------------------------
// Ethereum Mainnet
// -----------------------------------------------------------------------------

const aaveEthNetwork = makeAaveNetworkFactory({
  provider: ethers.getDefaultProvider('mainnet'),

  contractAddresses: {
    lendingPool: '0x7d2768de32b0b80b7a3454c06bdac94a69ddc7a9',
    protocolDataProvider: '0x057835ad21a177dbdd3090bb1cae03eacf78fc6d'
  },
  enabledTokens: {
    DAI: true,
    WBTC: true
  }
})

const aaveEthBlueprint: BorrowPluginBlueprint = {
  borrowInfo: {
    borrowPluginId: 'aaveEth',
    currencyPluginId: 'ethereum',
    displayName: 'AAVE',
    maxLtvRatio: 0.5
  },
  makeBorrowEngine: makeBorrowEngineFactory({
    aaveNetwork: aaveEthNetwork,
    asTokenContractAddress: asEthTokenContractAddress
  })
}

export const makeAaveEthBorrowPlugin = makeBorrowPluginFactory(aaveEthBlueprint)

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
    AAVE: true,
    AMPL: true,
    BUSD: true,
    DAI: true,
    ENJ: true,
    ETH: true,
    KNC: true,
    LINK: true,
    MANA: true,
    MKR: true,
    REN: true,
    sUSD: true,
    SNX: true,
    TUSD: true,
    USDC: true,
    USDT: true,
    WBTC: true,
    YFI: true,
    ZRX: true
  }
})

const aaveKovBlueprint: BorrowPluginBlueprint = {
  borrowInfo: {
    borrowPluginId: 'aaveKovan',
    currencyPluginId: 'kovan',
    displayName: 'AAVE (Kovan)',
    maxLtvRatio: 0.5
  },
  makeBorrowEngine: makeBorrowEngineFactory({
    aaveNetwork: aaveKovanNetwork,
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

export const makeAaveKovBorrowPlugin = makeBorrowPluginFactory(aaveKovBlueprint)
