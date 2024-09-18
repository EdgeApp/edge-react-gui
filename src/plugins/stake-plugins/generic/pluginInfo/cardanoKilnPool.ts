import { ENV } from '../../../../env'
import { CardanoPooledKilnAdapterConfig } from '../policyAdapters/CardanoKilnAdaptor'
import { StakePluginInfo, StakePolicyConfig } from '../types'

const kilnPolicyConfig: Array<StakePolicyConfig<CardanoPooledKilnAdapterConfig>> = [
  {
    stakePolicyId: 'cardano_kiln_pool0',
    stakeProviderInfo: {
      displayName: 'Cardano Staking Pool (KILN0)',
      pluginId: 'cardano',
      stakeProviderId: 'cardano_pooled_kiln'
    },
    parentPluginId: 'cardano',
    parentCurrencyCode: 'ADA',
    adapterConfig: {
      type: 'cardano-pooled-kiln',
      pluginId: 'cardano',

      accountId: ENV.KILN_MAINNET_ACCOUNT_ID,
      apiKey: ENV.KILN_MAINNET_API_KEY,
      baseUrl: 'https://api.kiln.fi',
      poolId: 'pool10rdglgh4pzvkf936p2m669qzarr9dusrhmmz9nultm3uvq4eh5k'
    },
    hideUnstakeAndClaimAction: true,
    isLiquidStaking: true,
    stakeAssets: [{ pluginId: 'cardano', currencyCode: 'ADA' }],
    rewardAssets: [{ pluginId: 'cardano', currencyCode: 'ADA' }]
  },
  {
    stakePolicyId: 'cardano_kiln_pool1',
    stakeProviderInfo: {
      displayName: 'Cardano Staking Pool (KILN1)',
      pluginId: 'cardano',
      stakeProviderId: 'cardano_pooled_kiln'
    },
    parentPluginId: 'cardano',
    parentCurrencyCode: 'ADA',
    adapterConfig: {
      type: 'cardano-pooled-kiln',
      pluginId: 'cardano',

      accountId: ENV.KILN_MAINNET_ACCOUNT_ID,
      apiKey: ENV.KILN_MAINNET_API_KEY,
      baseUrl: 'https://api.kiln.fi',
      poolId: 'pool1fcp4d2pxh0e7q5ju63sjqcdpxpr3pvxg6ykl23t6c97d7dnvjvw'
    },
    hideUnstakeAndClaimAction: true,
    isLiquidStaking: true,
    stakeAssets: [{ pluginId: 'cardano', currencyCode: 'ADA' }],
    rewardAssets: [{ pluginId: 'cardano', currencyCode: 'ADA' }]
  },
  {
    stakePolicyId: 'cardano_kiln_pool2',
    stakeProviderInfo: {
      displayName: 'Cardano Staking Pool (KILN2)',
      pluginId: 'cardano',
      stakeProviderId: 'cardano_pooled_kiln'
    },
    parentPluginId: 'cardano',
    parentCurrencyCode: 'ADA',
    adapterConfig: {
      type: 'cardano-pooled-kiln',
      pluginId: 'cardano',

      accountId: ENV.KILN_MAINNET_ACCOUNT_ID,
      apiKey: ENV.KILN_MAINNET_API_KEY,
      baseUrl: 'https://api.kiln.fi',
      poolId: 'pool1v62c7d92xv6gyh4x9rhfpkwzlpw2ypxk92xvzavakg3xypatklv'
    },
    hideUnstakeAndClaimAction: true,
    isLiquidStaking: true,
    stakeAssets: [{ pluginId: 'cardano', currencyCode: 'ADA' }],
    rewardAssets: [{ pluginId: 'cardano', currencyCode: 'ADA' }]
  },
  {
    stakePolicyId: 'cardano_kiln_pool3',
    stakeProviderInfo: {
      displayName: 'Cardano Staking Pool (KILN3)',
      pluginId: 'cardano',
      stakeProviderId: 'cardano_pooled_kiln'
    },
    parentPluginId: 'cardano',
    parentCurrencyCode: 'ADA',
    adapterConfig: {
      type: 'cardano-pooled-kiln',
      pluginId: 'cardano',

      accountId: ENV.KILN_MAINNET_ACCOUNT_ID,
      apiKey: ENV.KILN_MAINNET_API_KEY,
      baseUrl: 'https://api.kiln.fi',
      poolId: 'pool1mtxmk0skqkr5y0wxnxps4n35j6wn9q8dfr82y423vvlp53vccux'
    },
    hideUnstakeAndClaimAction: true,
    isLiquidStaking: true,
    stakeAssets: [{ pluginId: 'cardano', currencyCode: 'ADA' }],
    rewardAssets: [{ pluginId: 'cardano', currencyCode: 'ADA' }]
  },
  {
    stakePolicyId: 'cardano_kiln_pool4',
    stakeProviderInfo: {
      displayName: 'Cardano Staking Pool (KILN4)',
      pluginId: 'cardano',
      stakeProviderId: 'cardano_pooled_kiln'
    },
    parentPluginId: 'cardano',
    parentCurrencyCode: 'ADA',
    adapterConfig: {
      type: 'cardano-pooled-kiln',
      pluginId: 'cardano',

      accountId: ENV.KILN_MAINNET_ACCOUNT_ID,
      apiKey: ENV.KILN_MAINNET_API_KEY,
      baseUrl: 'https://api.kiln.fi',
      poolId: 'pool10d6mmw3mn9ku3r7uqqye672dz3sv76lh5kvh5rdpr9l5ug5yknr'
    },
    hideUnstakeAndClaimAction: true,
    isLiquidStaking: true,
    stakeAssets: [{ pluginId: 'cardano', currencyCode: 'ADA' }],
    rewardAssets: [{ pluginId: 'cardano', currencyCode: 'ADA' }]
  },
  {
    stakePolicyId: 'cardano_kiln_pool6',
    stakeProviderInfo: {
      displayName: 'Cardano Staking Pool (KILN6)',
      pluginId: 'cardano',
      stakeProviderId: 'cardano_pooled_kiln'
    },
    parentPluginId: 'cardano',
    parentCurrencyCode: 'ADA',
    adapterConfig: {
      type: 'cardano-pooled-kiln',
      pluginId: 'cardano',

      accountId: ENV.KILN_MAINNET_ACCOUNT_ID,
      apiKey: ENV.KILN_MAINNET_API_KEY,
      baseUrl: 'https://api.kiln.fi',
      poolId: 'pool1mtuhuh8hkf8am0qzx45y58kll8q83sjh6pwljrflcmw970d82f3'
    },
    hideUnstakeAndClaimAction: true,
    isLiquidStaking: true,
    stakeAssets: [{ pluginId: 'cardano', currencyCode: 'ADA' }],
    rewardAssets: [{ pluginId: 'cardano', currencyCode: 'ADA' }]
  },
  {
    stakePolicyId: 'cardano_kiln_pool7',
    stakeProviderInfo: {
      displayName: 'Cardano Staking Pool (KILN7)',
      pluginId: 'cardano',
      stakeProviderId: 'cardano_pooled_kiln'
    },
    parentPluginId: 'cardano',
    parentCurrencyCode: 'ADA',
    adapterConfig: {
      type: 'cardano-pooled-kiln',
      pluginId: 'cardano',

      accountId: ENV.KILN_MAINNET_ACCOUNT_ID,
      apiKey: ENV.KILN_MAINNET_API_KEY,
      baseUrl: 'https://api.kiln.fi',
      poolId: 'pool1aqg8vxzv75zhjzjjd9s20fu6r0xz70yl8lk3teacwy7qyc2p2j7'
    },
    hideUnstakeAndClaimAction: true,
    isLiquidStaking: true,
    stakeAssets: [{ pluginId: 'cardano', currencyCode: 'ADA' }],
    rewardAssets: [{ pluginId: 'cardano', currencyCode: 'ADA' }]
  },
  {
    stakePolicyId: 'cardano_kiln_pool8',
    stakeProviderInfo: {
      displayName: 'Cardano Staking Pool (KILN8)',
      pluginId: 'cardano',
      stakeProviderId: 'cardano_pooled_kiln'
    },
    parentPluginId: 'cardano',
    parentCurrencyCode: 'ADA',
    adapterConfig: {
      type: 'cardano-pooled-kiln',
      pluginId: 'cardano',

      accountId: ENV.KILN_MAINNET_ACCOUNT_ID,
      apiKey: ENV.KILN_MAINNET_API_KEY,
      baseUrl: 'https://api.kiln.fi',
      poolId: 'pool19kfm6lz5uw7nylq27swr367mqdycmug7tve94l6h3xsz64seqtc'
    },
    hideUnstakeAndClaimAction: true,
    isLiquidStaking: true,
    stakeAssets: [{ pluginId: 'cardano', currencyCode: 'ADA' }],
    rewardAssets: [{ pluginId: 'cardano', currencyCode: 'ADA' }]
  }
]

export const kilncardanopool: StakePluginInfo = {
  pluginId: 'stake:cardano:kiln',
  policyConfigs: [...kilnPolicyConfig]
}
