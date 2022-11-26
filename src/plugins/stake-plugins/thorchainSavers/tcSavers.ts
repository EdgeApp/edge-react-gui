import { EdgeCorePluginOptions } from 'edge-core-js'

import { fetchInfo } from '../../../util/network'
import { ChangeQuote, ChangeQuoteRequest, StakePlugin, StakePolicy, StakePosition, StakePositionRequest, StakeProviderInfo } from '../types'
import { asInfoServerResponse, InfoServerResponse } from '../util/internalTypes'

const stakeProviderInfo: StakeProviderInfo = {
  displayName: 'Thorchain Savers',
  pluginId: 'thorchain',
  stakeProviderId: 'tcsavers'
}

const policies: StakePolicy[] = [
  {
    stakePolicyId: 'tcsavers/bitcoin:btc=bitcoin:btc',
    stakeProviderInfo,
    apy: 0,
    rewardAssets: [{ pluginId: 'bitcoin', currencyCode: 'BTC' }],
    stakeAssets: [{ pluginId: 'bitcoin', currencyCode: 'BTC' }]
  },
  {
    stakePolicyId: 'tcsavers/litecoin:ltc=litecoin:ltc',
    stakeProviderInfo,
    apy: 0,
    rewardAssets: [{ pluginId: 'litecoin', currencyCode: 'LTC' }],
    stakeAssets: [{ pluginId: 'litecoin', currencyCode: 'LTC' }]
  },
  {
    stakePolicyId: 'tcsavers/bitcoincash:bch=bitcoincash:bch',
    stakeProviderInfo,
    apy: 0,
    rewardAssets: [{ pluginId: 'bitcoincash', currencyCode: 'BCH' }],
    stakeAssets: [{ pluginId: 'bitcoincash', currencyCode: 'BCH' }]
  },
  {
    stakePolicyId: 'tcsavers/dogecoin:doge=dogecoin:doge',
    stakeProviderInfo,
    apy: 0,
    rewardAssets: [{ pluginId: 'dogecoin', currencyCode: 'DOGE' }],
    stakeAssets: [{ pluginId: 'dogecoin', currencyCode: 'DOGE' }]
  },
  {
    stakePolicyId: 'tcsavers/ethereum:eth=ethereum:eth',
    stakeProviderInfo,
    apy: 0,
    rewardAssets: [{ pluginId: 'ethereum', currencyCode: 'ETH' }],
    stakeAssets: [{ pluginId: 'ethereum', currencyCode: 'ETH' }]
  },
  {
    stakePolicyId: 'tcsavers/avalanche:avax=avalanche:avax',
    stakeProviderInfo,
    apy: 0,
    rewardAssets: [{ pluginId: 'avalanche', currencyCode: 'AVAX' }],
    stakeAssets: [{ pluginId: 'avalanche', currencyCode: 'AVAX' }]
  }
]

export const makeTcSaversPlugin = async (opts?: EdgeCorePluginOptions): Promise<StakePlugin> => {
  const fetchResponse = await fetchInfo(`v1/apyValues`)
    .then(async res => {
      if (!res.ok) {
        throw new Error(`Fetch APY invalid response: ${await res.text()}`)
      }
      return res
    })
    .catch(err => {
      console.warn(`Fetch APY failed: ${err.message}`)
    })
  if (fetchResponse != null) {
    try {
      const fetchResponseJson = await fetchResponse.json()
      const infoServerResponse = asInfoServerResponse(fetchResponseJson)
      updatePolicyApys(infoServerResponse)
    } catch (err: any) {
      console.warn(`Parsing Fetch APY failed: ${err.message}`)
    }
  }

  const instance: StakePlugin = {
    policies,
    async fetchChangeQuote(request: ChangeQuoteRequest): Promise<ChangeQuote> {
      const { action, stakePolicyId } = request
      const policy = getPolicyFromId(stakePolicyId)

      return changeQuoteFuncs[action](request, policy)
    },
    async fetchStakePosition(request: StakePositionRequest): Promise<StakePosition> {
      const { stakePolicyId } = request
      const policy = getPolicyFromId(stakePolicyId)
      const { pluginId, currencyCode } = policy.stakeAssets[0]
      return {
        allocations: [
          {
            pluginId,
            currencyCode,
            allocationType: 'staked',
            nativeAmount: '100000000'
          },
          {
            pluginId,
            currencyCode,
            allocationType: 'earned',
            nativeAmount: '100000'
          }
        ],
        canStake: true,
        canUnstake: true,
        canClaim: true
      }
    }
  }
  return instance
}

const updatePolicyApys = (infoServerResponse: InfoServerResponse) => {
  policies.forEach(policy => {
    const apy = infoServerResponse.policies[policy.stakePolicyId]
    if (apy != null) {
      policy.apy = apy
    }
  })
}

const getPolicyFromId = (policyId: string): StakePolicy => {
  const policy = policies.find(policy => policy.stakePolicyId === policyId)
  if (policy == null) throw new Error(`Cannot find policy ${policyId}`)
  return policy
}

const stakeRequest = async (request: ChangeQuoteRequest, policy: StakePolicy): Promise<ChangeQuote> => {
  const { pluginId, currencyCode } = policy.stakeAssets[0]

  return {
    allocations: [
      {
        allocationType: 'stake',
        pluginId,
        currencyCode,
        nativeAmount: '0'
      }
    ],
    approve: async () => {}
  }
}

const unstakeRequest = async (request: ChangeQuoteRequest, policy: StakePolicy): Promise<ChangeQuote> => {
  const { pluginId, currencyCode } = policy.stakeAssets[0]

  return {
    allocations: [
      {
        allocationType: 'unstake',
        pluginId,
        currencyCode,
        nativeAmount: '0'
      }
    ],
    approve: async () => {}
  }
}

const changeQuoteFuncs = {
  stake: stakeRequest,
  unstake: unstakeRequest,
  claim: unstakeRequest
}
