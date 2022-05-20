// @flow

import { type Cleaner, asNumber, asObject, asString } from 'cleaners'
import type { EdgeCorePluginOptions } from 'edge-core-js'

import { pluginInfo } from './pluginInfo.js'
import { toStakePolicy } from './stakePolicy.js'
import { type InfoServerResponse } from './types'
import type { ChangeQuote, ChangeQuoteRequest, StakePlugin, StakePolicy, StakePosition, StakePositionRequest } from './types.js'

export * from './types.js'

const infoServerUri = 'https://info1.edge.app'

export const makeStakePlugin = (opts?: EdgeCorePluginOptions): StakePlugin => {
  const instance: StakePlugin = {
    async getStakePolicies(): Promise<StakePolicy[]> {
      const fetchResponse = await fetch(`${infoServerUri}/v1/apyValues`)
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

// -----------------------------------------------------------------------------
// Cleaners
// -----------------------------------------------------------------------------
const asInfoServerResponse: Cleaner<InfoServerResponse> = asObject({
  _id: asString,
  _rev: asString,
  policies: asObject(asNumber)
})
