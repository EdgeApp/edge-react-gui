import { add, eq, gt, lt } from 'biggystring'
import { EdgeCurrencyWallet } from 'edge-core-js'
import { BigNumber, ethers } from 'ethers'

import { infoServerData } from '../../../../util/network'
import { KilnLiquid20A__factory } from '../../../contracts'
import { ChangeQuote, PositionAllocation, QuoteAllocation, StakeAssetInfo, StakePosition } from '../../types'
import { asInfoServerResponse } from '../../util/internalTypes'
import { StakePolicyConfig } from '../types'
import { EdgeWalletSigner } from '../util/EdgeWalletSigner'
import { makeKilnApi } from '../util/KilnApi'
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

export const makeEthereumKilnAdapter = (policyConfig: StakePolicyConfig<EthereumPooledKilnAdapterConfig>): StakePolicyAdapter => {
  const { stakePolicyId, adapterConfig } = policyConfig
  const { apiKey, baseUrl, contractAddress, exitQueueAddress, rpcProviderUrls } = adapterConfig

  if (apiKey == null) throw new Error(`Kiln apiKey is required for ${stakePolicyId}`)

  const kiln = makeKilnApi(baseUrl, apiKey)

  const provider = new ethers.providers.FallbackProvider(rpcProviderUrls.map(url => new ethers.providers.JsonRpcProvider(url)))
  const integrationContract = KilnLiquid20A__factory.connect(contractAddress, provider)

  // Metadata constants:
  const metadataName = 'Kiln Pooled Staking'
  const stakeAsset = policyConfig.stakeAssets[0]
  const metadataPoolAssetName = stakeAsset.currencyCode

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

    let txCount: number | undefined
    const nextNonce = async (): Promise<number> => {
      if (txCount == null) {
        txCount = await walletSigner.getTransactionCount('pending')
      }
      return txCount++
    }

    const feeData = await provider.getFeeData()
    const maxFeePerGas = feeData.maxFeePerGas !== null ? feeData.maxFeePerGas : undefined
    const maxPriorityFeePerGas = feeData.maxPriorityFeePerGas !== null ? feeData.maxPriorityFeePerGas : undefined

    return { maxFeePerGas, maxPriorityFeePerGas, nextNonce, walletAddress, walletSigner }
  }

  const instance: StakePolicyAdapter = {
    stakePolicyId,

    async fetchClaimQuote(wallet: EdgeCurrencyWallet, requestAssetId: StakeAssetInfo, nativeAmount: string): Promise<ChangeQuote> {
      const { maxFeePerGas, maxPriorityFeePerGas, nextNonce, walletSigner, walletAddress } = await workflowUtils(wallet)
      const { currencyCode, pluginId } = wallet.currencyInfo

      const allocations: QuoteAllocation[] = []

      const operations = await kiln.ethGetOnChainOperations(walletAddress)

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
        nonce: await nextNonce(),
        customData: {
          metadata: {
            name: metadataName,
            category: 'Income:Claim',
            notes: `Claim ${metadataPoolAssetName} rewards`
          }
        }
      })

      return await prepareChangeQuote(walletSigner, tx, allocations)
    },

    async fetchStakeQuote(wallet: EdgeCurrencyWallet, requestAssetId: StakeAssetInfo, requestNativeAmount: string): Promise<ChangeQuote> {
      const { maxFeePerGas, maxPriorityFeePerGas, nextNonce, walletSigner } = await workflowUtils(wallet)

      const tx = await integrationContract.populateTransaction.stake({
        gasLimit: '250000', // Typically uses 190000-225000 gas
        maxFeePerGas,
        maxPriorityFeePerGas,
        nonce: await nextNonce(),
        value: requestNativeAmount,
        customData: {
          metadata: {
            name: metadataName,
            category: 'Transfer:Staking',
            notes: `Stake ${metadataPoolAssetName}`
          }
        }
      })

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

    async fetchUnstakeQuote(wallet: EdgeCurrencyWallet, requestAssetId: StakeAssetInfo, requestNativeAmount: string): Promise<ChangeQuote> {
      const { maxFeePerGas, maxPriorityFeePerGas, nextNonce, walletSigner } = await workflowUtils(wallet)

      const tx = await integrationContract.populateTransaction.requestExit(requestNativeAmount, {
        gasLimit: '500000',
        maxFeePerGas,
        maxPriorityFeePerGas,
        nonce: await nextNonce(),
        customData: {
          metadata: {
            name: metadataName,
            category: 'Transfer:Unstaking',
            notes: `Unstake ${metadataPoolAssetName}`
          }
        }
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

    async fetchUnstakeExactQuote(wallet: EdgeCurrencyWallet, requestAssetId: StakeAssetInfo, nativeAmount: string): Promise<ChangeQuote> {
      throw new Error('fetchUnstakeExactQuote not implemented')
    },

    async fetchStakePosition(wallet: EdgeCurrencyWallet): Promise<StakePosition> {
      const { walletAddress } = await workflowUtils(wallet)
      const { currencyCode, pluginId } = wallet.currencyInfo

      const balance = wallet.balanceMap.get(null) ?? '0'
      let canClaim = false
      const allocations: PositionAllocation[] = []

      const allPositions = await kiln.ethGetOnChainStakes(walletAddress)
      const position = allPositions.find(position => position.integration_address.toLowerCase() === contractAddress.toLowerCase())

      // After fully unstaking, users are left with a single wei of the liquidity token. We should ignore this.
      const positionBalance = position?.balance ?? '0'
      const nativeStakedAmount = eq(positionBalance, '1') ? '0' : positionBalance

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

      const operations = await kiln.ethGetOnChainOperations(walletAddress)

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
        canUnstake: gt(nativeStakedAmount, '1'),
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
