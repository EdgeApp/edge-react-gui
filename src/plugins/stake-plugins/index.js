// @flow
import '@ethersproject/shims'

import type { EdgeCorePluginOptions } from 'edge-core-js'

import { pluginInfo } from './pluginInfo.js'
import { toStakePolicy } from './stakePolicy.js'
import type { ChangeQuote, ChangeQuoteRequest, StakePlugin, StakePolicy, StakePosition, StakePositionRequest } from './types.js'

export * from './types.js'

export const makeStakePlugin = (opts?: EdgeCorePluginOptions): StakePlugin => {
  const instance: StakePlugin = {
    async getStakePolicies(): Promise<StakePolicy[]> {
      // TODO: Calculate APY form reading the blockchain
      const policies = pluginInfo.policyInfo.map(toStakePolicy)
      return policies
    },
    async fetchChangeQuote(request: ChangeQuoteRequest): Promise<ChangeQuote> {
      const { stakePolicyId } = request

      const policyInfo = pluginInfo.policyInfo.find(p => p.stakePolicyId === stakePolicyId)
      if (policyInfo == null) throw new Error(`Stake policy '${stakePolicyId}' not found`)

      return await policyInfo.policy.fetchChangeQuote(request)
    },
    // TODO: Implement support for multi-asset staking
    async fetchStakePosition(request: StakePositionRequest): Promise<StakePosition> {
      const { stakePolicyId } = request

      const policyInfo = pluginInfo.policyInfo.find(p => p.stakePolicyId === stakePolicyId)
      if (policyInfo == null) throw new Error(`Stake policy '${stakePolicyId}' not found`)

      return await policyInfo.policy.fetchStakePosition(request)
    }
  }
  return instance
}
