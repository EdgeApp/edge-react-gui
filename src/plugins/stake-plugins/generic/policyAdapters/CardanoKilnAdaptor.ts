import { eq, gt, lt, sub } from 'biggystring'
import { EdgeCurrencyWallet, EdgeTransaction } from 'edge-core-js'

import { lstrings } from '../../../../locales/strings'
import { HumanFriendlyError } from '../../../../types/HumanFriendlyError'
import { infoServerData } from '../../../../util/network'
import { ChangeQuote, PositionAllocation, QuoteAllocation, StakeAssetInfo, StakePosition } from '../../types'
import { asInfoServerResponse } from '../../util/internalTypes'
import { StakePolicyConfig } from '../types'
import { KilnError, makeKilnApi } from '../util/KilnApi'
import { StakePolicyAdapter } from './types'

const MIN_STAKE_LOVELACE_AMOUNT = '5000000'

export interface CardanoPooledKilnAdapterConfig {
  type: 'cardano-pooled-kiln'
  pluginId: string

  // The account ID from kiln
  accountId: string | null
  apiKey: string | null
  baseUrl: string
  // The pool address (e.g. pool10rdg...)
  poolId: string
}

export const makeCardanoKilnAdapter = (policyConfig: StakePolicyConfig<CardanoPooledKilnAdapterConfig>): StakePolicyAdapter => {
  const { stakePolicyId, adapterConfig } = policyConfig

  if (adapterConfig.apiKey == null) throw new Error(`Kiln api key is required for ${stakePolicyId}`)

  const { accountId } = adapterConfig
  if (accountId == null) throw new Error(`Kiln account ID  is required for ${stakePolicyId}`)

  const kiln = makeKilnApi(adapterConfig.baseUrl, adapterConfig.apiKey)

  const instance: StakePolicyAdapter = {
    stakePolicyId,

    async fetchClaimQuote(wallet: EdgeCurrencyWallet, requestAssetId: StakeAssetInfo, nativeAmount: string): Promise<ChangeQuote> {
      const { publicAddress: walletAddress } = await wallet.getReceiveAddress({ tokenId: null })

      const stakeTransaction = await kiln.adaWithdrawRewards(walletAddress, nativeAmount)
      const edgeTx: EdgeTransaction = await wallet.otherMethods.decodeStakingTx(stakeTransaction.unsigned_tx_serialized)

      const allocations: QuoteAllocation[] = [
        {
          allocationType: 'claim',
          pluginId: requestAssetId.pluginId,
          currencyCode: requestAssetId.currencyCode,
          nativeAmount: nativeAmount
        },
        {
          allocationType: 'networkFee',
          pluginId: wallet.currencyInfo.pluginId,
          currencyCode: wallet.currencyInfo.currencyCode,
          nativeAmount: edgeTx.networkFee
        }
      ]

      return {
        allocations,
        approve: async () => {
          const signedTx = await wallet.signTx(edgeTx)
          const broadcastTx = await wallet.broadcastTx(signedTx)
          await wallet.saveTx(broadcastTx)
        }
      }
    },

    async fetchStakeQuote(wallet: EdgeCurrencyWallet, requestAssetId: StakeAssetInfo, _requestNativeAmount: string): Promise<ChangeQuote> {
      const { publicAddress: walletAddress } = await wallet.getReceiveAddress({ tokenId: null })

      const walletBalance = wallet.balanceMap.get(null) ?? '0'
      if (eq(walletBalance, '0')) {
        throw new Error('Insufficient funds')
      }
      if (lt(walletBalance, MIN_STAKE_LOVELACE_AMOUNT)) {
        const balanceDisplayAmount = await wallet.nativeToDenomination(walletBalance, wallet.currencyInfo.currencyCode)
        const minimumDisplayAmount = await wallet.nativeToDenomination(MIN_STAKE_LOVELACE_AMOUNT, wallet.currencyInfo.currencyCode)
        const balanceDisplayString = `${balanceDisplayAmount} ${wallet.currencyInfo.currencyCode}`
        const minimumDisplayString = `${minimumDisplayAmount} ${wallet.currencyInfo.currencyCode}`
        throw new HumanFriendlyError(lstrings.error_balance_below_minimum_to_stake_2s, balanceDisplayString, minimumDisplayString)
      }

      const result = await kiln.adaStakeTransaction(walletAddress, adapterConfig.poolId, accountId).catch(error => {
        if (error instanceof Error) return error
        throw error
      })
      if (result instanceof KilnError) {
        if (/Value \d+ less than the minimum UTXO value \d+/.test(result.error)) {
          const displayBalance = await wallet.nativeToDenomination(walletBalance, wallet.currencyInfo.currencyCode)
          throw new HumanFriendlyError(lstrings.error_amount_too_low_to_stake_s, `${displayBalance} ${wallet.currencyInfo.currencyCode}`)
        }
      }
      if (result instanceof Error) {
        throw result
      }

      const stakeTransaction = result
      const edgeTx: EdgeTransaction = await wallet.otherMethods.decodeStakingTx(stakeTransaction.unsigned_tx_serialized)

      const allocations: QuoteAllocation[] = [
        {
          allocationType: 'stake',
          pluginId: requestAssetId.pluginId,
          currencyCode: requestAssetId.currencyCode,
          nativeAmount: sub(walletBalance, edgeTx.networkFee)
        },
        {
          allocationType: 'networkFee',
          pluginId: wallet.currencyInfo.pluginId,
          currencyCode: wallet.currencyInfo.currencyCode,
          nativeAmount: edgeTx.networkFee
        }
      ]

      return {
        allocations,
        approve: async () => {
          const signedTx = await wallet.signTx(edgeTx)
          const broadcastTx = await wallet.broadcastTx(signedTx)
          await wallet.saveTx(broadcastTx)
        }
      }
    },

    async fetchUnstakeQuote(wallet: EdgeCurrencyWallet, requestAssetId: StakeAssetInfo, _requestNativeAmount: string): Promise<ChangeQuote> {
      const { publicAddress: walletAddress } = await wallet.getReceiveAddress({ tokenId: null })

      const walletBalance = wallet.balanceMap.get(null) ?? '0'
      if (eq(walletBalance, '0')) {
        throw new Error('Insufficient funds')
      }

      const stakeTransaction = await kiln.adaUnstakeTransaction(walletAddress)
      const edgeTx: EdgeTransaction = await wallet.otherMethods.decodeStakingTx(stakeTransaction.unsigned_tx_serialized)

      const allocations: QuoteAllocation[] = [
        {
          allocationType: 'unstake',
          pluginId: requestAssetId.pluginId,
          currencyCode: requestAssetId.currencyCode,
          nativeAmount: sub(walletBalance, edgeTx.networkFee)
        },
        {
          allocationType: 'networkFee',
          pluginId: wallet.currencyInfo.pluginId,
          currencyCode: wallet.currencyInfo.currencyCode,
          nativeAmount: edgeTx.networkFee
        }
      ]

      return {
        allocations,
        approve: async () => {
          const signedTx = await wallet.signTx(edgeTx)
          const broadcastTx = await wallet.broadcastTx(signedTx)
          await wallet.saveTx(broadcastTx)
        }
      }
    },

    async fetchUnstakeExactQuote(wallet: EdgeCurrencyWallet, requestAssetId: StakeAssetInfo, nativeAmount: string): Promise<ChangeQuote> {
      throw new Error('fetchUnstakeExactQuote not implemented')
    },

    async fetchStakePosition(wallet: EdgeCurrencyWallet): Promise<StakePosition> {
      const { currencyCode, pluginId } = wallet.currencyInfo

      const allocations: PositionAllocation[] = []

      const stakeAddress: string = await wallet.otherMethods.getStakeAddress()

      const stakes = await kiln.adaGetStakes({
        stakeAddresses: [stakeAddress]
      })
      const hasActiveStake = stakes.some(stake => stake.state === 'active')
      const stakeInPool = stakes.find(stake => stake.stake_address === stakeAddress && stake.pool_id === adapterConfig.poolId && stake.state === 'active')

      const stakedAmount = stakeInPool?.balance ?? '0'
      allocations.push({
        allocationType: 'staked',
        pluginId,
        currencyCode,
        nativeAmount: stakedAmount
      })

      const rewardsAmount = stakeInPool?.rewards ?? '0'
      allocations.push({
        allocationType: 'earned',
        pluginId,
        currencyCode,
        nativeAmount: rewardsAmount
      })

      return {
        allocations,
        canStake: !hasActiveStake,
        canUnstake: gt(stakedAmount, '0'),
        canUnstakeAndClaim: false,
        canClaim: gt(rewardsAmount, '0')
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
