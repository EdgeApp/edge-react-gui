// @flow
import type { EdgeCorePluginOptions } from 'edge-core-js'

import { pluginInfo } from './pluginInfo.js'
import { toStakePolicy } from './stakePolicy.js'
import type { ChangeQuote, ChangeQuoteRequest, StakeDetailRequest, StakeDetails, StakePlugin, StakePolicy } from './types.js'

export * from './types.js'

export const makeStakePlugin = (opts?: EdgeCorePluginOptions): StakePlugin => {
  const instance: StakePlugin = {
    async getStakePolicies(): Promise<StakePolicy[]> {
      // TODO: Calculate APY form reading the blockchain
      const policies = pluginInfo.policyInfo.map(toStakePolicy)
      return policies
    },
    async fetchChangeQuote(request: ChangeQuoteRequest): Promise<ChangeQuote> {
      const approve: () => Promise<void> = async () => {}

      return {
        allocations: [
          {
            allocationType: 'stake',
            tokenId: 'TSHARE',
            nativeAmount: '1000'
          },
          {
            allocationType: 'fee',
            tokenId: 'FTM',
            nativeAmount: '0.01'
          }
        ],
        approve
      }
    },
    async fetchStakeDetails(request: StakeDetailRequest): Promise<StakeDetails> {
      return {
        allocations: []
      }
    }
  }
  return instance
}
