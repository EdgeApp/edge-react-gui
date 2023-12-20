import { ChangeQuote, ChangeQuoteRequest, StakePlugin, StakePluginFactory, StakePolicy, StakePolicyFilter, StakePosition, StakePositionRequest } from '../types'
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
        const { currencyCode, wallet } = filter ?? {}
        let filteredPolicies: StakePolicy[] = policies

        if (wallet != null) {
          filteredPolicies = filteredPolicies.filter(policy =>
            [...policy.rewardAssets, ...policy.stakeAssets].some(asset => asset.pluginId === wallet.currencyInfo.pluginId)
          )
        }
        if (currencyCode != null) {
          filteredPolicies = filteredPolicies.filter(policy =>
            [...policy.rewardAssets, ...policy.stakeAssets].some(asset => asset.currencyCode === currencyCode)
          )
        }

        return filteredPolicies
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

function isPolicyInfoForGlifInfinityPool(policyInfo: StakePolicyConfig<StakeAdapterConfig>): policyInfo is StakePolicyConfig<GlifInfinityPoolAdapterConfig> {
  return policyInfo.adapterConfig.type === 'glif-infinity-pool'
}
function isPolicyInfoForTarotPool(policyInfo: StakePolicyConfig<StakeAdapterConfig>): policyInfo is StakePolicyConfig<TarotPoolAdapterConfig> {
  return policyInfo.adapterConfig.type === 'tarot-velodrome-pool'
}

const makePolicyAdapter = (policyInfo: StakePolicyConfig<StakeAdapterConfig>): StakePolicyAdapter => {
  if (isPolicyInfoForGlifInfinityPool(policyInfo)) {
    return makeGlifInfinityPoolAdapter(policyInfo)
  } else if (isPolicyInfoForTarotPool(policyInfo)) {
    return makeTarotPoolAdapter(policyInfo)
  } else {
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
