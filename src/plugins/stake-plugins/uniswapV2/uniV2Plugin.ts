import { infoServerData } from '../../../util/network'
import { ChangeQuote, ChangeQuoteRequest, StakePlugin, StakePolicy, StakePolicyFilter, StakePosition, StakePositionRequest } from '../types'
import { asInfoServerResponse } from '../util/internalTypes'
import { pluginInfo } from './pluginInfo'
import { StakePolicyInfo, toStakePolicy } from './stakePolicy'

export const makeUniV2StakePlugin = async (pluginId: string): Promise<StakePlugin | undefined> => {
  if (!pluginInfo.policyInfo.some(info => info.parentPluginId === pluginId)) {
    return
  }
  const infoServerResponse = asInfoServerResponse(infoServerData.rollup?.apyValues ?? { policies: {} })

  const instance: StakePlugin = {
    getPolicies(filter?: StakePolicyFilter): StakePolicy[] {
      let out: StakePolicyInfo[] = [...pluginInfo.policyInfo]
      const { currencyCode, wallet } = filter ?? {}

      if (wallet != null) {
        out = out.filter(policy => [...policy.rewardAssets, ...policy.stakeAssets].some(asset => asset.pluginId === wallet.currencyInfo.pluginId))
      }
      if (currencyCode != null) {
        out = out.filter(policy => [...policy.rewardAssets, ...policy.stakeAssets].some(asset => asset.currencyCode === currencyCode))

        // Filter duplicate contracts
        const poolSet = new Set<string>()
        out = out.filter(info => {
          const { poolAddress } = info ?? {}
          if (poolAddress == null) return true
          if (!poolSet.has(poolAddress)) {
            poolSet.add(poolAddress)
            return true
          }
          return false
        })
      }

      const policies = out.map(toStakePolicy(infoServerResponse))
      return policies
    },
    async fetchChangeQuote(request: ChangeQuoteRequest): Promise<ChangeQuote> {
      const { stakePolicyId } = request

      const policyInfo = pluginInfo.policyInfo.find(p => p.stakePolicyId === stakePolicyId)
      if (policyInfo == null) throw new Error(`Stake policy '${stakePolicyId}' not found`)

      return await policyInfo.policy.fetchChangeQuote(request)
    },
    async fetchStakePosition(request: StakePositionRequest): Promise<StakePosition> {
      const { stakePolicyId } = request

      const policyInfo = pluginInfo.policyInfo.find(p => p.stakePolicyId === stakePolicyId)
      if (policyInfo == null) throw new Error(`Stake policy '${stakePolicyId}' not found`)

      return await policyInfo.policy.fetchStakePosition(request)
    }
  }
  return instance
}
