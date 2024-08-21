import { add, gt, lt } from 'biggystring'
import { EdgeCurrencyWallet } from 'edge-core-js'
import { BigNumber, ethers } from 'ethers'

import { infoServerData } from '../../../../util/network'
import { KilnLiquid20A__factory } from '../../../contracts'
import { AssetId, ChangeQuote, PositionAllocation, QuoteAllocation, StakePosition } from '../../types'
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
  const { apiKey, baseUrl, contractAddress, exitQueueAddress, rpcProviderUrls } = adapterConfig
  if (apiKey == null) throw new Error(`Kiln apikey is required for ${stakePolicyId}`)

  const kiln = makeKilnApi(baseUrl, apiKey)

  const provider = new ethers.providers.FallbackProvider(rpcProviderUrls.map(url => new ethers.providers.JsonRpcProvider(url)))
  const integrationContract = KilnLiquid20A__factory.connect(contractAddress, provider)

  async function prepareChangeQuote(walletSigner: EdgeWalletSigner, tx: ethers.PopulatedTransaction, allocations: QuoteAllocation[]): Promise<ChangeQuote> {
    if (tx.gasLimit == null) {
      const estimatedGasLimit = await walletSigner.estimateGas(tx)
      tx.gasLimit = estimatedGasLimit.mul(2)
    }
    const gasLimit = tx.gasLimit
    const maxFeePerGas = BigNumber.from(tx.maxFeePerGas ?? tx.gasPrice ?? 0)
    const networkFee = gasLimit.mul(maxFeePerGas)

    allocations.push({
      allocationType: 'networkFee',
      pluginId: policyConfig.parentPluginId,
      currencyCode: policyConfig.parentCurrencyCode,
      nativeAmount: networkFee.toString()
    })

    const approve = async () => {
      await walletSigner.sendTransaction(tx)
    }

    return {
      allocations,
      approve
    }
  }

  async function workflowUtils(wallet: EdgeCurrencyWallet) {
    const walletSigner = new EdgeWalletSigner(wallet, provider)
    const walletAddress = await walletSigner.getAddress()

    let txCount: number = await walletSigner.getTransactionCount('pending')
    const nextNonce = (): number => txCount++

    const feeData = await provider.getFeeData()
    const maxFeePerGas = feeData.maxFeePerGas !== null ? feeData.maxFeePerGas : undefined
    const maxPriorityFeePerGas = feeData.maxPriorityFeePerGas !== null ? feeData.maxPriorityFeePerGas : undefined

    return { maxFeePerGas, maxPriorityFeePerGas, nextNonce, walletAddress, walletSigner }
  }

  const instance: StakePolicyAdapter = {
    stakePolicyId,

    async fetchClaimQuote(wallet: EdgeCurrencyWallet, requestAssetId: AssetId, nativeAmount: string): Promise<ChangeQuote> {
      const { maxFeePerGas, maxPriorityFeePerGas, nextNonce, walletSigner, walletAddress } = await workflowUtils(wallet)
      const { currencyCode, pluginId } = wallet.currencyInfo

      const allocations: QuoteAllocation[] = []

      const operations = await kiln.getOperations(walletAddress)

      let claimableTotal = '0'
      const ticketIds: string[] = []
      const caskIds: string[] = []
      for (const operation of operations) {
        if (operation.type === 'exit' && operation.ticket_status === 'fulfillable') {
          claimableTotal = add(claimableTotal, operation.size)
          ticketIds.push(operation.ticket_id)
          // use lowest uint32 per ticket https://docs.kiln.fi/v1/kiln-products/on-chain/pooled-staking/how-to-integrate/staking-interactions/unstaking-and-withdrawals#claim-tickets-once-their-fulfillable
          const lowestCaskId = operation.cask_ids.reduce((a, b) => (lt(a, b) ? a : b))
          caskIds.push(lowestCaskId)
        }
      }

      allocations.push({
        allocationType: 'claim',
        pluginId,
        currencyCode,
        nativeAmount: claimableTotal
      })

      const tx = await integrationContract.populateTransaction.multiClaim([exitQueueAddress], [ticketIds], [caskIds], {
        gasLimit: '500000',
        maxFeePerGas,
        maxPriorityFeePerGas,
        nonce: nextNonce()
      })

      return await prepareChangeQuote(walletSigner, tx, allocations)
    },

    async fetchStakeQuote(wallet: EdgeCurrencyWallet, requestAssetId: AssetId, requestNativeAmount: string): Promise<ChangeQuote> {
      const { maxFeePerGas, maxPriorityFeePerGas, nextNonce, walletSigner } = await workflowUtils(wallet)

      const tx = await integrationContract.populateTransaction.stake({ value: requestNativeAmount, maxFeePerGas, maxPriorityFeePerGas, nonce: nextNonce() })

      const allocations: QuoteAllocation[] = [
        {
          allocationType: 'stake',
          pluginId: requestAssetId.pluginId,
          currencyCode: requestAssetId.currencyCode,
          nativeAmount: requestNativeAmount
        }
      ]

      return await prepareChangeQuote(walletSigner, tx, allocations)
    },

    async fetchUnstakeQuote(wallet: EdgeCurrencyWallet, requestAssetId: AssetId, requestNativeAmount: string): Promise<ChangeQuote> {
      const { maxFeePerGas, maxPriorityFeePerGas, nextNonce, walletSigner } = await workflowUtils(wallet)

      const tx = await integrationContract.populateTransaction.requestExit(requestNativeAmount, {
        gasLimit: '500000',
        maxFeePerGas,
        maxPriorityFeePerGas,
        nonce: nextNonce()
      })

      const allocations: QuoteAllocation[] = [
        {
          allocationType: 'unstake',
          pluginId: requestAssetId.pluginId,
          currencyCode: requestAssetId.currencyCode,
          nativeAmount: requestNativeAmount
        }
      ]

      return await prepareChangeQuote(walletSigner, tx, allocations)
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
