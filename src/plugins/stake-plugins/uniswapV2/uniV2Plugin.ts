import { EdgeCorePluginOptions } from 'edge-core-js'

import { fetchInfo } from '../../../util/network'
import { ChangeQuote, ChangeQuoteRequest, StakePlugin, StakePosition, StakePositionRequest } from '../types'
import { asInfoServerResponse } from '../util/internalTypes'
import { pluginInfo } from './pluginInfo'
import { toStakePolicy } from './stakePolicy'

export const makeUniV2StakePlugin = async (opts?: EdgeCorePluginOptions): Promise<StakePlugin> => {
  const fetchResponse = await fetchInfo(`v1/apyValues`)
    .then(async res => {
      if (!res.ok) {
        throw new Error(`Fetch APY invalid response: ${await res.text()}`)
      }
      return res
    })
    .catch(err => {
      throw new Error(`Fetch APY failed: ${err.message}`)
    })
  const fetchResponseJson = await fetchResponse.json()
  const infoServerResponse = asInfoServerResponse(fetchResponseJson)

  const policies = pluginInfo.policyInfo.map(toStakePolicy(infoServerResponse))

  const instance: StakePlugin = {
    policies,
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
