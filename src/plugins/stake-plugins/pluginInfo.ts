import { makeContract } from './contracts'
import { makeCemeteryPolicy } from './policies/cemeteryPolicy'
import { makeMasonryPolicy } from './policies/masonryPolicy'
import { StakePolicyInfo } from './stakePolicy'
import { StakeProviderInfo } from './types'

export type StakePluginInfo = {
  pluginId: string
  policyInfo: StakePolicyInfo[]
}

const tombCemeteryV2ProviderInfo: StakeProviderInfo = {
  displayName: 'Cemetery V2 (using TombSwap)',
  pluginId: 'fantom',
  stakeProviderId: 'tombswap_cemetery_v2'
}

export const pluginInfo: StakePluginInfo = {
  pluginId: 'stake:uniswapV2',
  policyInfo: [
    {
      stakePolicyId: 'ftm_tombswap_masonry_v1_0',
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
      ]
    },
    {
      stakePolicyId: 'ftm_tombswap_cemetery_v2_0',
      stakeProviderInfo: tombCemeteryV2ProviderInfo,
      parentPluginId: 'fantom',
      parentCurrencyCode: 'FTM',
      policy: makeCemeteryPolicy({
        poolId: 0,
        lpTokenContract: makeContract('TOMBSWAP_FTM_TOMB_LP'),
        poolContract: makeContract('CEMETERY_V2_REWARD_POOL'),
        swapRouterContract: makeContract('TOMB_SWAP_ROUTER'),
        tokenAContract: makeContract('FTM'),
        tokenBContract: makeContract('TOMB')
      }),
      stakeAssets: [
        { pluginId: 'fantom', currencyCode: 'FTM' },
        { pluginId: 'fantom', currencyCode: 'TOMB' }
      ],
      rewardAssets: [{ pluginId: 'fantom', currencyCode: 'LSHARE' }]
    },
    {
      stakePolicyId: 'ftm_tombswap_cemetery_v2_1',
      stakeProviderInfo: tombCemeteryV2ProviderInfo,
      parentPluginId: 'fantom',
      parentCurrencyCode: 'FTM',
      policy: makeCemeteryPolicy({
        poolId: 1,
        lpTokenContract: makeContract('TOMBSWAP_TOMB_USDC_LP'),
        poolContract: makeContract('CEMETERY_V2_REWARD_POOL'),
        swapRouterContract: makeContract('TOMB_SWAP_ROUTER'),
        tokenAContract: makeContract('TOMB'),
        tokenBContract: makeContract('USDC')
      }),
      stakeAssets: [
        { pluginId: 'fantom', currencyCode: 'TOMB' },
        { pluginId: 'fantom', currencyCode: 'USDC' }
      ],
      rewardAssets: [{ pluginId: 'fantom', currencyCode: 'LSHARE' }]
    },
    {
      stakePolicyId: 'ftm_tombswap_cemetery_v2_2',
      stakeProviderInfo: tombCemeteryV2ProviderInfo,
      parentPluginId: 'fantom',
      parentCurrencyCode: 'FTM',
      policy: makeCemeteryPolicy({
        poolId: 2,
        lpTokenContract: makeContract('TOMBSWAP_ZOO_TOMB_LP'),
        poolContract: makeContract('CEMETERY_V2_REWARD_POOL'),
        swapRouterContract: makeContract('TOMB_SWAP_ROUTER'),
        tokenAContract: makeContract('ZOO'),
        tokenBContract: makeContract('TOMB')
      }),
      stakeAssets: [
        { pluginId: 'fantom', currencyCode: 'ZOO' },
        { pluginId: 'fantom', currencyCode: 'TOMB' }
      ],
      rewardAssets: [{ pluginId: 'fantom', currencyCode: 'LSHARE' }]
    },
    {
      stakePolicyId: 'ftm_tombswap_cemetery_v2_4',
      stakeProviderInfo: tombCemeteryV2ProviderInfo,
      parentPluginId: 'fantom',
      parentCurrencyCode: 'FTM',
      policy: makeCemeteryPolicy({
        poolId: 4,
        lpTokenContract: makeContract('TOMBSWAP_BTC_TSHARE_LP'),
        poolContract: makeContract('CEMETERY_V2_REWARD_POOL'),
        swapRouterContract: makeContract('TOMB_SWAP_ROUTER'),
        tokenAContract: makeContract('BTC'),
        tokenBContract: makeContract('TSHARE')
      }),
      stakeAssets: [
        { pluginId: 'fantom', currencyCode: 'BTC' },
        { pluginId: 'fantom', currencyCode: 'TSHARE' }
      ],
      rewardAssets: [{ pluginId: 'fantom', currencyCode: 'LSHARE' }]
    },
    {
      stakePolicyId: 'ftm_tombswap_cemetery_v2_5',
      stakeProviderInfo: tombCemeteryV2ProviderInfo,
      parentPluginId: 'fantom',
      parentCurrencyCode: 'FTM',
      policy: makeCemeteryPolicy({
        poolId: 5,
        lpTokenContract: makeContract('TOMBSWAP_TSHARE_ETH_LP'),
        poolContract: makeContract('CEMETERY_V2_REWARD_POOL'),
        swapRouterContract: makeContract('TOMB_SWAP_ROUTER'),
        tokenAContract: makeContract('TSHARE'),
        tokenBContract: makeContract('ETH')
      }),
      stakeAssets: [
        { pluginId: 'fantom', currencyCode: 'TSHARE' },
        { pluginId: 'fantom', currencyCode: 'ETH' }
      ],
      rewardAssets: [{ pluginId: 'fantom', currencyCode: 'LSHARE' }]
    },
    {
      stakePolicyId: 'ftm_tombswap_cemetery_v2_6',
      stakeProviderInfo: tombCemeteryV2ProviderInfo,
      parentPluginId: 'fantom',
      parentCurrencyCode: 'FTM',
      policy: makeCemeteryPolicy({
        poolId: 6,
        lpTokenContract: makeContract('TOMBSWAP_USDC_TSHARE_LP'),
        poolContract: makeContract('CEMETERY_V2_REWARD_POOL'),
        swapRouterContract: makeContract('TOMB_SWAP_ROUTER'),
        tokenAContract: makeContract('USDC'),
        tokenBContract: makeContract('TSHARE')
      }),
      stakeAssets: [
        { pluginId: 'fantom', currencyCode: 'USDC' },
        { pluginId: 'fantom', currencyCode: 'TSHARE' }
      ],
      rewardAssets: [{ pluginId: 'fantom', currencyCode: 'LSHARE' }]
    },
    {
      stakePolicyId: 'ftm_tombswap_cemetery_v2_7',
      stakeProviderInfo: tombCemeteryV2ProviderInfo,
      parentPluginId: 'fantom',
      parentCurrencyCode: 'FTM',
      policy: makeCemeteryPolicy({
        poolId: 7,
        lpTokenContract: makeContract('TOMBSWAP_USDC_FUSDT_LP'),
        poolContract: makeContract('CEMETERY_V2_REWARD_POOL'),
        swapRouterContract: makeContract('TOMB_SWAP_ROUTER'),
        tokenAContract: makeContract('USDC'),
        tokenBContract: makeContract('FUSDT')
      }),
      stakeAssets: [
        { pluginId: 'fantom', currencyCode: 'USDC' },
        { pluginId: 'fantom', currencyCode: 'FUSDT' }
      ],
      rewardAssets: [{ pluginId: 'fantom', currencyCode: 'LSHARE' }]
    },
    {
      stakePolicyId: 'ftm_tombswap_cemetery_v2_8',
      stakeProviderInfo: tombCemeteryV2ProviderInfo,
      parentPluginId: 'fantom',
      parentCurrencyCode: 'FTM',
      policy: makeCemeteryPolicy({
        poolId: 8,
        lpTokenContract: makeContract('TOMBSWAP_USDC_MIM_LP'),
        poolContract: makeContract('CEMETERY_V2_REWARD_POOL'),
        swapRouterContract: makeContract('TOMB_SWAP_ROUTER'),
        tokenAContract: makeContract('USDC'),
        tokenBContract: makeContract('MIM')
      }),
      stakeAssets: [
        { pluginId: 'fantom', currencyCode: 'USDC' },
        { pluginId: 'fantom', currencyCode: 'MIM' }
      ],
      rewardAssets: [{ pluginId: 'fantom', currencyCode: 'LSHARE' }]
    },

    {
      stakePolicyId: 'ftm_tombswap_cemetery_v2_10',
      stakeProviderInfo: tombCemeteryV2ProviderInfo,
      parentPluginId: 'fantom',
      parentCurrencyCode: 'FTM',
      policy: makeCemeteryPolicy({
        poolId: 10,
        lpTokenContract: makeContract('TOMBSWAP_USDC_FTM_LP'),
        poolContract: makeContract('CEMETERY_V2_REWARD_POOL'),
        swapRouterContract: makeContract('TOMB_SWAP_ROUTER'),
        tokenAContract: makeContract('USDC'),
        tokenBContract: makeContract('FTM')
      }),
      stakeAssets: [
        { pluginId: 'fantom', currencyCode: 'USDC' },
        { pluginId: 'fantom', currencyCode: 'FTM' }
      ],
      rewardAssets: [{ pluginId: 'fantom', currencyCode: 'LSHARE' }]
    },
    {
      stakePolicyId: 'ftm_tombswap_cemetery_v2_11',
      stakeProviderInfo: tombCemeteryV2ProviderInfo,
      parentPluginId: 'fantom',
      parentCurrencyCode: 'FTM',
      policy: makeCemeteryPolicy({
        poolId: 11,
        lpTokenContract: makeContract('TOMBSWAP_FTM_DAI_LP'),
        poolContract: makeContract('CEMETERY_V2_REWARD_POOL'),
        swapRouterContract: makeContract('TOMB_SWAP_ROUTER'),
        tokenAContract: makeContract('FTM'),
        tokenBContract: makeContract('DAI')
      }),
      stakeAssets: [
        { pluginId: 'fantom', currencyCode: 'FTM' },
        { pluginId: 'fantom', currencyCode: 'DAI' }
      ],
      rewardAssets: [{ pluginId: 'fantom', currencyCode: 'LSHARE' }]
    },
    {
      stakePolicyId: 'ftm_tombswap_cemetery_v2_12',
      stakeProviderInfo: tombCemeteryV2ProviderInfo,
      parentPluginId: 'fantom',
      parentCurrencyCode: 'FTM',
      policy: makeCemeteryPolicy({
        poolId: 12,
        lpTokenContract: makeContract('TOMBSWAP_FTM_ETH_LP'),
        poolContract: makeContract('CEMETERY_V2_REWARD_POOL'),
        swapRouterContract: makeContract('TOMB_SWAP_ROUTER'),
        tokenAContract: makeContract('FTM'),
        tokenBContract: makeContract('ETH')
      }),
      stakeAssets: [
        { pluginId: 'fantom', currencyCode: 'FTM' },
        { pluginId: 'fantom', currencyCode: 'ETH' }
      ],
      rewardAssets: [{ pluginId: 'fantom', currencyCode: 'LSHARE' }]
    },
    {
      stakePolicyId: 'ftm_tombswap_cemetery_v2_13',
      stakeProviderInfo: tombCemeteryV2ProviderInfo,
      parentPluginId: 'fantom',
      parentCurrencyCode: 'FTM',
      policy: makeCemeteryPolicy({
        poolId: 13,
        lpTokenContract: makeContract('TOMBSWAP_FUSDT_FTM_LP'),
        poolContract: makeContract('CEMETERY_V2_REWARD_POOL'),
        swapRouterContract: makeContract('TOMB_SWAP_ROUTER'),
        tokenAContract: makeContract('FUSDT'),
        tokenBContract: makeContract('FTM')
      }),
      stakeAssets: [
        { pluginId: 'fantom', currencyCode: 'FUSDT' },
        { pluginId: 'fantom', currencyCode: 'FTM' }
      ],
      rewardAssets: [{ pluginId: 'fantom', currencyCode: 'LSHARE' }]
    },
    {
      stakePolicyId: 'ftm_tombswap_cemetery_v2_14',
      stakeProviderInfo: tombCemeteryV2ProviderInfo,
      parentPluginId: 'fantom',
      parentCurrencyCode: 'FTM',
      policy: makeCemeteryPolicy({
        poolId: 14,
        lpTokenContract: makeContract('TOMBSWAP_FTM_BTC_LP'),
        poolContract: makeContract('CEMETERY_V2_REWARD_POOL'),
        swapRouterContract: makeContract('TOMB_SWAP_ROUTER'),
        tokenAContract: makeContract('FTM'),
        tokenBContract: makeContract('BTC')
      }),
      stakeAssets: [
        { pluginId: 'fantom', currencyCode: 'FTM' },
        { pluginId: 'fantom', currencyCode: 'BTC' }
      ],
      rewardAssets: [{ pluginId: 'fantom', currencyCode: 'LSHARE' }]
    },
    {
      stakePolicyId: 'ftm_tombswap_cemetery_v2_15',
      stakeProviderInfo: tombCemeteryV2ProviderInfo,
      parentPluginId: 'fantom',
      parentCurrencyCode: 'FTM',
      policy: makeCemeteryPolicy({
        poolId: 15,
        lpTokenContract: makeContract('TOMBSWAP_FTM_MIM_LP'),
        poolContract: makeContract('CEMETERY_V2_REWARD_POOL'),
        swapRouterContract: makeContract('TOMB_SWAP_ROUTER'),
        tokenAContract: makeContract('FTM'),
        tokenBContract: makeContract('MIM')
      }),
      stakeAssets: [
        { pluginId: 'fantom', currencyCode: 'FTM' },
        { pluginId: 'fantom', currencyCode: 'MIM' }
      ],
      rewardAssets: [{ pluginId: 'fantom', currencyCode: 'LSHARE' }]
    },
    {
      stakePolicyId: 'ftm_tombswap_cemetery_v2_16',
      stakeProviderInfo: tombCemeteryV2ProviderInfo,
      parentPluginId: 'fantom',
      parentCurrencyCode: 'FTM',
      policy: makeCemeteryPolicy({
        poolId: 16,
        lpTokenContract: makeContract('TOMBSWAP_FTM_BNB_LP'),
        poolContract: makeContract('CEMETERY_V2_REWARD_POOL'),
        swapRouterContract: makeContract('TOMB_SWAP_ROUTER'),
        tokenAContract: makeContract('FTM'),
        tokenBContract: makeContract('BNB')
      }),
      stakeAssets: [
        { pluginId: 'fantom', currencyCode: 'FTM' },
        { pluginId: 'fantom', currencyCode: 'BNB' }
      ],
      rewardAssets: [{ pluginId: 'fantom', currencyCode: 'LSHARE' }]
    },
    {
      stakePolicyId: 'ftm_tombswap_cemetery_v2_17',
      stakeProviderInfo: tombCemeteryV2ProviderInfo,
      parentPluginId: 'fantom',
      parentCurrencyCode: 'FTM',
      policy: makeCemeteryPolicy({
        poolId: 17,
        lpTokenContract: makeContract('TOMBSWAP_FTM_AVAX_LP'),
        poolContract: makeContract('CEMETERY_V2_REWARD_POOL'),
        swapRouterContract: makeContract('TOMB_SWAP_ROUTER'),
        tokenAContract: makeContract('FTM'),
        tokenBContract: makeContract('AVAX')
      }),
      stakeAssets: [
        { pluginId: 'fantom', currencyCode: 'FTM' },
        { pluginId: 'fantom', currencyCode: 'AVAX' }
      ],
      rewardAssets: [{ pluginId: 'fantom', currencyCode: 'LSHARE' }]
    },
    {
      stakePolicyId: 'ftm_tombswap_cemetery_v2_18',
      stakeProviderInfo: tombCemeteryV2ProviderInfo,
      parentPluginId: 'fantom',
      parentCurrencyCode: 'FTM',
      policy: makeCemeteryPolicy({
        poolId: 18,
        lpTokenContract: makeContract('TOMBSWAP_FTM_LINK_LP'),
        poolContract: makeContract('CEMETERY_V2_REWARD_POOL'),
        swapRouterContract: makeContract('TOMB_SWAP_ROUTER'),
        tokenAContract: makeContract('FTM'),
        tokenBContract: makeContract('LINK')
      }),
      stakeAssets: [
        { pluginId: 'fantom', currencyCode: 'FTM' },
        { pluginId: 'fantom', currencyCode: 'LINK' }
      ],
      rewardAssets: [{ pluginId: 'fantom', currencyCode: 'LSHARE' }]
    },
    {
      stakePolicyId: 'ftm_tombswap_cemetery_v2_19',
      stakeProviderInfo: tombCemeteryV2ProviderInfo,
      parentPluginId: 'fantom',
      parentCurrencyCode: 'FTM',
      policy: makeCemeteryPolicy({
        poolId: 19,
        lpTokenContract: makeContract('TOMBSWAP_CRV_FTM_LP'),
        poolContract: makeContract('CEMETERY_V2_REWARD_POOL'),
        swapRouterContract: makeContract('TOMB_SWAP_ROUTER'),
        tokenAContract: makeContract('CRV'),
        tokenBContract: makeContract('FTM')
      }),
      stakeAssets: [
        { pluginId: 'fantom', currencyCode: 'CRV' },
        { pluginId: 'fantom', currencyCode: 'FTM' }
      ],
      rewardAssets: [{ pluginId: 'fantom', currencyCode: 'LSHARE' }]
    },
    {
      stakePolicyId: 'ftm_tombswap_cemetery_v2_20',
      stakeProviderInfo: tombCemeteryV2ProviderInfo,
      parentPluginId: 'fantom',
      parentCurrencyCode: 'FTM',
      policy: makeCemeteryPolicy({
        poolId: 20,
        lpTokenContract: makeContract('TOMBSWAP_BTC_ETH_LP'),
        poolContract: makeContract('CEMETERY_V2_REWARD_POOL'),
        swapRouterContract: makeContract('TOMB_SWAP_ROUTER'),
        tokenAContract: makeContract('BTC'),
        tokenBContract: makeContract('ETH')
      }),
      stakeAssets: [
        { pluginId: 'fantom', currencyCode: 'BTC' },
        { pluginId: 'fantom', currencyCode: 'ETH' }
      ],
      rewardAssets: [{ pluginId: 'fantom', currencyCode: 'LSHARE' }]
    },
    {
      stakePolicyId: 'ftm_tombswap_cemetery_v2_21',
      stakeProviderInfo: tombCemeteryV2ProviderInfo,
      parentPluginId: 'fantom',
      parentCurrencyCode: 'FTM',
      policy: makeCemeteryPolicy({
        poolId: 21,
        lpTokenContract: makeContract('TOMBSWAP_TOMB_LIF3_LP'),
        poolContract: makeContract('CEMETERY_V2_REWARD_POOL'),
        swapRouterContract: makeContract('TOMB_SWAP_ROUTER'),
        tokenAContract: makeContract('TOMB'),
        tokenBContract: makeContract('LIF3')
      }),
      stakeAssets: [
        { pluginId: 'fantom', currencyCode: 'TOMB' },
        { pluginId: 'fantom', currencyCode: 'LIF3' }
      ],
      rewardAssets: [{ pluginId: 'fantom', currencyCode: 'LSHARE' }]
    },
    {
      stakePolicyId: 'ftm_tombswap_cemetery_v2_22',
      stakeProviderInfo: tombCemeteryV2ProviderInfo,
      parentPluginId: 'fantom',
      parentCurrencyCode: 'FTM',
      policy: makeCemeteryPolicy({
        poolId: 22,
        lpTokenContract: makeContract('TOMBSWAP_TSHARE_LSHARE_LP'),
        poolContract: makeContract('CEMETERY_V2_REWARD_POOL'),
        swapRouterContract: makeContract('TOMB_SWAP_ROUTER'),
        tokenAContract: makeContract('TSHARE'),
        tokenBContract: makeContract('LSHARE')
      }),
      stakeAssets: [
        { pluginId: 'fantom', currencyCode: 'TSHARE' },
        { pluginId: 'fantom', currencyCode: 'LSHARE' }
      ],
      rewardAssets: [{ pluginId: 'fantom', currencyCode: 'LSHARE' }]
    },
    {
      stakePolicyId: 'ftm_tombswap_cemetery_v2_23',
      stakeProviderInfo: tombCemeteryV2ProviderInfo,
      parentPluginId: 'fantom',
      parentCurrencyCode: 'FTM',
      policy: makeCemeteryPolicy({
        poolId: 23,
        lpTokenContract: makeContract('TOMBSWAP_USDC_LIF3_LP'),
        poolContract: makeContract('CEMETERY_V2_REWARD_POOL'),
        swapRouterContract: makeContract('TOMB_SWAP_ROUTER'),
        tokenAContract: makeContract('USDC'),
        tokenBContract: makeContract('LIF3')
      }),
      stakeAssets: [
        { pluginId: 'fantom', currencyCode: 'USDC' },
        { pluginId: 'fantom', currencyCode: 'LIF3' }
      ],
      rewardAssets: [{ pluginId: 'fantom', currencyCode: 'LSHARE' }]
    },
    {
      stakePolicyId: 'ftm_tombswap_cemetery_v2_24',
      stakeProviderInfo: tombCemeteryV2ProviderInfo,
      parentPluginId: 'fantom',
      parentCurrencyCode: 'FTM',
      policy: makeCemeteryPolicy({
        poolId: 24,
        lpTokenContract: makeContract('TOMBSWAP_USDC_LSHARE_LP'),
        poolContract: makeContract('CEMETERY_V2_REWARD_POOL'),
        swapRouterContract: makeContract('TOMB_SWAP_ROUTER'),
        tokenAContract: makeContract('USDC'),
        tokenBContract: makeContract('LSHARE')
      }),
      stakeAssets: [
        { pluginId: 'fantom', currencyCode: 'USDC' },
        { pluginId: 'fantom', currencyCode: 'LSHARE' }
      ],
      rewardAssets: [{ pluginId: 'fantom', currencyCode: 'LSHARE' }]
    },
    {
      stakePolicyId: 'ftm_tombswap_cemetery_v2_25',
      stakeProviderInfo: tombCemeteryV2ProviderInfo,
      parentPluginId: 'fantom',
      parentCurrencyCode: 'FTM',
      policy: makeCemeteryPolicy({
        poolId: 25,
        lpTokenContract: makeContract('TOMBSWAP_FTM_LIF3_LP'),
        poolContract: makeContract('CEMETERY_V2_REWARD_POOL'),
        swapRouterContract: makeContract('TOMB_SWAP_ROUTER'),
        tokenAContract: makeContract('FTM'),
        tokenBContract: makeContract('LIF3')
      }),
      stakeAssets: [
        { pluginId: 'fantom', currencyCode: 'FTM' },
        { pluginId: 'fantom', currencyCode: 'LIF3' }
      ],
      rewardAssets: [{ pluginId: 'fantom', currencyCode: 'LSHARE' }]
    },
    {
      stakePolicyId: 'ftm_tombswap_cemetery_v2_26',
      stakeProviderInfo: tombCemeteryV2ProviderInfo,
      parentPluginId: 'fantom',
      parentCurrencyCode: 'FTM',
      policy: makeCemeteryPolicy({
        poolId: 26,
        lpTokenContract: makeContract('TOMBSWAP_TBOND_TOMB_LP'),
        poolContract: makeContract('CEMETERY_V2_REWARD_POOL'),
        swapRouterContract: makeContract('TOMB_SWAP_ROUTER'),
        tokenAContract: makeContract('TBOND'),
        tokenBContract: makeContract('TOMB')
      }),
      stakeAssets: [
        { pluginId: 'fantom', currencyCode: 'TBOND' },
        { pluginId: 'fantom', currencyCode: 'TOMB' }
      ],
      rewardAssets: [{ pluginId: 'fantom', currencyCode: 'LSHARE' }]
    },
    {
      stakePolicyId: 'ftm_tombswap_cemetery_v2_27',
      stakeProviderInfo: tombCemeteryV2ProviderInfo,
      parentPluginId: 'fantom',
      parentCurrencyCode: 'FTM',
      policy: makeCemeteryPolicy({
        poolId: 27,
        lpTokenContract: makeContract('TOMBSWAP_FTM_LSHARE_LP'),
        poolContract: makeContract('CEMETERY_V2_REWARD_POOL'),
        swapRouterContract: makeContract('TOMB_SWAP_ROUTER'),
        tokenAContract: makeContract('FTM'),
        tokenBContract: makeContract('LSHARE')
      }),
      stakeAssets: [
        { pluginId: 'fantom', currencyCode: 'FTM' },
        { pluginId: 'fantom', currencyCode: 'LSHARE' }
      ],
      rewardAssets: [{ pluginId: 'fantom', currencyCode: 'LSHARE' }]
    },
    {
      stakePolicyId: 'ftm_tombswap_cemetery_v2_28',
      stakeProviderInfo: tombCemeteryV2ProviderInfo,
      parentPluginId: 'fantom',
      parentCurrencyCode: 'FTM',
      policy: makeCemeteryPolicy({
        poolId: 28,
        lpTokenContract: makeContract('TOMBSWAP_TOMB_LSHARE_LP'),
        poolContract: makeContract('CEMETERY_V2_REWARD_POOL'),
        swapRouterContract: makeContract('TOMB_SWAP_ROUTER'),
        tokenAContract: makeContract('TOMB'),
        tokenBContract: makeContract('LSHARE')
      }),
      stakeAssets: [
        { pluginId: 'fantom', currencyCode: 'TOMB' },
        { pluginId: 'fantom', currencyCode: 'LSHARE' }
      ],
      rewardAssets: [{ pluginId: 'fantom', currencyCode: 'LSHARE' }]
    },
    {
      stakePolicyId: 'ftm_tombswap_cemetery_v2_29',
      stakeProviderInfo: tombCemeteryV2ProviderInfo,
      parentPluginId: 'fantom',
      parentCurrencyCode: 'FTM',
      policy: makeCemeteryPolicy({
        poolId: 29,
        lpTokenContract: makeContract('TOMBSWAP_LIF3_LSHARE_LP'),
        poolContract: makeContract('CEMETERY_V2_REWARD_POOL'),
        swapRouterContract: makeContract('TOMB_SWAP_ROUTER'),
        tokenAContract: makeContract('LIF3'),
        tokenBContract: makeContract('LSHARE')
      }),
      stakeAssets: [
        { pluginId: 'fantom', currencyCode: 'LIF3' },
        { pluginId: 'fantom', currencyCode: 'LSHARE' }
      ],
      rewardAssets: [{ pluginId: 'fantom', currencyCode: 'LSHARE' }]
    },
    {
      stakePolicyId: 'ftm_tombswap_cemetery_v2_33',
      stakeProviderInfo: tombCemeteryV2ProviderInfo,
      parentPluginId: 'fantom',
      parentCurrencyCode: 'FTM',
      policy: makeCemeteryPolicy({
        poolId: 33,
        lpTokenContract: makeContract('TOMBSWAP_L3USD_USDC_LP'),
        poolContract: makeContract('CEMETERY_V2_REWARD_POOL'),
        swapRouterContract: makeContract('TOMB_SWAP_ROUTER'),
        tokenAContract: makeContract('L3USD'),
        tokenBContract: makeContract('USDC')
      }),
      stakeAssets: [
        { pluginId: 'fantom', currencyCode: 'L3USD' },
        { pluginId: 'fantom', currencyCode: 'USDC' }
      ],
      rewardAssets: [{ pluginId: 'fantom', currencyCode: 'LSHARE' }]
    },
    {
      stakePolicyId: 'ftm_tombswap_cemetery_v2_34',
      stakeProviderInfo: tombCemeteryV2ProviderInfo,
      parentPluginId: 'fantom',
      parentCurrencyCode: 'FTM',
      policy: makeCemeteryPolicy({
        poolId: 34,
        lpTokenContract: makeContract('TOMBSWAP_L3USD_FUSDT_LP'),
        poolContract: makeContract('CEMETERY_V2_REWARD_POOL'),
        swapRouterContract: makeContract('TOMB_SWAP_ROUTER'),
        tokenAContract: makeContract('L3USD'),
        tokenBContract: makeContract('FUSDT')
      }),
      stakeAssets: [
        { pluginId: 'fantom', currencyCode: 'L3USD' },
        { pluginId: 'fantom', currencyCode: 'FUSDT' }
      ],
      rewardAssets: [{ pluginId: 'fantom', currencyCode: 'LSHARE' }]
    },
    {
      stakePolicyId: 'ftm_tombswap_cemetery_v2_35',
      stakeProviderInfo: tombCemeteryV2ProviderInfo,
      parentPluginId: 'fantom',
      parentCurrencyCode: 'FTM',
      policy: makeCemeteryPolicy({
        poolId: 35,
        lpTokenContract: makeContract('TOMBSWAP_L3USD_DAI_LP'),
        poolContract: makeContract('CEMETERY_V2_REWARD_POOL'),
        swapRouterContract: makeContract('TOMB_SWAP_ROUTER'),
        tokenAContract: makeContract('L3USD'),
        tokenBContract: makeContract('DAI')
      }),
      stakeAssets: [
        { pluginId: 'fantom', currencyCode: 'L3USD' },
        { pluginId: 'fantom', currencyCode: 'DAI' }
      ],
      rewardAssets: [{ pluginId: 'fantom', currencyCode: 'LSHARE' }]
    }
    // TODO: After multi-hop swap support implemented OR if a direct swap route opens up for FTM->TREEB and FTM->FUSD, add those Cemetery V2 pools.
  ]
}
