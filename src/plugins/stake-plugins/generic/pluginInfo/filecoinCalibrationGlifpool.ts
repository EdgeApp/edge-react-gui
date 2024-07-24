import { StakeProviderInfo } from '../../types'
import { GlifInfinityPoolAdapterConfig } from '../policyAdapters/GlifInfinityPoolAdapter'
import { StakePluginInfo, StakePolicyConfig } from '../types'

const stakeProviderInfo: StakeProviderInfo = {
  displayName: 'GLIF (Infinity Pool)',
  pluginId: 'filecoinfevmcalibration',
  stakeProviderId: 'glif_infinity_pool'
}

const filecoinCalibrationPolicyConfig: Array<StakePolicyConfig<GlifInfinityPoolAdapterConfig>> = [
  {
    stakePolicyId: 'tfil_glif_infinity_pool_0',
    stakeProviderInfo: stakeProviderInfo,
    parentPluginId: 'filecoinfevmcalibration',
    parentCurrencyCode: 'tFIL',
    adapterConfig: {
      type: 'glif-infinity-pool',
      rpcProviderUrls: [`https://api.calibration.node.glif.io/rpc/v0`],
      poolContractAddress: '0x37621D9a49FFE8f13BF2Adcb87f1b115D82ac378', // Pool 0
      simpleRampContractAddress: '0xbf3dE3D08A8C93fFB87A02E3Cb9758746450246e'
    },
    disableMaxStake: true,
    hideClaimAction: true,
    hideUnstakeAndClaimAction: true,
    stakeAssets: [{ pluginId: 'filecoinfevmcalibration', currencyCode: 'tFIL' }],
    rewardAssets: [{ pluginId: 'filecoinfevmcalibration', currencyCode: 'tFIL' }]
  }
]

export const glifpoolCalibration: StakePluginInfo = {
  pluginId: 'stake:filecoincalibration:glifpool',
  policyConfigs: [...filecoinCalibrationPolicyConfig]
}
