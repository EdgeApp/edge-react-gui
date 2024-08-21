import { add, gt } from 'biggystring'
import { EdgeCurrencyWallet } from 'edge-core-js'
import { ethers } from 'ethers'

import { infoServerData } from '../../../../util/network'
import { AssetId, ChangeQuote, PositionAllocation, StakePosition } from '../../types'
import { asInfoServerResponse } from '../../util/internalTypes'
import { StakePolicyConfig } from '../types'
import { EdgeWalletSigner } from '../util/EdgeWalletSigner'
import { makeKilnApi } from '../util/kilnUtils'
import { StakePolicyAdapter } from './types'

export interface EthereumPooledKilnAdapterConfig {
  type: 'ethereum-pooled-kiln'
  pluginId: string

  apiKey: string | null
  baseUrl: string
  contractAddress: string
  exitQueueAddress: string
  rpcProviderUrls: string[]
}

export const makeKilnAdapter = (policyConfig: StakePolicyConfig<EthereumPooledKilnAdapterConfig>): StakePolicyAdapter => {
  const { stakePolicyId, adapterConfig } = policyConfig
  const { apiKey, baseUrl, contractAddress, rpcProviderUrls } = adapterConfig
  if (apiKey == null) throw new Error(`Kiln apikey is required for ${stakePolicyId}`)

  const kiln = makeKilnApi(baseUrl, apiKey)

  const provider = new ethers.providers.FallbackProvider(rpcProviderUrls.map(url => new ethers.providers.JsonRpcProvider(url)))

  async function workflowUtils(wallet: EdgeCurrencyWallet) {
    const walletSigner = new EdgeWalletSigner(wallet, provider)
    const walletAddress = await walletSigner.getAddress()

    return { walletAddress }
  }

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
      const { walletAddress } = await workflowUtils(wallet)
      const { currencyCode, pluginId } = wallet.currencyInfo

      const balance = wallet.balanceMap.get(null) ?? '0'
      let canUnstake = false
      let canClaim = false
      const allocations: PositionAllocation[] = []

      const allPositions = await kiln.getStakes(walletAddress)
      const position = allPositions.find(position => position.integration_address === contractAddress)

      const nativeStakedAmount = position?.balance ?? '0'
      if (gt(nativeStakedAmount, '0')) {
        canUnstake = true
      }
      allocations.push({
        allocationType: 'staked',
        pluginId,
        currencyCode,
        nativeAmount: nativeStakedAmount
      })

      allocations.push({
        allocationType: 'earned',
        pluginId,
        currencyCode,
        nativeAmount: position?.rewards ?? '0'
      })

      const operations = await kiln.getOperations(walletAddress)

      let claimableTotal = '0'
      for (const operation of operations) {
        if (operation.ticket_status === 'fulfillable') {
          claimableTotal = add(claimableTotal, operation.size)
        } else {
          const operationDate = new Date(operation.time)
          operationDate.setDate(operationDate.getDate() + 7)
          allocations.push({
            allocationType: 'unstaked',
            pluginId,
            currencyCode,
            nativeAmount: operation.size,
            locktime: operationDate
          })
        }
      }

      if (claimableTotal !== '0') {
        allocations.push({
          allocationType: 'unstaked',
          pluginId,
          currencyCode,
          nativeAmount: claimableTotal
        })
        canClaim = true
      }

      return {
        allocations,
        canStake: gt(balance, '0'),
        canUnstake,
        canUnstakeAndClaim: false,
        canClaim
      }
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
