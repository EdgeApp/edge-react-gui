import { StakeProviderInfo } from '../../types'
import { StakePluginInfo, StakePolicyConfig } from '../types'

interface CoreumNativeSkateKitAdapterConfig {
  type: string
  integrationId: string
  preferredValidatorAddress: string
  preferredValidatorName: string
}

const stakeProviderInfo: StakeProviderInfo = {
  displayName: 'Coreum Native Staking',
  pluginId: 'coreum',
  stakeProviderId: 'coreum_native'
}

const commonAdaptorConfig = {
  type: 'coreum-native-stake-kit',
  integrationId: 'coreum-core-native-staking'
}

const adaptors: CoreumNativeSkateKitAdapterConfig[] = [
  {
    ...commonAdaptorConfig,
    preferredValidatorAddress: 'corevaloper1k0rllvenwr02gvm52fh5056g5m3hly2lpf63z5', // StakeLab
    preferredValidatorName: 'StakeLab'
  },

  {
    ...commonAdaptorConfig,
    preferredValidatorAddress: 'corevaloper1puge9crcxvq02jguql4vp2dhglvjll3wzdcggq', // Bware Labs
    preferredValidatorName: 'Bware Labs'
  }
]

const makePolicyConfig = (adapterConfig: CoreumNativeSkateKitAdapterConfig) => {
  return {
    stakePolicyId: `coreum_native_${adapterConfig.preferredValidatorAddress}`,
    stakeProviderInfo: { ...stakeProviderInfo, displayName: `Coreum Native Staking - ${adapterConfig.preferredValidatorName}` },
    parentPluginId: 'coreum',
    parentCurrencyCode: 'COREUM',
    hideUnstakeAction: true,
    adapterConfig,
    stakeAssets: [{ pluginId: 'coreum', currencyCode: 'COREUM' }],
    rewardAssets: [{ pluginId: 'coreum', currencyCode: 'COREUM' }]
  }
}

const coreumPolicyConfig: Array<StakePolicyConfig<any>> = adaptors.map(adaptor => makePolicyConfig(adaptor))

export const coreumnative: StakePluginInfo = {
  pluginId: 'stake:coreum:native',
  policyConfigs: [...coreumPolicyConfig]
}
