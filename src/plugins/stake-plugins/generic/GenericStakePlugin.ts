import {
  ChangeQuote,
  ChangeQuoteRequest,
  filterStakePolicies,
  StakePlugin,
  StakePluginFactory,
  StakePolicy,
  StakePolicyFilter,
  StakePosition,
  StakePositionRequest
} from '../types'
import { CardanoPooledKilnAdapterConfig, makeCardanoKilnAdapter } from './policyAdapters/CardanoKilnAdaptor'
import { CoreumNativeSkateKitAdapterConfig, makeSkateKitAdapter } from './policyAdapters/CoreumStakeKitAdaptor'
import { EthereumPooledKilnAdapterConfig, makeEthereumKilnAdapter } from './policyAdapters/EthereumKilnAdaptor'
import { GlifInfinityPoolAdapterConfig, makeGlifInfinityPoolAdapter } from './policyAdapters/GlifInfinityPoolAdapter'
import { makeTarotPoolAdapter, TarotPoolAdapterConfig } from './policyAdapters/TarotPoolAdaptor'
import { StakeAdapterConfig, StakePolicyAdapter } from './policyAdapters/types'
import { StakePluginInfo, StakePolicyConfig } from './types'

export const makeGenericStakePlugin =
  (pluginInfo: StakePluginInfo): StakePluginFactory =>
  async _opts => {
    const policyAdapters: StakePolicyAdapter[] = []
    const policyPromises: Array<Promise<StakePolicy>> = []
    for (const config of pluginInfo.policyConfigs) {
      const policyAdapter = makePolicyAdapter(config)
      const policyPromise = makeStakePolicy(config, policyAdapter)
      policyAdapters.push(policyAdapter)
      policyPromises.push(policyPromise)
    }
    const policies = await Promise.all(policyPromises)

    const instance: StakePlugin = {
      getPolicies(filter?: StakePolicyFilter): StakePolicy[] {
        return filterStakePolicies(policies, filter)
      },

      async fetchChangeQuote(request: ChangeQuoteRequest): Promise<ChangeQuote> {
        const policyAdapter = policyAdapters.find(p => p.stakePolicyId === request.stakePolicyId)
        if (policyAdapter == null) throw new Error(`Stake policy adapter '${request.stakePolicyId}' not found`)

        const policy = policies.find(policy => policy.stakePolicyId === request.stakePolicyId)
        if (policy == null) throw new Error(`Policy '${request.stakePolicyId}' not found`)

        const requestAsset = [...policy.stakeAssets, ...policy.rewardAssets].find(asset => asset.currencyCode === request.currencyCode)
        if (requestAsset == null) throw new Error(`Asset '${request.currencyCode}' not found in policy '${policy.stakePolicyId}'`)

        switch (request.action) {
          case 'claim':
            return await policyAdapter.fetchClaimQuote(request.wallet, requestAsset, request.nativeAmount)
          case 'stake':
            return await policyAdapter.fetchStakeQuote(request.wallet, requestAsset, request.nativeAmount)
          case 'unstake':
            return await policyAdapter.fetchUnstakeQuote(request.wallet, requestAsset, request.nativeAmount)
          case 'unstakeExact':
            return await policyAdapter.fetchUnstakeExactQuote(request.wallet, requestAsset, request.nativeAmount)
        }
      },
      async fetchStakePosition(request: StakePositionRequest): Promise<StakePosition> {
        const policyAdapter = policyAdapters.find(p => p.stakePolicyId === request.stakePolicyId)
        if (policyAdapter == null) throw new Error(`Stake policy adapter '${request.stakePolicyId}' not found`)

        return await policyAdapter.fetchStakePosition(request.wallet)
      }
    }
    return instance
  }

const makePolicyAdapter = (policyInfo: StakePolicyConfig<StakeAdapterConfig>): StakePolicyAdapter => {
  switch (policyInfo.adapterConfig.type) {
    case 'cardano-pooled-kiln':
      return makeCardanoKilnAdapter(policyInfo as StakePolicyConfig<CardanoPooledKilnAdapterConfig>)
    case 'coreum-native-stake-kit':
      return makeSkateKitAdapter(policyInfo as StakePolicyConfig<CoreumNativeSkateKitAdapterConfig>)
    case 'ethereum-pooled-kiln':
      return makeEthereumKilnAdapter(policyInfo as StakePolicyConfig<EthereumPooledKilnAdapterConfig>)
    case 'glif-infinity-pool':
      return makeGlifInfinityPoolAdapter(policyInfo as StakePolicyConfig<GlifInfinityPoolAdapterConfig>)
    case 'tarot-velodrome-pool':
      return makeTarotPoolAdapter(policyInfo as StakePolicyConfig<TarotPoolAdapterConfig>)
    default:
      throw new Error('Unknown policyInfo')
  }
}

const makeStakePolicy = async (policyConfig: StakePolicyConfig<StakeAdapterConfig>, policyAdapter: StakePolicyAdapter): Promise<StakePolicy> => {
  const {
    disableMaxStake = false,
    hideClaimAction = false,
    hideUnstakeAction = false,
    hideUnstakeAndClaimAction = false,
    isStablePool,
    isLiquidStaking,
    stakeProviderInfo,
    stakeAssets,
    rewardAssets,
    deprecated = false,
    claimWarning = null,
    stakeWarning = null,
    unstakeWarning = null,
    mustMaxUnstake = false
  } = policyConfig
  const stakePolicyId = policyConfig.stakePolicyId
  const defaultYieldType = isStablePool != null ? (isStablePool ? 'stable' : 'variable') : undefined
  const { apy, yieldType = defaultYieldType } = await policyAdapter.fetchYieldInfo()

  return {
    stakePolicyId,
    stakeProviderInfo,
    apy,
    disableMaxStake,
    hideClaimAction,
    hideUnstakeAction,
    hideUnstakeAndClaimAction,
    isLiquidStaking,
    yieldType,
    stakeAssets,
    rewardAssets,
    mustMaxUnstake,
    deprecated,
    claimWarning,
    stakeWarning,
    unstakeWarning
  }
}
