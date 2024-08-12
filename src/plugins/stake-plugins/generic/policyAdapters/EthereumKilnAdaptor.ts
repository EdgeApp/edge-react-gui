import { EdgeCurrencyWallet } from 'edge-core-js'

import { infoServerData } from '../../../../util/network'
import { AssetId, ChangeQuote, StakePosition } from '../../types'
import { asInfoServerResponse } from '../../util/internalTypes'
import { StakePolicyConfig } from '../types'
import { StakePolicyAdapter } from './types'

export interface EthereumPooledKilnAdapterConfig {
  type: 'ethereum-pooled-kiln'
  pluginId: string

  baseUrl: string
  contractAddress: string
  exitQueueAddress: string
  rpcProviderUrls: string[]
}

export const makeKilnAdapter = (policyConfig: StakePolicyConfig<EthereumPooledKilnAdapterConfig>): StakePolicyAdapter => {
  const { stakePolicyId } = policyConfig

  const instance: StakePolicyAdapter = {
    stakePolicyId,

    async fetchClaimQuote(wallet: EdgeCurrencyWallet, requestAssetId: AssetId, nativeAmount: string): Promise<ChangeQuote> {
      throw new Error('fetchClaimQuote not implemented')
    },

    async fetchStakeQuote(wallet: EdgeCurrencyWallet, requestAssetId: AssetId, requestNativeAmount: string): Promise<ChangeQuote> {
      throw new Error('fetchStakeQuote not implemented')
    },

    async fetchUnstakeQuote(wallet: EdgeCurrencyWallet, requestAssetId: AssetId, requestNativeAmount: string): Promise<ChangeQuote> {
      throw new Error('fetchUnstakeQuote not implemented')
    },

    async fetchUnstakeExactQuote(wallet: EdgeCurrencyWallet, requestAssetId: AssetId, nativeAmount: string): Promise<ChangeQuote> {
      throw new Error('fetchUnstakeExactQuote not implemented')
    },

    async fetchStakePosition(wallet: EdgeCurrencyWallet): Promise<StakePosition> {
      throw new Error('fetchStakePosition not implemented')
    },

    async fetchYieldInfo() {
      const infoServerResponse = asInfoServerResponse(infoServerData.rollup?.apyValues ?? { policies: {} })
      const apy = infoServerResponse.policies[stakePolicyId] ?? 0

      return {
        apy,
        yieldType: 'variable'
      }
    }
  }

  return instance
}
