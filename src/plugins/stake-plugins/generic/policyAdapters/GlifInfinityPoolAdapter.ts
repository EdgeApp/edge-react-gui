import '@ethersproject/shims'

import { gt } from 'biggystring'
import { EdgeCurrencyWallet } from 'edge-core-js'
import { BigNumber, ethers } from 'ethers'

import { infoServerData } from '../../../../util/network'
import { GlifInfinityPool__factory, GlifPoolToken__factory, GlifSimpleRamp__factory } from '../../../contracts'
import { ChangeQuote, PositionAllocation, QuoteAllocation, StakePosition } from '../../types'
import { asInfoServerResponse } from '../../util/internalTypes'
import { StakePolicyConfig } from '../types'
import { EdgeWalletSigner } from '../util/EdgeWalletSigner'
import { StakePolicyAdapter } from './types'

export interface GlifInfinityPoolAdapterConfig {
  type: 'glif-infinity-pool'
  rpcProviderUrls: string[]
  poolContractAddress: string
  simpleRampContractAddress: string
}

export const makeGlifInfinityPoolAdapter = (policyConfig: StakePolicyConfig<GlifInfinityPoolAdapterConfig>): StakePolicyAdapter => {
  if (policyConfig.stakeAssets.length > 1) throw new Error(`Staking more than one assets is not supported for GlifInfinityPoolAdapter`)
  if (policyConfig.rewardAssets.length > 1) throw new Error(`Claim of more than one assets is not supported for GlifInfinityPoolAdapter`)

  if (policyConfig.stakeAssets[0].currencyCode !== policyConfig.rewardAssets[0].currencyCode)
    throw new Error(`Stake and claim of different assets is not supported for GlifInfinityPoolAdapter`)

  // Metadata constants:
  const metadataName = 'GLIF Infinity Pool'
  const stakeAsset = policyConfig.stakeAssets[0]
  const metadataPoolAssetName = `${stakeAsset.currencyCode}`

  const { adapterConfig, stakePolicyId } = policyConfig
  const { rpcProviderUrls } = adapterConfig
  const provider = new ethers.providers.FallbackProvider(rpcProviderUrls.map(url => new ethers.providers.JsonRpcProvider(url)))

  // Declare contracts:
  const { poolContractAddress, simpleRampContractAddress } = adapterConfig
  const poolContract = GlifInfinityPool__factory.connect(poolContractAddress, provider)
  const simpleRampContract = GlifSimpleRamp__factory.connect(simpleRampContractAddress, provider)

  async function prepareChangeQuote(walletSigner: EdgeWalletSigner, txs: ethers.PopulatedTransaction[], allocations: QuoteAllocation[]): Promise<ChangeQuote> {
    let networkFee = BigNumber.from(0)

    for (const tx of txs) {
      if (tx.gasLimit == null) {
        const estimatedGasLimit = await walletSigner.estimateGas(tx)
        tx.gasLimit = estimatedGasLimit.mul(2) // Estimation sucks on Filecoin FEVM
      }
      const gasLimit = tx.gasLimit
      const maxFeePerGas = BigNumber.from(tx.maxFeePerGas ?? tx.gasPrice ?? 0)
      networkFee = networkFee.add(gasLimit.mul(maxFeePerGas))
    }

    allocations.push({
      allocationType: 'networkFee',
      pluginId: policyConfig.parentPluginId,
      currencyCode: policyConfig.parentCurrencyCode,
      nativeAmount: networkFee.toString()
    })

    const approve = async () => {
      for (const tx of txs) {
        await walletSigner.sendTransaction(tx)
      }
    }

    return {
      allocations,
      approve
    }
  }

  async function workflowUtils(wallet: EdgeCurrencyWallet) {
    const txs: ethers.PopulatedTransaction[] = []

    const walletSigner = new EdgeWalletSigner(wallet, provider)
    const walletAddress = await walletSigner.getAddress()

    let txCount: number = await walletSigner.getTransactionCount('pending')
    const nextNonce = (): number => txCount++

    const feeData = await provider.getFeeData()
    const maxFeePerGas = feeData.maxFeePerGas !== null ? feeData.maxFeePerGas : undefined
    const maxPriorityFeePerGas = feeData.maxPriorityFeePerGas !== null ? feeData.maxPriorityFeePerGas : undefined

    return { maxFeePerGas, maxPriorityFeePerGas, nextNonce, txs, walletAddress, walletSigner }
  }

  const instance: StakePolicyAdapter = {
    stakePolicyId,

    async fetchClaimQuote(): Promise<ChangeQuote> {
      throw new Error('fetchClaimQuote not implemented for GlifInfinityPoolAdapter')
    },

    async fetchStakeQuote(wallet, requestAssetId, requestNativeAmount): Promise<ChangeQuote> {
      const requestAssetCurrencyCode = requestAssetId.currencyCode
      const isRequestAssetNative = requestAssetCurrencyCode === policyConfig.parentCurrencyCode

      if (!isRequestAssetNative) throw new Error('Token staking not supported')

      const { maxFeePerGas, maxPriorityFeePerGas, nextNonce, txs, walletAddress, walletSigner } = await workflowUtils(wallet)

      // Deposit into pool contract:
      txs.push(
        await poolContract.connect(walletSigner).populateTransaction['deposit(address)'](walletAddress, {
          value: requestNativeAmount,
          maxFeePerGas,
          maxPriorityFeePerGas,
          nonce: nextNonce(),
          customData: {
            name: metadataName,
            category: 'Expense:Fee',
            notes: `Stake into ${metadataPoolAssetName} pool contract`
          }
        })
      )

      // Calculate the stake asset native amounts:
      const allocations: QuoteAllocation[] = [
        {
          allocationType: 'stake',
          pluginId: requestAssetId.pluginId,
          currencyCode: requestAssetId.currencyCode,
          nativeAmount: requestNativeAmount
        }
      ]

      return await prepareChangeQuote(walletSigner, txs, allocations)
    },

    async fetchUnstakeQuote(wallet, requestAssetId, requestNativeAmount): Promise<ChangeQuote> {
      const requestAssetCurrencyCode = requestAssetId.currencyCode
      const isRequestAssetNative = requestAssetCurrencyCode === policyConfig.parentCurrencyCode

      if (!isRequestAssetNative) throw new Error('Token staking not supported')

      const poolTokenAddress = await poolContract.liquidStakingToken()
      const poolTokenContract = GlifPoolToken__factory.connect(poolTokenAddress, provider)

      const { maxFeePerGas, maxPriorityFeePerGas, nextNonce, txs, walletAddress, walletSigner } = await workflowUtils(wallet)

      // Approve token transfer
      const expectedLiquidityAmount = await simpleRampContract.previewWithdraw(requestNativeAmount)
      const allowanceResult = await poolTokenContract.allowance(walletAddress, simpleRampContract.address)
      if (allowanceResult.lt(expectedLiquidityAmount)) {
        txs.push(
          await poolTokenContract.connect(walletSigner).populateTransaction.approve(simpleRampContract.address, expectedLiquidityAmount, {
            maxFeePerGas,
            maxPriorityFeePerGas,
            nonce: nextNonce(),
            customData: {
              name: metadataName,
              category: 'Expense:Fees',
              notes: `Approve ${metadataPoolAssetName} liquidity pool contract`
            }
          })
        )
      }

      // Withdraw liquidity
      txs.push(
        await simpleRampContract.connect(walletSigner).populateTransaction.withdrawF(requestNativeAmount, walletAddress, walletAddress, BigNumber.from(0), {
          gasLimit: 250000000,
          maxFeePerGas,
          maxPriorityFeePerGas,
          nonce: nextNonce(),
          customData: {
            name: metadataName,
            category: 'Transfer:Staking',
            notes: `Remove liquidity from ${metadataPoolAssetName} pool contract`
          }
        })
      )

      // Calculate the stake asset native amounts:
      const allocations: QuoteAllocation[] = [
        {
          allocationType: 'unstake',
          pluginId: requestAssetId.pluginId,
          currencyCode: requestAssetId.currencyCode,
          nativeAmount: requestNativeAmount
        }
      ]

      return await prepareChangeQuote(walletSigner, txs, allocations)
    },

    async fetchUnstakeExactQuote(wallet, requestAssetId, nativeAmount): Promise<ChangeQuote> {
      throw new Error('fetchUnstakeExactQuote not implemented for GlifInfinityPoolAdapter')
    },

    async fetchStakePosition(wallet): Promise<StakePosition> {
      const stakeAssetId = policyConfig.stakeAssets[0]
      const stakeAssetCurrencyCode = stakeAssetId.currencyCode
      const isStakeAssetNative = stakeAssetCurrencyCode === policyConfig.parentCurrencyCode

      if (!isStakeAssetNative) throw new Error('Token staking not supported')

      const poolTokenAddress = await poolContract.liquidStakingToken()
      const poolTokenContract = GlifPoolToken__factory.connect(poolTokenAddress, provider)

      const { walletAddress, walletSigner } = await workflowUtils(wallet)

      // Get stake asset balance:
      const stakeAssetBalance = await walletSigner.getBalance()

      // Get pool token balance:
      const poolTokenBalance = await poolTokenContract
        .connect(walletSigner)
        .balanceOf(walletAddress)
        .catch(err => {
          if (String(err).includes('Transaction reverted without a reason string')) {
            return BigNumber.from(0)
          }
          throw err
        })

      // This is the value you get back in the reward token from the pool token:
      const redemptionValue = await poolContract
        .connect(walletSigner)
        .previewRedeem(poolTokenBalance)
        .catch(err => {
          if (String(err).includes('Transaction reverted without a reason string')) {
            return BigNumber.from(0)
          }
          throw err
        })

      // The only allocation is the amount staked:
      const allocations: PositionAllocation[] = [
        {
          pluginId: policyConfig.rewardAssets[0].pluginId,
          currencyCode: policyConfig.rewardAssets[0].currencyCode,
          allocationType: 'staked',
          nativeAmount: redemptionValue.toString(),
          locktime: undefined
        }
      ]

      //
      // Actions available for the user:
      //

      // You can stake if you have balances of native token
      const canStake = gt(stakeAssetBalance.toString(), '0')

      // You can unstake if you have pool tokens
      const canUnstake = gt(poolTokenBalance.toString(), '0')

      return {
        allocations,
        canStake,
        canUnstake,
        canUnstakeAndClaim: false,
        canClaim: false
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
