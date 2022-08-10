// @flow
import { type StakePluginPolicy } from './policies/types'
import { type AssetId, type InfoServerResponse, type StakeProviderInfo } from './types'
import type { StakePolicy } from './types.js'

export type StakePolicyInfo = {|
  stakePolicyId: string,
  stakeProviderInfo?: StakeProviderInfo,
  parentPluginId: string,
  parentCurrencyCode: string,
  policy: StakePluginPolicy,
  stakeAssets: AssetId[],
  rewardAssets: AssetId[]
|}

export const toStakePolicy =
  (infoResponse: InfoServerResponse) =>
  (policyInfo: StakePolicyInfo): StakePolicy => {
    const { stakeProviderInfo, stakeAssets, rewardAssets } = policyInfo
    const stakePolicyId = policyInfo.stakePolicyId
    const apy = infoResponse.policies[stakePolicyId]

    return {
      stakePolicyId,
      stakeProviderInfo,
      apy,
      stakeAssets,
      rewardAssets
    }
  }
