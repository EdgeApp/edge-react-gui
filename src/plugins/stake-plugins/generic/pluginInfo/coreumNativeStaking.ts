import { StakeProviderInfo } from '../../types'
import { CoreumNativeStakeKitAdapterConfig } from '../policyAdapters/CoreumStakeKitAdaptor'
import { StakePluginInfo, StakePolicyConfig } from '../types'

const stakeProviderInfo: StakeProviderInfo = {
  displayName: 'Coreum Native Staking',
  pluginId: 'coreum',
  stakeProviderId: 'coreum_native'
}

const adaptors: CoreumNativeStakeKitAdapterConfig[] = [
  {
    type: 'coreum-native-stake-kit',
    integrationId: 'coreum-core-native-staking',
    preferredValidatorAddress: 'corevaloper1k0rllvenwr02gvm52fh5056g5m3hly2lpf63z5', // StakeLab
    preferredValidatorName: 'StakeLab'
  },

  {
    type: 'coreum-native-stake-kit',
    integrationId: 'coreum-core-native-staking',
    preferredValidatorAddress: 'corevaloper1puge9crcxvq02jguql4vp2dhglvjll3wzdcggq', // Bware Labs
    preferredValidatorName: 'Bware Labs'
  }
]

const coreumPolicyConfig: Array<StakePolicyConfig<CoreumNativeStakeKitAdapterConfig>> = adaptors.map(adapterConfig => {
  return {
    stakePolicyId: `coreum_native_${adapterConfig.preferredValidatorAddress}`,
    stakeProviderInfo: {
      ...stakeProviderInfo,
      displayName: `Coreum Native Staking - ${adapterConfig.preferredValidatorName}`
    },
    parentPluginId: 'coreum',
    parentCurrencyCode: 'COREUM',
    hideUnstakeAction: true,
    adapterConfig,
    stakeAssets: [{ pluginId: 'coreum', currencyCode: 'COREUM' }],
    rewardAssets: [{ pluginId: 'coreum', currencyCode: 'COREUM' }]
  }
})

export const coreumnative: StakePluginInfo = {
  pluginId: 'stake:coreum:native',
  policyConfigs: [...coreumPolicyConfig]
}
