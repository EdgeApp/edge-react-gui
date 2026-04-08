import type { StakeProviderInfo } from '../../types'
import { makeCemeteryPolicy } from '../policies/cemeteryPolicy'
import { makeMasonryPolicy } from '../policies/masonryPolicy'
import type { StakePolicyInfo } from '../stakePolicy'
import { fantomEcosystem as eco } from './fantomEcosystem'

// -----------------------------------------------------------------------------
// Stake Policy Info
// -----------------------------------------------------------------------------

const tombCemeteryV2ProviderInfo: StakeProviderInfo = {
  displayName: 'Cemetery V2 (using TombSwap)',
  pluginId: 'fantom',
  stakeProviderId: 'tombswap_cemetery_v2'
}

export const fantomPolicyInfo: StakePolicyInfo[] = [
  {
    stakePolicyId: 'ftm_tombswap_masonry_v1_0',
    stakeProviderInfo: {
      displayName: 'Masonry V1 (using TombSwap)',
      pluginId: 'fantom',
      stakeProviderId: 'tombswap_masonry_v1_0'
    },
    parentPluginId: 'fantom',
    parentCurrencyCode: 'FTM',
    policy: makeMasonryPolicy({ disableStake: true }),
    stakeAssets: [
      {
        pluginId: 'fantom',
        currencyCode: 'TSHARE',
        tokenId: '4cdf39285d7ca8eb3f090fda0c069ba5f4145b37'
      }
    ],
    rewardAssets: [
      {
        pluginId: 'fantom',
        currencyCode: 'TOMB',
        tokenId: '6c021ae822bea943b2e66552bde1d2696a53fbb7'
      }
    ]
  },
  {
    stakePolicyId: 'ftm_tombswap_cemetery_v2_0',
    stakeProviderInfo: tombCemeteryV2ProviderInfo,
    parentPluginId: 'fantom',
    parentCurrencyCode: 'FTM',
    policy: makeCemeteryPolicy({
      disableStake: true,
      poolId: 0,
      lpTokenContract: eco.makeContract('TOMBSWAP_FTM_TOMB_LP'),
      poolContract: eco.makeContract('CEMETERY_V2_REWARD_POOL'),
      swapRouterContract: eco.makeContract('TOMB_SWAP_ROUTER'),
      tokenAContract: eco.makeContract('FTM'),
      tokenBContract: eco.makeContract('TOMB')
    }),
    stakeAssets: [
      {
        pluginId: 'fantom',
        currencyCode: 'FTM',
        tokenId: '21be370d5312f44cb42ce377bc9b8a0cef1a4c83'
      },
      {
        pluginId: 'fantom',
        currencyCode: 'TOMB',
        tokenId: '6c021ae822bea943b2e66552bde1d2696a53fbb7'
      }
    ],
    rewardAssets: [
      {
        pluginId: 'fantom',
        currencyCode: 'LSHARE',
        tokenId: 'cbe0ca46399af916784cadf5bcc3aed2052d6c45'
      }
    ]
  },
  {
    stakePolicyId: 'ftm_tombswap_cemetery_v2_1',
    stakeProviderInfo: tombCemeteryV2ProviderInfo,
    parentPluginId: 'fantom',
    parentCurrencyCode: 'FTM',
    policy: makeCemeteryPolicy({
      disableStake: true,
      poolId: 1,
      lpTokenContract: eco.makeContract('TOMBSWAP_TOMB_USDC_LP'),
      poolContract: eco.makeContract('CEMETERY_V2_REWARD_POOL'),
      swapRouterContract: eco.makeContract('TOMB_SWAP_ROUTER'),
      tokenAContract: eco.makeContract('TOMB'),
      tokenBContract: eco.makeContract('USDC')
    }),
    stakeAssets: [
      {
        pluginId: 'fantom',
        currencyCode: 'TOMB',
        tokenId: '6c021ae822bea943b2e66552bde1d2696a53fbb7'
      },
      {
        pluginId: 'fantom',
        currencyCode: 'USDC',
        tokenId: '04068da6c83afcfa0e13ba15a6696662335d5b75'
      }
    ],
    rewardAssets: [
      {
        pluginId: 'fantom',
        currencyCode: 'LSHARE',
        tokenId: 'cbe0ca46399af916784cadf5bcc3aed2052d6c45'
      }
    ]
  },
  {
    stakePolicyId: 'ftm_tombswap_cemetery_v2_2',
    stakeProviderInfo: tombCemeteryV2ProviderInfo,
    parentPluginId: 'fantom',
    parentCurrencyCode: 'FTM',
    policy: makeCemeteryPolicy({
      disableStake: true,
      poolId: 2,
      lpTokenContract: eco.makeContract('TOMBSWAP_ZOO_TOMB_LP'),
      poolContract: eco.makeContract('CEMETERY_V2_REWARD_POOL'),
      swapRouterContract: eco.makeContract('TOMB_SWAP_ROUTER'),
      tokenAContract: eco.makeContract('ZOO'),
      tokenBContract: eco.makeContract('TOMB')
    }),
    stakeAssets: [
      {
        pluginId: 'fantom',
        currencyCode: 'ZOO',
        tokenId: '09e145a1d53c0045f41aeef25d8ff982ae74dd56'
      },
      {
        pluginId: 'fantom',
        currencyCode: 'TOMB',
        tokenId: '6c021ae822bea943b2e66552bde1d2696a53fbb7'
      }
    ],
    rewardAssets: [
      {
        pluginId: 'fantom',
        currencyCode: 'LSHARE',
        tokenId: 'cbe0ca46399af916784cadf5bcc3aed2052d6c45'
      }
    ]
  },
  {
    stakePolicyId: 'ftm_tombswap_cemetery_v2_4',
    stakeProviderInfo: tombCemeteryV2ProviderInfo,
    parentPluginId: 'fantom',
    parentCurrencyCode: 'FTM',
    policy: makeCemeteryPolicy({
      disableStake: true,
      poolId: 4,
      lpTokenContract: eco.makeContract('TOMBSWAP_BTC_TSHARE_LP'),
      poolContract: eco.makeContract('CEMETERY_V2_REWARD_POOL'),
      swapRouterContract: eco.makeContract('TOMB_SWAP_ROUTER'),
      tokenAContract: eco.makeContract('BTC'),
      tokenBContract: eco.makeContract('TSHARE')
    }),
    stakeAssets: [
      {
        pluginId: 'fantom',
        currencyCode: 'BTC',
        tokenId: '321162cd933e2be498cd2267a90534a804051b11'
      },
      {
        pluginId: 'fantom',
        currencyCode: 'TSHARE',
        tokenId: '4cdf39285d7ca8eb3f090fda0c069ba5f4145b37'
      }
    ],
    rewardAssets: [
      {
        pluginId: 'fantom',
        currencyCode: 'LSHARE',
        tokenId: 'cbe0ca46399af916784cadf5bcc3aed2052d6c45'
      }
    ]
  },
  {
    stakePolicyId: 'ftm_tombswap_cemetery_v2_5',
    stakeProviderInfo: tombCemeteryV2ProviderInfo,
    parentPluginId: 'fantom',
    parentCurrencyCode: 'FTM',
    policy: makeCemeteryPolicy({
      disableStake: true,
      poolId: 5,
      lpTokenContract: eco.makeContract('TOMBSWAP_TSHARE_ETH_LP'),
      poolContract: eco.makeContract('CEMETERY_V2_REWARD_POOL'),
      swapRouterContract: eco.makeContract('TOMB_SWAP_ROUTER'),
      tokenAContract: eco.makeContract('TSHARE'),
      tokenBContract: eco.makeContract('ETH')
    }),
    stakeAssets: [
      {
        pluginId: 'fantom',
        currencyCode: 'TSHARE',
        tokenId: '4cdf39285d7ca8eb3f090fda0c069ba5f4145b37'
      },
      {
        pluginId: 'fantom',
        currencyCode: 'ETH',
        tokenId: '74b23882a30290451a17c44f4f05243b6b58c76d'
      }
    ],
    rewardAssets: [
      {
        pluginId: 'fantom',
        currencyCode: 'LSHARE',
        tokenId: 'cbe0ca46399af916784cadf5bcc3aed2052d6c45'
      }
    ]
  },
  {
    stakePolicyId: 'ftm_tombswap_cemetery_v2_6',
    stakeProviderInfo: tombCemeteryV2ProviderInfo,
    parentPluginId: 'fantom',
    parentCurrencyCode: 'FTM',
    policy: makeCemeteryPolicy({
      disableStake: true,
      poolId: 6,
      lpTokenContract: eco.makeContract('TOMBSWAP_USDC_TSHARE_LP'),
      poolContract: eco.makeContract('CEMETERY_V2_REWARD_POOL'),
      swapRouterContract: eco.makeContract('TOMB_SWAP_ROUTER'),
      tokenAContract: eco.makeContract('USDC'),
      tokenBContract: eco.makeContract('TSHARE')
    }),
    stakeAssets: [
      {
        pluginId: 'fantom',
        currencyCode: 'USDC',
        tokenId: '04068da6c83afcfa0e13ba15a6696662335d5b75'
      },
      {
        pluginId: 'fantom',
        currencyCode: 'TSHARE',
        tokenId: '4cdf39285d7ca8eb3f090fda0c069ba5f4145b37'
      }
    ],
    rewardAssets: [
      {
        pluginId: 'fantom',
        currencyCode: 'LSHARE',
        tokenId: 'cbe0ca46399af916784cadf5bcc3aed2052d6c45'
      }
    ]
  },
  {
    stakePolicyId: 'ftm_tombswap_cemetery_v2_7',
    stakeProviderInfo: tombCemeteryV2ProviderInfo,
    parentPluginId: 'fantom',
    parentCurrencyCode: 'FTM',
    policy: makeCemeteryPolicy({
      disableStake: true,
      poolId: 7,
      lpTokenContract: eco.makeContract('TOMBSWAP_USDC_FUSDT_LP'),
      poolContract: eco.makeContract('CEMETERY_V2_REWARD_POOL'),
      swapRouterContract: eco.makeContract('TOMB_SWAP_ROUTER'),
      tokenAContract: eco.makeContract('USDC'),
      tokenBContract: eco.makeContract('FUSDT')
    }),
    stakeAssets: [
      {
        pluginId: 'fantom',
        currencyCode: 'USDC',
        tokenId: '04068da6c83afcfa0e13ba15a6696662335d5b75'
      },
      {
        pluginId: 'fantom',
        currencyCode: 'FUSDT',
        tokenId: '049d68029688eabf473097a2fc38ef61633a3c7a'
      }
    ],
    rewardAssets: [
      {
        pluginId: 'fantom',
        currencyCode: 'LSHARE',
        tokenId: 'cbe0ca46399af916784cadf5bcc3aed2052d6c45'
      }
    ]
  },
  {
    stakePolicyId: 'ftm_tombswap_cemetery_v2_8',
    stakeProviderInfo: tombCemeteryV2ProviderInfo,
    parentPluginId: 'fantom',
    parentCurrencyCode: 'FTM',
    policy: makeCemeteryPolicy({
      disableStake: true,
      poolId: 8,
      lpTokenContract: eco.makeContract('TOMBSWAP_USDC_MIM_LP'),
      poolContract: eco.makeContract('CEMETERY_V2_REWARD_POOL'),
      swapRouterContract: eco.makeContract('TOMB_SWAP_ROUTER'),
      tokenAContract: eco.makeContract('USDC'),
      tokenBContract: eco.makeContract('MIM')
    }),
    stakeAssets: [
      {
        pluginId: 'fantom',
        currencyCode: 'USDC',
        tokenId: '04068da6c83afcfa0e13ba15a6696662335d5b75'
      },
      {
        pluginId: 'fantom',
        currencyCode: 'MIM',
        tokenId: '82f0b8b456c1a451378467398982d4834b6829c1'
      }
    ],
    rewardAssets: [
      {
        pluginId: 'fantom',
        currencyCode: 'LSHARE',
        tokenId: 'cbe0ca46399af916784cadf5bcc3aed2052d6c45'
      }
    ]
  },

  {
    stakePolicyId: 'ftm_tombswap_cemetery_v2_10',
    stakeProviderInfo: tombCemeteryV2ProviderInfo,
    parentPluginId: 'fantom',
    parentCurrencyCode: 'FTM',
    policy: makeCemeteryPolicy({
      disableStake: true,
      poolId: 10,
      lpTokenContract: eco.makeContract('TOMBSWAP_USDC_FTM_LP'),
      poolContract: eco.makeContract('CEMETERY_V2_REWARD_POOL'),
      swapRouterContract: eco.makeContract('TOMB_SWAP_ROUTER'),
      tokenAContract: eco.makeContract('USDC'),
      tokenBContract: eco.makeContract('FTM')
    }),
    stakeAssets: [
      {
        pluginId: 'fantom',
        currencyCode: 'USDC',
        tokenId: '04068da6c83afcfa0e13ba15a6696662335d5b75'
      },
      {
        pluginId: 'fantom',
        currencyCode: 'FTM',
        tokenId: '21be370d5312f44cb42ce377bc9b8a0cef1a4c83'
      }
    ],
    rewardAssets: [
      {
        pluginId: 'fantom',
        currencyCode: 'LSHARE',
        tokenId: 'cbe0ca46399af916784cadf5bcc3aed2052d6c45'
      }
    ]
  },
  {
    stakePolicyId: 'ftm_tombswap_cemetery_v2_11',
    stakeProviderInfo: tombCemeteryV2ProviderInfo,
    parentPluginId: 'fantom',
    parentCurrencyCode: 'FTM',
    policy: makeCemeteryPolicy({
      disableStake: true,
      poolId: 11,
      lpTokenContract: eco.makeContract('TOMBSWAP_FTM_DAI_LP'),
      poolContract: eco.makeContract('CEMETERY_V2_REWARD_POOL'),
      swapRouterContract: eco.makeContract('TOMB_SWAP_ROUTER'),
      tokenAContract: eco.makeContract('FTM'),
      tokenBContract: eco.makeContract('DAI')
    }),
    stakeAssets: [
      {
        pluginId: 'fantom',
        currencyCode: 'FTM',
        tokenId: '21be370d5312f44cb42ce377bc9b8a0cef1a4c83'
      },
      {
        pluginId: 'fantom',
        currencyCode: 'DAI',
        tokenId: '8d11ec38a3eb5e956b052f67da8bdc9bef8abf3e'
      }
    ],
    rewardAssets: [
      {
        pluginId: 'fantom',
        currencyCode: 'LSHARE',
        tokenId: 'cbe0ca46399af916784cadf5bcc3aed2052d6c45'
      }
    ]
  },
  {
    stakePolicyId: 'ftm_tombswap_cemetery_v2_12',
    stakeProviderInfo: tombCemeteryV2ProviderInfo,
    parentPluginId: 'fantom',
    parentCurrencyCode: 'FTM',
    policy: makeCemeteryPolicy({
      disableStake: true,
      poolId: 12,
      lpTokenContract: eco.makeContract('TOMBSWAP_FTM_ETH_LP'),
      poolContract: eco.makeContract('CEMETERY_V2_REWARD_POOL'),
      swapRouterContract: eco.makeContract('TOMB_SWAP_ROUTER'),
      tokenAContract: eco.makeContract('FTM'),
      tokenBContract: eco.makeContract('ETH')
    }),
    stakeAssets: [
      {
        pluginId: 'fantom',
        currencyCode: 'FTM',
        tokenId: '21be370d5312f44cb42ce377bc9b8a0cef1a4c83'
      },
      {
        pluginId: 'fantom',
        currencyCode: 'ETH',
        tokenId: '74b23882a30290451a17c44f4f05243b6b58c76d'
      }
    ],
    rewardAssets: [
      {
        pluginId: 'fantom',
        currencyCode: 'LSHARE',
        tokenId: 'cbe0ca46399af916784cadf5bcc3aed2052d6c45'
      }
    ]
  },
  {
    stakePolicyId: 'ftm_tombswap_cemetery_v2_13',
    stakeProviderInfo: tombCemeteryV2ProviderInfo,
    parentPluginId: 'fantom',
    parentCurrencyCode: 'FTM',
    policy: makeCemeteryPolicy({
      disableStake: true,
      poolId: 13,
      lpTokenContract: eco.makeContract('TOMBSWAP_FUSDT_FTM_LP'),
      poolContract: eco.makeContract('CEMETERY_V2_REWARD_POOL'),
      swapRouterContract: eco.makeContract('TOMB_SWAP_ROUTER'),
      tokenAContract: eco.makeContract('FUSDT'),
      tokenBContract: eco.makeContract('FTM')
    }),
    stakeAssets: [
      {
        pluginId: 'fantom',
        currencyCode: 'FUSDT',
        tokenId: '049d68029688eabf473097a2fc38ef61633a3c7a'
      },
      {
        pluginId: 'fantom',
        currencyCode: 'FTM',
        tokenId: '21be370d5312f44cb42ce377bc9b8a0cef1a4c83'
      }
    ],
    rewardAssets: [
      {
        pluginId: 'fantom',
        currencyCode: 'LSHARE',
        tokenId: 'cbe0ca46399af916784cadf5bcc3aed2052d6c45'
      }
    ]
  },
  {
    stakePolicyId: 'ftm_tombswap_cemetery_v2_14',
    stakeProviderInfo: tombCemeteryV2ProviderInfo,
    parentPluginId: 'fantom',
    parentCurrencyCode: 'FTM',
    policy: makeCemeteryPolicy({
      disableStake: true,
      poolId: 14,
      lpTokenContract: eco.makeContract('TOMBSWAP_FTM_BTC_LP'),
      poolContract: eco.makeContract('CEMETERY_V2_REWARD_POOL'),
      swapRouterContract: eco.makeContract('TOMB_SWAP_ROUTER'),
      tokenAContract: eco.makeContract('FTM'),
      tokenBContract: eco.makeContract('BTC')
    }),
    stakeAssets: [
      {
        pluginId: 'fantom',
        currencyCode: 'FTM',
        tokenId: '21be370d5312f44cb42ce377bc9b8a0cef1a4c83'
      },
      {
        pluginId: 'fantom',
        currencyCode: 'BTC',
        tokenId: '321162cd933e2be498cd2267a90534a804051b11'
      }
    ],
    rewardAssets: [
      {
        pluginId: 'fantom',
        currencyCode: 'LSHARE',
        tokenId: 'cbe0ca46399af916784cadf5bcc3aed2052d6c45'
      }
    ]
  },
  {
    stakePolicyId: 'ftm_tombswap_cemetery_v2_15',
    stakeProviderInfo: tombCemeteryV2ProviderInfo,
    parentPluginId: 'fantom',
    parentCurrencyCode: 'FTM',
    policy: makeCemeteryPolicy({
      disableStake: true,
      poolId: 15,
      lpTokenContract: eco.makeContract('TOMBSWAP_FTM_MIM_LP'),
      poolContract: eco.makeContract('CEMETERY_V2_REWARD_POOL'),
      swapRouterContract: eco.makeContract('TOMB_SWAP_ROUTER'),
      tokenAContract: eco.makeContract('FTM'),
      tokenBContract: eco.makeContract('MIM')
    }),
    stakeAssets: [
      {
        pluginId: 'fantom',
        currencyCode: 'FTM',
        tokenId: '21be370d5312f44cb42ce377bc9b8a0cef1a4c83'
      },
      {
        pluginId: 'fantom',
        currencyCode: 'MIM',
        tokenId: '82f0b8b456c1a451378467398982d4834b6829c1'
      }
    ],
    rewardAssets: [
      {
        pluginId: 'fantom',
        currencyCode: 'LSHARE',
        tokenId: 'cbe0ca46399af916784cadf5bcc3aed2052d6c45'
      }
    ]
  },
  {
    stakePolicyId: 'ftm_tombswap_cemetery_v2_16',
    stakeProviderInfo: tombCemeteryV2ProviderInfo,
    parentPluginId: 'fantom',
    parentCurrencyCode: 'FTM',
    policy: makeCemeteryPolicy({
      disableStake: true,
      poolId: 16,
      lpTokenContract: eco.makeContract('TOMBSWAP_FTM_BNB_LP'),
      poolContract: eco.makeContract('CEMETERY_V2_REWARD_POOL'),
      swapRouterContract: eco.makeContract('TOMB_SWAP_ROUTER'),
      tokenAContract: eco.makeContract('FTM'),
      tokenBContract: eco.makeContract('BNB')
    }),
    stakeAssets: [
      {
        pluginId: 'fantom',
        currencyCode: 'FTM',
        tokenId: '21be370d5312f44cb42ce377bc9b8a0cef1a4c83'
      },
      {
        pluginId: 'fantom',
        currencyCode: 'BNB',
        tokenId: 'd67de0e0a0fd7b15dc8348bb9be742f3c5850454'
      }
    ],
    rewardAssets: [
      {
        pluginId: 'fantom',
        currencyCode: 'LSHARE',
        tokenId: 'cbe0ca46399af916784cadf5bcc3aed2052d6c45'
      }
    ]
  },
  {
    stakePolicyId: 'ftm_tombswap_cemetery_v2_17',
    stakeProviderInfo: tombCemeteryV2ProviderInfo,
    parentPluginId: 'fantom',
    parentCurrencyCode: 'FTM',
    policy: makeCemeteryPolicy({
      disableStake: true,
      poolId: 17,
      lpTokenContract: eco.makeContract('TOMBSWAP_FTM_AVAX_LP'),
      poolContract: eco.makeContract('CEMETERY_V2_REWARD_POOL'),
      swapRouterContract: eco.makeContract('TOMB_SWAP_ROUTER'),
      tokenAContract: eco.makeContract('FTM'),
      tokenBContract: eco.makeContract('AVAX')
    }),
    stakeAssets: [
      {
        pluginId: 'fantom',
        currencyCode: 'FTM',
        tokenId: '21be370d5312f44cb42ce377bc9b8a0cef1a4c83'
      },
      {
        pluginId: 'fantom',
        currencyCode: 'AVAX',
        tokenId: '511d35c52a3c244e7b8bd92c0c297755fbd89212'
      }
    ],
    rewardAssets: [
      {
        pluginId: 'fantom',
        currencyCode: 'LSHARE',
        tokenId: 'cbe0ca46399af916784cadf5bcc3aed2052d6c45'
      }
    ]
  },
  {
    stakePolicyId: 'ftm_tombswap_cemetery_v2_18',
    stakeProviderInfo: tombCemeteryV2ProviderInfo,
    parentPluginId: 'fantom',
    parentCurrencyCode: 'FTM',
    policy: makeCemeteryPolicy({
      disableStake: true,
      poolId: 18,
      lpTokenContract: eco.makeContract('TOMBSWAP_FTM_LINK_LP'),
      poolContract: eco.makeContract('CEMETERY_V2_REWARD_POOL'),
      swapRouterContract: eco.makeContract('TOMB_SWAP_ROUTER'),
      tokenAContract: eco.makeContract('FTM'),
      tokenBContract: eco.makeContract('LINK')
    }),
    stakeAssets: [
      {
        pluginId: 'fantom',
        currencyCode: 'FTM',
        tokenId: '21be370d5312f44cb42ce377bc9b8a0cef1a4c83'
      },
      {
        pluginId: 'fantom',
        currencyCode: 'LINK',
        tokenId: 'b3654dc3d10ea7645f8319668e8f54d2574fbdc8'
      }
    ],
    rewardAssets: [
      {
        pluginId: 'fantom',
        currencyCode: 'LSHARE',
        tokenId: 'cbe0ca46399af916784cadf5bcc3aed2052d6c45'
      }
    ]
  },
  {
    stakePolicyId: 'ftm_tombswap_cemetery_v2_19',
    stakeProviderInfo: tombCemeteryV2ProviderInfo,
    parentPluginId: 'fantom',
    parentCurrencyCode: 'FTM',
    policy: makeCemeteryPolicy({
      disableStake: true,
      poolId: 19,
      lpTokenContract: eco.makeContract('TOMBSWAP_CRV_FTM_LP'),
      poolContract: eco.makeContract('CEMETERY_V2_REWARD_POOL'),
      swapRouterContract: eco.makeContract('TOMB_SWAP_ROUTER'),
      tokenAContract: eco.makeContract('CRV'),
      tokenBContract: eco.makeContract('FTM')
    }),
    stakeAssets: [
      {
        pluginId: 'fantom',
        currencyCode: 'CRV',
        tokenId: '1e4f97b9f9f913c46f1632781732927b9019c68b'
      },
      {
        pluginId: 'fantom',
        currencyCode: 'FTM',
        tokenId: '21be370d5312f44cb42ce377bc9b8a0cef1a4c83'
      }
    ],
    rewardAssets: [
      {
        pluginId: 'fantom',
        currencyCode: 'LSHARE',
        tokenId: 'cbe0ca46399af916784cadf5bcc3aed2052d6c45'
      }
    ]
  },
  {
    stakePolicyId: 'ftm_tombswap_cemetery_v2_20',
    stakeProviderInfo: tombCemeteryV2ProviderInfo,
    parentPluginId: 'fantom',
    parentCurrencyCode: 'FTM',
    policy: makeCemeteryPolicy({
      disableStake: true,
      poolId: 20,
      lpTokenContract: eco.makeContract('TOMBSWAP_BTC_ETH_LP'),
      poolContract: eco.makeContract('CEMETERY_V2_REWARD_POOL'),
      swapRouterContract: eco.makeContract('TOMB_SWAP_ROUTER'),
      tokenAContract: eco.makeContract('BTC'),
      tokenBContract: eco.makeContract('ETH')
    }),
    stakeAssets: [
      {
        pluginId: 'fantom',
        currencyCode: 'BTC',
        tokenId: '321162cd933e2be498cd2267a90534a804051b11'
      },
      {
        pluginId: 'fantom',
        currencyCode: 'ETH',
        tokenId: '74b23882a30290451a17c44f4f05243b6b58c76d'
      }
    ],
    rewardAssets: [
      {
        pluginId: 'fantom',
        currencyCode: 'LSHARE',
        tokenId: 'cbe0ca46399af916784cadf5bcc3aed2052d6c45'
      }
    ]
  },
  {
    stakePolicyId: 'ftm_tombswap_cemetery_v2_21',
    stakeProviderInfo: tombCemeteryV2ProviderInfo,
    parentPluginId: 'fantom',
    parentCurrencyCode: 'FTM',
    policy: makeCemeteryPolicy({
      disableStake: true,
      poolId: 21,
      lpTokenContract: eco.makeContract('TOMBSWAP_TOMB_LIF3_LP'),
      poolContract: eco.makeContract('CEMETERY_V2_REWARD_POOL'),
      swapRouterContract: eco.makeContract('TOMB_SWAP_ROUTER'),
      tokenAContract: eco.makeContract('TOMB'),
      tokenBContract: eco.makeContract('LIF3')
    }),
    stakeAssets: [
      {
        pluginId: 'fantom',
        currencyCode: 'TOMB',
        tokenId: '6c021ae822bea943b2e66552bde1d2696a53fbb7'
      },
      {
        pluginId: 'fantom',
        currencyCode: 'LIF3',
        tokenId: 'bf60e7414ef09026733c1e7de72e393888c64da'
      }
    ],
    rewardAssets: [
      {
        pluginId: 'fantom',
        currencyCode: 'LSHARE',
        tokenId: 'cbe0ca46399af916784cadf5bcc3aed2052d6c45'
      }
    ]
  },
  {
    stakePolicyId: 'ftm_tombswap_cemetery_v2_22',
    stakeProviderInfo: tombCemeteryV2ProviderInfo,
    parentPluginId: 'fantom',
    parentCurrencyCode: 'FTM',
    policy: makeCemeteryPolicy({
      disableStake: true,
      poolId: 22,
      lpTokenContract: eco.makeContract('TOMBSWAP_TSHARE_LSHARE_LP'),
      poolContract: eco.makeContract('CEMETERY_V2_REWARD_POOL'),
      swapRouterContract: eco.makeContract('TOMB_SWAP_ROUTER'),
      tokenAContract: eco.makeContract('TSHARE'),
      tokenBContract: eco.makeContract('LSHARE')
    }),
    stakeAssets: [
      {
        pluginId: 'fantom',
        currencyCode: 'TSHARE',
        tokenId: '4cdf39285d7ca8eb3f090fda0c069ba5f4145b37'
      },
      {
        pluginId: 'fantom',
        currencyCode: 'LSHARE',
        tokenId: 'cbe0ca46399af916784cadf5bcc3aed2052d6c45'
      }
    ],
    rewardAssets: [
      {
        pluginId: 'fantom',
        currencyCode: 'LSHARE',
        tokenId: 'cbe0ca46399af916784cadf5bcc3aed2052d6c45'
      }
    ]
  },
  {
    stakePolicyId: 'ftm_tombswap_cemetery_v2_23',
    stakeProviderInfo: tombCemeteryV2ProviderInfo,
    parentPluginId: 'fantom',
    parentCurrencyCode: 'FTM',
    policy: makeCemeteryPolicy({
      disableStake: true,
      poolId: 23,
      lpTokenContract: eco.makeContract('TOMBSWAP_USDC_LIF3_LP'),
      poolContract: eco.makeContract('CEMETERY_V2_REWARD_POOL'),
      swapRouterContract: eco.makeContract('TOMB_SWAP_ROUTER'),
      tokenAContract: eco.makeContract('USDC'),
      tokenBContract: eco.makeContract('LIF3')
    }),
    stakeAssets: [
      {
        pluginId: 'fantom',
        currencyCode: 'USDC',
        tokenId: '04068da6c83afcfa0e13ba15a6696662335d5b75'
      },
      {
        pluginId: 'fantom',
        currencyCode: 'LIF3',
        tokenId: 'bf60e7414ef09026733c1e7de72e393888c64da'
      }
    ],
    rewardAssets: [
      {
        pluginId: 'fantom',
        currencyCode: 'LSHARE',
        tokenId: 'cbe0ca46399af916784cadf5bcc3aed2052d6c45'
      }
    ]
  },
  {
    stakePolicyId: 'ftm_tombswap_cemetery_v2_24',
    stakeProviderInfo: tombCemeteryV2ProviderInfo,
    parentPluginId: 'fantom',
    parentCurrencyCode: 'FTM',
    policy: makeCemeteryPolicy({
      disableStake: true,
      poolId: 24,
      lpTokenContract: eco.makeContract('TOMBSWAP_USDC_LSHARE_LP'),
      poolContract: eco.makeContract('CEMETERY_V2_REWARD_POOL'),
      swapRouterContract: eco.makeContract('TOMB_SWAP_ROUTER'),
      tokenAContract: eco.makeContract('USDC'),
      tokenBContract: eco.makeContract('LSHARE')
    }),
    stakeAssets: [
      {
        pluginId: 'fantom',
        currencyCode: 'USDC',
        tokenId: '04068da6c83afcfa0e13ba15a6696662335d5b75'
      },
      {
        pluginId: 'fantom',
        currencyCode: 'LSHARE',
        tokenId: 'cbe0ca46399af916784cadf5bcc3aed2052d6c45'
      }
    ],
    rewardAssets: [
      {
        pluginId: 'fantom',
        currencyCode: 'LSHARE',
        tokenId: 'cbe0ca46399af916784cadf5bcc3aed2052d6c45'
      }
    ]
  },
  {
    stakePolicyId: 'ftm_tombswap_cemetery_v2_25',
    stakeProviderInfo: tombCemeteryV2ProviderInfo,
    parentPluginId: 'fantom',
    parentCurrencyCode: 'FTM',
    policy: makeCemeteryPolicy({
      disableStake: true,
      poolId: 25,
      lpTokenContract: eco.makeContract('TOMBSWAP_FTM_LIF3_LP'),
      poolContract: eco.makeContract('CEMETERY_V2_REWARD_POOL'),
      swapRouterContract: eco.makeContract('TOMB_SWAP_ROUTER'),
      tokenAContract: eco.makeContract('FTM'),
      tokenBContract: eco.makeContract('LIF3')
    }),
    stakeAssets: [
      {
        pluginId: 'fantom',
        currencyCode: 'FTM',
        tokenId: '21be370d5312f44cb42ce377bc9b8a0cef1a4c83'
      },
      {
        pluginId: 'fantom',
        currencyCode: 'LIF3',
        tokenId: 'bf60e7414ef09026733c1e7de72e393888c64da'
      }
    ],
    rewardAssets: [
      {
        pluginId: 'fantom',
        currencyCode: 'LSHARE',
        tokenId: 'cbe0ca46399af916784cadf5bcc3aed2052d6c45'
      }
    ]
  },
  {
    stakePolicyId: 'ftm_tombswap_cemetery_v2_26',
    stakeProviderInfo: tombCemeteryV2ProviderInfo,
    parentPluginId: 'fantom',
    parentCurrencyCode: 'FTM',
    policy: makeCemeteryPolicy({
      disableStake: true,
      poolId: 26,
      lpTokenContract: eco.makeContract('TOMBSWAP_TBOND_TOMB_LP'),
      poolContract: eco.makeContract('CEMETERY_V2_REWARD_POOL'),
      swapRouterContract: eco.makeContract('TOMB_SWAP_ROUTER'),
      tokenAContract: eco.makeContract('TBOND'),
      tokenBContract: eco.makeContract('TOMB')
    }),
    stakeAssets: [
      {
        pluginId: 'fantom',
        currencyCode: 'TBOND',
        tokenId: '24248cd1747348bdc971a5395f4b3cd7fee94ea0'
      },
      {
        pluginId: 'fantom',
        currencyCode: 'TOMB',
        tokenId: '6c021ae822bea943b2e66552bde1d2696a53fbb7'
      }
    ],
    rewardAssets: [
      {
        pluginId: 'fantom',
        currencyCode: 'LSHARE',
        tokenId: 'cbe0ca46399af916784cadf5bcc3aed2052d6c45'
      }
    ]
  },
  {
    stakePolicyId: 'ftm_tombswap_cemetery_v2_27',
    stakeProviderInfo: tombCemeteryV2ProviderInfo,
    parentPluginId: 'fantom',
    parentCurrencyCode: 'FTM',
    policy: makeCemeteryPolicy({
      disableStake: true,
      poolId: 27,
      lpTokenContract: eco.makeContract('TOMBSWAP_FTM_LSHARE_LP'),
      poolContract: eco.makeContract('CEMETERY_V2_REWARD_POOL'),
      swapRouterContract: eco.makeContract('TOMB_SWAP_ROUTER'),
      tokenAContract: eco.makeContract('FTM'),
      tokenBContract: eco.makeContract('LSHARE')
    }),
    stakeAssets: [
      {
        pluginId: 'fantom',
        currencyCode: 'FTM',
        tokenId: '21be370d5312f44cb42ce377bc9b8a0cef1a4c83'
      },
      {
        pluginId: 'fantom',
        currencyCode: 'LSHARE',
        tokenId: 'cbe0ca46399af916784cadf5bcc3aed2052d6c45'
      }
    ],
    rewardAssets: [
      {
        pluginId: 'fantom',
        currencyCode: 'LSHARE',
        tokenId: 'cbe0ca46399af916784cadf5bcc3aed2052d6c45'
      }
    ]
  },
  {
    stakePolicyId: 'ftm_tombswap_cemetery_v2_28',
    stakeProviderInfo: tombCemeteryV2ProviderInfo,
    parentPluginId: 'fantom',
    parentCurrencyCode: 'FTM',
    policy: makeCemeteryPolicy({
      disableStake: true,
      poolId: 28,
      lpTokenContract: eco.makeContract('TOMBSWAP_TOMB_LSHARE_LP'),
      poolContract: eco.makeContract('CEMETERY_V2_REWARD_POOL'),
      swapRouterContract: eco.makeContract('TOMB_SWAP_ROUTER'),
      tokenAContract: eco.makeContract('TOMB'),
      tokenBContract: eco.makeContract('LSHARE')
    }),
    stakeAssets: [
      {
        pluginId: 'fantom',
        currencyCode: 'TOMB',
        tokenId: '6c021ae822bea943b2e66552bde1d2696a53fbb7'
      },
      {
        pluginId: 'fantom',
        currencyCode: 'LSHARE',
        tokenId: 'cbe0ca46399af916784cadf5bcc3aed2052d6c45'
      }
    ],
    rewardAssets: [
      {
        pluginId: 'fantom',
        currencyCode: 'LSHARE',
        tokenId: 'cbe0ca46399af916784cadf5bcc3aed2052d6c45'
      }
    ]
  },
  {
    stakePolicyId: 'ftm_tombswap_cemetery_v2_29',
    stakeProviderInfo: tombCemeteryV2ProviderInfo,
    parentPluginId: 'fantom',
    parentCurrencyCode: 'FTM',
    policy: makeCemeteryPolicy({
      disableStake: true,
      poolId: 29,
      lpTokenContract: eco.makeContract('TOMBSWAP_LIF3_LSHARE_LP'),
      poolContract: eco.makeContract('CEMETERY_V2_REWARD_POOL'),
      swapRouterContract: eco.makeContract('TOMB_SWAP_ROUTER'),
      tokenAContract: eco.makeContract('LIF3'),
      tokenBContract: eco.makeContract('LSHARE')
    }),
    stakeAssets: [
      {
        pluginId: 'fantom',
        currencyCode: 'LIF3',
        tokenId: 'bf60e7414ef09026733c1e7de72e393888c64da'
      },
      {
        pluginId: 'fantom',
        currencyCode: 'LSHARE',
        tokenId: 'cbe0ca46399af916784cadf5bcc3aed2052d6c45'
      }
    ],
    rewardAssets: [
      {
        pluginId: 'fantom',
        currencyCode: 'LSHARE',
        tokenId: 'cbe0ca46399af916784cadf5bcc3aed2052d6c45'
      }
    ]
  },
  {
    stakePolicyId: 'ftm_tombswap_cemetery_v2_33',
    stakeProviderInfo: tombCemeteryV2ProviderInfo,
    parentPluginId: 'fantom',
    parentCurrencyCode: 'FTM',
    policy: makeCemeteryPolicy({
      disableStake: true,
      poolId: 33,
      lpTokenContract: eco.makeContract('TOMBSWAP_L3USD_USDC_LP'),
      poolContract: eco.makeContract('CEMETERY_V2_REWARD_POOL'),
      swapRouterContract: eco.makeContract('TOMB_SWAP_ROUTER'),
      tokenAContract: eco.makeContract('L3USD'),
      tokenBContract: eco.makeContract('USDC')
    }),
    stakeAssets: [
      {
        pluginId: 'fantom',
        currencyCode: 'L3USD',
        tokenId: '5f0456f728e2d59028b4f5b8ad8c604100724c6a'
      },
      {
        pluginId: 'fantom',
        currencyCode: 'USDC',
        tokenId: '04068da6c83afcfa0e13ba15a6696662335d5b75'
      }
    ],
    rewardAssets: [
      {
        pluginId: 'fantom',
        currencyCode: 'LSHARE',
        tokenId: 'cbe0ca46399af916784cadf5bcc3aed2052d6c45'
      }
    ]
  },
  {
    stakePolicyId: 'ftm_tombswap_cemetery_v2_34',
    stakeProviderInfo: tombCemeteryV2ProviderInfo,
    parentPluginId: 'fantom',
    parentCurrencyCode: 'FTM',
    policy: makeCemeteryPolicy({
      disableStake: true,
      poolId: 34,
      lpTokenContract: eco.makeContract('TOMBSWAP_L3USD_FUSDT_LP'),
      poolContract: eco.makeContract('CEMETERY_V2_REWARD_POOL'),
      swapRouterContract: eco.makeContract('TOMB_SWAP_ROUTER'),
      tokenAContract: eco.makeContract('L3USD'),
      tokenBContract: eco.makeContract('FUSDT')
    }),
    stakeAssets: [
      {
        pluginId: 'fantom',
        currencyCode: 'L3USD',
        tokenId: '5f0456f728e2d59028b4f5b8ad8c604100724c6a'
      },
      {
        pluginId: 'fantom',
        currencyCode: 'FUSDT',
        tokenId: '049d68029688eabf473097a2fc38ef61633a3c7a'
      }
    ],
    rewardAssets: [
      {
        pluginId: 'fantom',
        currencyCode: 'LSHARE',
        tokenId: 'cbe0ca46399af916784cadf5bcc3aed2052d6c45'
      }
    ]
  },
  {
    stakePolicyId: 'ftm_tombswap_cemetery_v2_35',
    stakeProviderInfo: tombCemeteryV2ProviderInfo,
    parentPluginId: 'fantom',
    parentCurrencyCode: 'FTM',
    policy: makeCemeteryPolicy({
      disableStake: true,
      poolId: 35,
      lpTokenContract: eco.makeContract('TOMBSWAP_L3USD_DAI_LP'),
      poolContract: eco.makeContract('CEMETERY_V2_REWARD_POOL'),
      swapRouterContract: eco.makeContract('TOMB_SWAP_ROUTER'),
      tokenAContract: eco.makeContract('L3USD'),
      tokenBContract: eco.makeContract('DAI')
    }),
    stakeAssets: [
      {
        pluginId: 'fantom',
        currencyCode: 'L3USD',
        tokenId: '5f0456f728e2d59028b4f5b8ad8c604100724c6a'
      },
      {
        pluginId: 'fantom',
        currencyCode: 'DAI',
        tokenId: '8d11ec38a3eb5e956b052f67da8bdc9bef8abf3e'
      }
    ],
    rewardAssets: [
      {
        pluginId: 'fantom',
        currencyCode: 'LSHARE',
        tokenId: 'cbe0ca46399af916784cadf5bcc3aed2052d6c45'
      }
    ]
  }
  // TODO: After multi-hop swap support implemented OR if a direct swap route opens up for FTM->TREEB and FTM->FUSD, add those Cemetery V2 pools.
]
