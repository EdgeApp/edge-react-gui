// @flow
import { makeContract } from './contracts.js'
import { makeCemeteryPolicy } from './policies/cemeteryPolicy.js'
import { makeMasonryPolicy } from './policies/masonryPolicy.js'
import { type StakePolicyInfo, withGeneratedStakePolicyId } from './stakePolicy.js'
import { type LiquidityPool } from './types'

export type StakePluginInfo = {
  pluginId: string,
  policyInfo: StakePolicyInfo[]
}

const spookySwapLiquidityPool: LiquidityPool = {
  pluginId: 'fantom',
  lpId: 'f491e7b69e4244ad4002bc14e878a34207e38c29',
  displayName: 'SpookySwap'
}

const tombSwapLiquidityPool: LiquidityPool = {
  pluginId: 'fantom',
  lpId: '6d0176c5ea1e44b08d3dd001b0784ce42f47a3a7',
  displayName: 'TombSwap'
}

export const pluginInfo: StakePluginInfo = {
  pluginId: 'stake:uniswapV2',
  policyInfo: [
    {
      stakePolicyId: '',
      parentPluginId: 'fantom',
      parentTokenId: 'FTM',
      policy: makeMasonryPolicy(),
      stakeAssets: [
        {
          pluginId: 'fantom',
          tokenId: 'TSHARE'
        }
      ],
      rewardAssets: [
        {
          pluginId: 'fantom',
          tokenId: 'TOMB'
        }
      ],
      mustClaimRewards: true
    },
    {
      stakePolicyId: '',
      liquidityPool: spookySwapLiquidityPool,
      parentPluginId: 'fantom',
      parentTokenId: 'FTM',
      policy: makeCemeteryPolicy({
        poolId: 0,
        lpTokenContract: makeContract('TOMB_WFTM_LP'),
        poolContract: makeContract('TSHARE_REWARD_POOL'),
        swapRouterContract: makeContract('SPOOKY_SWAP_ROUTER'),
        tokenAContract: makeContract('TOMB'),
        tokenBContract: makeContract('FTM')
      }),
      stakeAssets: [
        {
          pluginId: 'fantom',
          tokenId: 'TOMB'
        },
        {
          pluginId: 'fantom',
          tokenId: 'FTM'
        }
      ],
      rewardAssets: [
        {
          pluginId: 'fantom',
          tokenId: 'TSHARE'
        }
      ],
      mustClaimRewards: true
    },
    {
      stakePolicyId: '',
      liquidityPool: spookySwapLiquidityPool,
      parentPluginId: 'fantom',
      parentTokenId: 'FTM',
      policy: makeCemeteryPolicy({
        poolId: 1,
        lpTokenContract: makeContract('TSHARE_WFTM_LP'),
        poolContract: makeContract('TSHARE_REWARD_POOL'),
        swapRouterContract: makeContract('SPOOKY_SWAP_ROUTER'),
        tokenAContract: makeContract('TSHARE'),
        tokenBContract: makeContract('FTM')
      }),
      stakeAssets: [
        {
          pluginId: 'fantom',
          tokenId: 'TSHARE'
        },
        {
          pluginId: 'fantom',
          tokenId: 'FTM'
        }
      ],
      rewardAssets: [
        {
          pluginId: 'fantom',
          tokenId: 'TSHARE'
        }
      ],
      mustClaimRewards: true
    },
    {
      stakePolicyId: '',
      liquidityPool: tombSwapLiquidityPool,
      parentPluginId: 'fantom',
      parentTokenId: 'FTM',
      policy: makeCemeteryPolicy({
        poolId: 2,
        lpTokenContract: makeContract('TOMBSWAP_TOMB_MAI_LP'),
        poolContract: makeContract('TSHARE_REWARD_POOL'),
        swapRouterContract: makeContract('TOMB_SWAP_ROUTER'),
        tokenAContract: makeContract('TOMB'),
        tokenBContract: makeContract('MAI')
      }),
      stakeAssets: [
        {
          pluginId: 'fantom',
          tokenId: 'TOMB'
        },
        {
          pluginId: 'fantom',
          tokenId: 'MAI'
        }
      ],
      rewardAssets: [
        {
          pluginId: 'fantom',
          tokenId: 'TSHARE'
        }
      ],
      mustClaimRewards: true
    },
    {
      stakePolicyId: '',
      liquidityPool: tombSwapLiquidityPool,
      parentPluginId: 'fantom',
      parentTokenId: 'FTM',
      policy: makeCemeteryPolicy({
        poolId: 3,
        lpTokenContract: makeContract('TOMBSWAP_TOMB_WFTM_LP'),
        poolContract: makeContract('TSHARE_REWARD_POOL'),
        swapRouterContract: makeContract('TOMB_SWAP_ROUTER'),
        tokenAContract: makeContract('TOMB'),
        tokenBContract: makeContract('FTM')
      }),
      stakeAssets: [
        {
          pluginId: 'fantom',
          tokenId: 'TOMB'
        },
        {
          pluginId: 'fantom',
          tokenId: 'FTM'
        }
      ],
      rewardAssets: [
        {
          pluginId: 'fantom',
          tokenId: 'TSHARE'
        }
      ],
      mustClaimRewards: true
    },
    {
      stakePolicyId: '',
      liquidityPool: tombSwapLiquidityPool,
      parentPluginId: 'fantom',
      parentTokenId: 'FTM',
      policy: makeCemeteryPolicy({
        poolId: 4,
        lpTokenContract: makeContract('TOMBSWAP_TSHARE_MAI_LP'),
        poolContract: makeContract('TSHARE_REWARD_POOL'),
        swapRouterContract: makeContract('TOMB_SWAP_ROUTER'),
        tokenAContract: makeContract('TSHARE'),
        tokenBContract: makeContract('MAI')
      }),
      stakeAssets: [
        {
          pluginId: 'fantom',
          tokenId: 'TSHARE'
        },
        {
          pluginId: 'fantom',
          tokenId: 'MAI'
        }
      ],
      rewardAssets: [
        {
          pluginId: 'fantom',
          tokenId: 'TSHARE'
        }
      ],
      mustClaimRewards: true
    }
  ].map(withGeneratedStakePolicyId)
}
