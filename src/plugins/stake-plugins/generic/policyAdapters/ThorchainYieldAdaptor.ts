import { gt } from 'biggystring'
import { asObject, asString } from 'cleaners'
import { EdgeCurrencyWallet } from 'edge-core-js'

import { StringMap } from '../../../../types/types'
import { fetchWaterfall, infoServerData } from '../../../../util/network'
import { ChangeQuote, StakeAssetInfo, StakePosition } from '../../types'
import { asInfoServerResponse } from '../../util/internalTypes'
import { StakePolicyConfig } from '../types'
import { StakePolicyAdapter } from './types'

const asTcyStaker = asObject({
  address: asString,
  amount: asString
})

export interface ThorchainYieldAdapterConfig {
  type: 'thorchain-yield'
  pluginId: string

  ninerealmsClientId?: string
  thornodeServers: string[]
}

export const makeThorchainYieldAdapter = (policyConfig: StakePolicyConfig<ThorchainYieldAdapterConfig>): StakePolicyAdapter => {
  const { stakePolicyId, adapterConfig } = policyConfig
  const { thornodeServers, ninerealmsClientId } = adapterConfig
  const headers: StringMap = { 'Content-Type': 'application/json' }
  if (ninerealmsClientId != null) {
    headers['x-client-id'] = ninerealmsClientId
  }

  const instance: StakePolicyAdapter = {
    stakePolicyId,

    async fetchClaimQuote(wallet: EdgeCurrencyWallet, requestAssetId: StakeAssetInfo, nativeAmount: string): Promise<ChangeQuote> {
      throw new Error('fetchClaimQuote not implemented')
    },

    async fetchStakeQuote(wallet: EdgeCurrencyWallet, requestAssetId: StakeAssetInfo, requestNativeAmount: string): Promise<ChangeQuote> {
      throw new Error('fetchStakeQuote not implemented')
    },

    async fetchUnstakeQuote(wallet: EdgeCurrencyWallet, requestAssetId: StakeAssetInfo, requestNativeAmount: string): Promise<ChangeQuote> {
      throw new Error('fetchUnstakeQuote not implemented')
    },

    async fetchUnstakeExactQuote(wallet: EdgeCurrencyWallet, requestAssetId: StakeAssetInfo, nativeAmount: string): Promise<ChangeQuote> {
      throw new Error('fetchUnstakeExactQuote not implemented')
    },

    async fetchStakePosition(wallet: EdgeCurrencyWallet): Promise<StakePosition> {
      const addresses = await wallet.getAddresses({ tokenId: null })
      const address = addresses[0].publicAddress

      const tcyStakerResponse = await fetchWaterfall(thornodeServers, `thorchain/tcy_staker/${address}`, { headers })

      const position: StakePosition = {
        allocations: [],
        canStake: false,
        canUnstake: false,
        canUnstakeAndClaim: false,
        canClaim: false
      }

      if (!tcyStakerResponse.ok) {
        const responseText = await tcyStakerResponse.text()
        if (responseText.includes("fail to tcy staker: TCYStaker doesn't exist")) {
          return position
        }
        throw new Error(`Thorchain could not fetch /tcy_staker: ${responseText}`)
      }
      const stakerJson = await tcyStakerResponse.json()
      const staker = asTcyStaker(stakerJson)

      if (gt(staker.amount, '0')) {
        position.allocations.push({
          pluginId: 'thorchainrune',
          currencyCode: 'TCY',
          allocationType: 'staked',
          nativeAmount: staker.amount
        })
      }

      return position
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
