// @flow
import '@ethersproject/shims'

import { type Cleaner, asNumber, asObject, asString } from 'cleaners'
import type { EdgeCorePluginOptions } from 'edge-core-js'

import { showError } from '../../components/services/AirshipInstance.js'
import { pluginInfo } from './pluginInfo.js'
import { toStakePolicy } from './stakePolicy.js'
import { type InfoServerResponse } from './types'
import type { ChangeQuote, ChangeQuoteRequest, StakePlugin, StakePolicy, StakePosition, StakePositionRequest } from './types.js'

export * from './types.js'

export const makeStakePlugin = (opts?: EdgeCorePluginOptions): StakePlugin => {
  const instance: StakePlugin = {
    async getStakePolicies(): Promise<StakePolicy[]> {
      let fetchResponseJson: any
      let infoServerResponse
      const apyUri = 'https://info1.edgesecure.co:8444/v1/apyValues'
      try {
        const fetchResponse = await fetch(apyUri)
        if (!fetchResponse.ok) {
          const rawText = await fetchResponse.text()
          showError(`Fetch APY invalid response: ${rawText}`)
        } else {
          try {
            fetchResponseJson = await fetchResponse.json()
            infoServerResponse = asInfoServerResponse(fetchResponseJson)
          } catch (e) {
            showError(`Invalid APY response (${e.message}): ${JSON.stringify(fetchResponse)}`)
          }
        }
      } catch (e) {
        showError(`Fetch APY failed: ${e.message}`)
      }

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
