import { ethers } from 'ethers'

import { BorrowPluginBlueprint, makeBorrowPluginFactory } from '../../common/BorrowPluginFactory'
import { makeAaveBorrowEngineFactory } from './AaveBorrowEngineFactory'
import { makeAaveNetworkFactory } from './AaveNetwork'
import { asEthTokenContractAddress } from './cleaners/asEthTokenContractAddress'

// -----------------------------------------------------------------------------
// #region Matic Mainnet
// -----------------------------------------------------------------------------
const maticNetwork = {
  name: 'matic',
  chainId: 137,
  // @ts-expect-error
  _defaultProvider: providers => new providers.JsonRpcProvider('https://polygon-rpc.com')
}

const aaveMaticNetwork = makeAaveNetworkFactory({
  provider: ethers.getDefaultProvider(maticNetwork),

  contractAddresses: {
    lendingPool: '0x8dff5e27ea6b7ac08ebfdf9eb090f32ee9a30fcf',
    protocolDataProvider: '0x7551b5D2763519d4e37e8B81929D336De671d46d',
    paraSwapRepayAdapter: '0xe84cf064a0a65290ae5673b500699f3753063936',
    IPriceOracle: '0x0229f777b0fab107f9591a41d5f02e4e98db6f2d'
  },
  enabledTokens: {
    USDC: true,
    WBTC: true
  }
})

const aaveMaticBlueprint: BorrowPluginBlueprint = {
  borrowInfo: {
    borrowPluginId: 'aavePolygon',
    currencyPluginId: 'polygon',
    displayName: 'AAVE',
    displayTokenId: 'd6df932a45c0f255f85145f286ea0b292b21c90b',
    maxLtvRatio: 0.5
  },
  makeBorrowEngine: makeAaveBorrowEngineFactory({
    aaveNetwork: aaveMaticNetwork,
    asTokenContractAddress: asEthTokenContractAddress
  })
}

export const makeAaveMaticBorrowPlugin = makeBorrowPluginFactory(aaveMaticBlueprint)
// #endregion

// -----------------------------------------------------------------------------
// #region Ethereum Mainnet
// -----------------------------------------------------------------------------

const aaveEthNetwork = makeAaveNetworkFactory({
  provider: ethers.getDefaultProvider('mainnet'),

  contractAddresses: {
    lendingPool: '0x7d2768de32b0b80b7a3454c06bdac94a69ddc7a9',
    protocolDataProvider: '0x057835ad21a177dbdd3090bb1cae03eacf78fc6d',
    paraSwapRepayAdapter: '0x135896de8421be2ec868e0b811006171d9df802a',
    IPriceOracle: '0xa50ba011c48153de246e5192c8f9258a2ba79ca9'
  },
  enabledTokens: {
    USDC: true,
    WBTC: true
  }
})

const aaveEthBlueprint: BorrowPluginBlueprint = {
  borrowInfo: {
    borrowPluginId: 'aaveEth',
    currencyPluginId: 'ethereum',
    displayName: 'AAVE',
    displayTokenId: '7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9',
    maxLtvRatio: 0.5
  },
  makeBorrowEngine: makeAaveBorrowEngineFactory({
    aaveNetwork: aaveEthNetwork,
    asTokenContractAddress: asEthTokenContractAddress
  })
}

export const makeAaveEthBorrowPlugin = makeBorrowPluginFactory(aaveEthBlueprint)
// #endregion

// -----------------------------------------------------------------------------
// #region Kovan Testnet
// -----------------------------------------------------------------------------

const aaveKovanNetwork = makeAaveNetworkFactory({
  provider: ethers.getDefaultProvider('kovan'),

  contractAddresses: {
    lendingPool: '0xE0fBa4Fc209b4948668006B2bE61711b7f465bAe',
    protocolDataProvider: '0x3c73a5e5785cac854d468f727c606c07488a29d6',
    paraSwapRepayAdapter: '0xc18451d36aa370fdace8d45839bf975f48f7aea1',
    IPriceOracle: '0xb8be51e6563bb312cbb2aa26e352516c25c26ac1'
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
    displayTokenId: 'b597cd8d3217ea6477232f9217fa70837ff667af',
    maxLtvRatio: 0.5
  },
  makeBorrowEngine: makeAaveBorrowEngineFactory({
    aaveNetwork: aaveKovanNetwork,
    asTokenContractAddress: asEthTokenContractAddress,
    // @ts-expect-error
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
// #endregion
