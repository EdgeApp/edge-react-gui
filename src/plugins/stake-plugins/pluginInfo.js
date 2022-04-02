// @flow
import { makeContract } from './contracts.js'
import { makeCemetaryPolicy } from './policies/cemetaryPolicy.js'
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
      parentTokenId: 'FTM',
      policy: makeCemetaryPolicy({
        poolId: 0,
        lpTokenContract: makeContract('TOMB_WFTM_LP'),
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
      parentTokenId: 'FTM',
      policy: makeCemetaryPolicy({
        poolId: 1,
        lpTokenContract: makeContract('TSHARE_WFTM_LP'),
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
    // {
    //   stakePolicyId: '',
    //   parentTokenId: 'FTM',
    //   stakeAssets: [
    //     {
    //       pluginId: 'fantom',
    //       tokenId: 'TSHARE'
    //     },
    //     {
    //       pluginId: 'fantom',
    //       tokenId: 'FTM'
    //     }
    //   ],
    //   rewardAssets: [
    //     {
    //       pluginId: 'fantom',
    //       tokenId: 'TSHARE'
    //     }
    //   ],
    //   mustClaimRewards: true
    // }
    // {
    //   stakePolicyId: '',
    //   parentTokenId: 'FTM',
    //   stakeAssets: [
    //     {
    //       pluginId: 'fantom',
    //       tokenId: 'TOMB'
    //     },
    //     {
    //       pluginId: 'fantom',
    //       tokenId: 'MAI'
    //     }
    //   ],
    //   rewardAssets: [
    //     {
    //       pluginId: 'fantom',
    //       tokenId: 'TSHARE'
    //     }
    //   ],
    //   mustClaimRewards: true
    // }
  ].map(withGeneratedStakePolicyId)
}
