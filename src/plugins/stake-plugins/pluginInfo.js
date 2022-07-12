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
      ]
    },
    {
      stakePolicyId: '',
      liquidityPool: tombSwapLiquidityPool,
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
      stakePolicyId: '',
      liquidityPool: tombSwapLiquidityPool,
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
      stakePolicyId: '',
      liquidityPool: tombSwapLiquidityPool,
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
      stakePolicyId: '',
      liquidityPool: tombSwapLiquidityPool,
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
      stakePolicyId: '',
      liquidityPool: tombSwapLiquidityPool,
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
      stakePolicyId: '',
      liquidityPool: tombSwapLiquidityPool,
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
      stakePolicyId: '',
      liquidityPool: tombSwapLiquidityPool,
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
      stakePolicyId: '',
      liquidityPool: tombSwapLiquidityPool,
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
      stakePolicyId: '',
      liquidityPool: tombSwapLiquidityPool,
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
      stakePolicyId: '',
      liquidityPool: tombSwapLiquidityPool,
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
      stakePolicyId: '',
      liquidityPool: tombSwapLiquidityPool,
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
      stakePolicyId: '',
      liquidityPool: tombSwapLiquidityPool,
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
      stakePolicyId: '',
      liquidityPool: tombSwapLiquidityPool,
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
      stakePolicyId: '',
      liquidityPool: tombSwapLiquidityPool,
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
      stakePolicyId: '',
      liquidityPool: tombSwapLiquidityPool,
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
      stakePolicyId: '',
      liquidityPool: tombSwapLiquidityPool,
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
      stakePolicyId: '',
      liquidityPool: tombSwapLiquidityPool,
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
      stakePolicyId: '',
      liquidityPool: tombSwapLiquidityPool,
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
      stakePolicyId: '',
      liquidityPool: tombSwapLiquidityPool,
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
      stakePolicyId: '',
      liquidityPool: tombSwapLiquidityPool,
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
      stakePolicyId: '',
      liquidityPool: tombSwapLiquidityPool,
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
      stakePolicyId: '',
      liquidityPool: tombSwapLiquidityPool,
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
      stakePolicyId: '',
      liquidityPool: tombSwapLiquidityPool,
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
      stakePolicyId: '',
      liquidityPool: tombSwapLiquidityPool,
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
      stakePolicyId: '',
      liquidityPool: tombSwapLiquidityPool,
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
      stakePolicyId: '',
      liquidityPool: tombSwapLiquidityPool,
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
      stakePolicyId: '',
      liquidityPool: tombSwapLiquidityPool,
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
      stakePolicyId: '',
      liquidityPool: tombSwapLiquidityPool,
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
    }

    // TODO: Add these pools after multi-hop swap support implemented OR if a direct swap route opens up for FTM->TREEB, FTM->FUSD
    // {
    //   stakePolicyId: '',
    //   liquidityPool: tombSwapLiquidityPool,
    //   parentPluginId: 'fantom',
    //   parentCurrencyCode: 'FTM',
    //   policy: makeCemeteryPolicy({
    //     poolId: 3,
    //     lpTokenContract: makeContract('TOMBSWAP_TOMB_TREEB_LP'),
    //     poolContract: makeContract('CEMETERY_V2_REWARD_POOL'),
    //     swapRouterContract: makeContract('TOMB_SWAP_ROUTER'),
    //     tokenAContract: makeContract('TOMB'),
    //     tokenBContract: makeContract('TREEB')
    //   }),
    //   stakeAssets: [
    //     { pluginId: 'fantom', currencyCode: 'TOMB' },
    //     { pluginId: 'fantom', currencyCode: 'TREEB' }
    //   ],
    //   rewardAssets: [{ pluginId: 'fantom', currencyCode: 'LSHARE' }]
    // },
    // {
    //   stakePolicyId: '',
    //   liquidityPool: tombSwapLiquidityPool,
    //   parentPluginId: 'fantom',
    //   parentCurrencyCode: 'FTM',
    //   policy: makeCemeteryPolicy({
    //     poolId: 9,
    //     lpTokenContract: makeContract('TOMBSWAP_USDC_FUSD_LP'),
    //     poolContract: makeContract('CEMETERY_V2_REWARD_POOL'),
    //     swapRouterContract: makeContract('TOMB_SWAP_ROUTER'),
    //     tokenAContract: makeContract('USDC'),
    //     tokenBContract: makeContract('FUSD')
    //   }),
    //   stakeAssets: [
    //     { pluginId: 'fantom', currencyCode: 'USDC' },
    //     { pluginId: 'fantom', currencyCode: 'FUSD' }
    //   ],
    //   rewardAssets: [{ pluginId: 'fantom', currencyCode: 'LSHARE' }]
    // },
  ].map(withGeneratedStakePolicyId)
}
