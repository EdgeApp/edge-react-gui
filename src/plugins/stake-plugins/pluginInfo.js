// @flow
import { makeContract } from './contracts.js'
import { makeCemeteryPolicy } from './policies/cemeteryPolicy.js'
import { makeMasonryPolicy } from './policies/masonryPolicy.js'
import { type StakePolicyInfo, withGeneratedStakePolicyId } from './stakePolicy.js'

export type StakePluginInfo = {
  pluginId: string,
  policyInfo: StakePolicyInfo[]
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
      parentPluginId: 'fantom',
      parentTokenId: 'FTM',
      policy: makeCemeteryPolicy({
        poolId: 0,
        lpTokenContract: makeContract('TOMB_WFTM_LP'),
        poolContract: makeContract('TSHARE_REWARD_POOL'),
        swapRouterContract: makeContract('SPOOKY_SWAP_ROUTER'),
        tokenAContract: makeContract('TOMB')
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
      parentPluginId: 'fantom',
      parentTokenId: 'FTM',
      policy: makeCemeteryPolicy({
        poolId: 1,
        lpTokenContract: makeContract('TSHARE_WFTM_LP'),
        poolContract: makeContract('TSHARE_REWARD_POOL'),
        swapRouterContract: makeContract('SPOOKY_SWAP_ROUTER'),
        tokenAContract: makeContract('TSHARE')
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
    }
  ].map(withGeneratedStakePolicyId)
}
