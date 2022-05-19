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
      parentCurrencyCode: 'FTM',
      policy: makeMasonryPolicy(),
      stakeAssets: [
        {
          pluginId: 'fantom',
          currencyCode: 'TSHARE'
        }
      ],
      rewardAssets: [
        {
          pluginId: 'fantom',
          currencyCode: 'TOMB'
        }
      ],
      mustClaimRewards: true
    },
    {
      stakePolicyId: '',
      liquidityPool: tombSwapLiquidityPool,
      parentPluginId: 'fantom',
      parentCurrencyCode: 'FTM',
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
          currencyCode: 'TOMB'
        },
        {
          pluginId: 'fantom',
          currencyCode: 'MAI'
        }
      ],
      rewardAssets: [
        {
          pluginId: 'fantom',
          currencyCode: 'TSHARE'
        }
      ],
      mustClaimRewards: true
    },
    {
      stakePolicyId: '',
      liquidityPool: tombSwapLiquidityPool,
      parentPluginId: 'fantom',
      parentCurrencyCode: 'FTM',
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
          currencyCode: 'TOMB'
        },
        {
          pluginId: 'fantom',
          currencyCode: 'FTM'
        }
      ],
      rewardAssets: [
        {
          pluginId: 'fantom',
          currencyCode: 'TSHARE'
        }
      ],
      mustClaimRewards: true
    },
    {
      stakePolicyId: '',
      liquidityPool: tombSwapLiquidityPool,
      parentPluginId: 'fantom',
      parentCurrencyCode: 'FTM',
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
          currencyCode: 'TSHARE'
        },
        {
          pluginId: 'fantom',
          currencyCode: 'MAI'
        }
      ],
      rewardAssets: [
        {
          pluginId: 'fantom',
          currencyCode: 'TSHARE'
        }
      ],
      mustClaimRewards: true
    }
  ].map(withGeneratedStakePolicyId)
}
