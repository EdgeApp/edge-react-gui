import type { ActionRequestDto, TransactionDto } from '@stakekit/api-hooks'
import { add, div, eq, floor, gt, mul, sub } from 'biggystring'
import { EdgeCurrencyWallet, EdgeTransaction } from 'edge-core-js'

import { infoServerData } from '../../../../util/network'
import { DECIMAL_PRECISION } from '../../../../util/utils'
import { AssetId, ChangeQuote, PositionAllocation, QuoteAllocation, StakePosition } from '../../types'
import { asInfoServerResponse } from '../../util/internalTypes'
import { StakePolicyConfig } from '../types'
import { actionEnter, actionExit, actionPending, transactionConstruct, transactionSubmitHash, yieldGetSingleYieldBalances } from '../util/stakeKitUtils'
import { StakePolicyAdapter } from './types'

export interface CoreumNativeSkateKitAdapterConfig {
  type: 'coreum-native-stake-kit'
  integrationId: string
  preferredValidatorAddress: string
  preferredValidatorName: string
}

export const makeSkateKitAdapter = (policyConfig: StakePolicyConfig<CoreumNativeSkateKitAdapterConfig>): StakePolicyAdapter => {
  if (policyConfig.stakeAssets.length > 1) throw new Error(`Staking more than one assets is not supported for CoreumSkateKitAdapter`)
  if (policyConfig.rewardAssets.length > 1) throw new Error(`Claim of more than one assets is not supported for CoreumSkateKitAdapter`)

  if (policyConfig.stakeAssets[0].currencyCode !== policyConfig.rewardAssets[0].currencyCode)
    throw new Error(`Stake and claim of different assets is not supported for CoreumSkateKitAdapter`)

  // Metadata constants:
  const metadataName = 'Coreum Native Staking'
  const stakeAsset = policyConfig.stakeAssets[0]
  const metadataPoolAssetName = `${stakeAsset.currencyCode}`

  const { adapterConfig, stakePolicyId, stakeProviderInfo } = policyConfig

  async function prepareChangeQuote(
    wallet: EdgeCurrencyWallet,
    txs: TransactionDto[],
    edgeTxs: EdgeTransaction[],
    allocations: QuoteAllocation[]
  ): Promise<ChangeQuote> {
    const networkFee = edgeTxs.reduce((prev, curr) => add(prev, curr.networkFee), '0')

    allocations.push({
      allocationType: 'networkFee',
      pluginId: policyConfig.parentPluginId,
      currencyCode: policyConfig.parentCurrencyCode,
      nativeAmount: networkFee
    })

    const approve = async (): Promise<void> => {
      for (let i = 0; i < txs.length; i++) {
        const { unsignedTransaction } = txs[i]
        if (unsignedTransaction == null) continue

        const signedTx = await wallet.signMessage(unsignedTransaction)
        const edgeTx = edgeTxs[i]
        edgeTx.signedTx = signedTx
        const broadcastEdgeTx = await wallet.broadcastTx(edgeTx)
        await transactionSubmitHash(txs[i].id, { hash: broadcastEdgeTx.txid })
        await wallet.saveTx(broadcastEdgeTx)
      }
    }

    return {
      allocations,
      approve
    }
  }

  async function getUnsignedTransactions(transactions: TransactionDto[]): Promise<TransactionDto[]> {
    const unsignedTxs: TransactionDto[] = []
    for (const txFromStakeKit of transactions) {
      const txResponse = await transactionConstruct(txFromStakeKit.id, {})
      unsignedTxs.push(txResponse)
    }
    return unsignedTxs.filter(tx => tx.status === 'WAITING_FOR_SIGNATURE')
  }

  async function workflowUtils(wallet: EdgeCurrencyWallet): Promise<{ exchangeDenomMultiplier: string; stakeKitAddresses: ActionRequestDto['addresses'] }> {
    const { publicAddress } = await wallet.getReceiveAddress({ tokenId: null })
    const stakeKitAddresses: ActionRequestDto['addresses'] = {
      address: publicAddress,
      additionalAddresses: {
        cosmosPubKey: wallet.publicWalletInfo.keys.publicKey
      }
    }

    const multiplier = wallet.currencyInfo.denominations.find(denom => denom.name === stakeAsset.currencyCode)?.multiplier ?? '1'

    return { exchangeDenomMultiplier: multiplier, stakeKitAddresses }
  }

  const instance: StakePolicyAdapter = {
    stakePolicyId,

    async fetchClaimQuote(wallet: EdgeCurrencyWallet, requestAssetId: AssetId, nativeAmount: string): Promise<ChangeQuote> {
      const { exchangeDenomMultiplier, stakeKitAddresses } = await workflowUtils(wallet)

      const yieldBalanceRes = await yieldGetSingleYieldBalances(adapterConfig.integrationId, {
        addresses: stakeKitAddresses
      })

      const rewardsActions = yieldBalanceRes.find(action => action.validatorAddress === adapterConfig.preferredValidatorAddress && action.type === 'rewards')
      const claimAction = rewardsActions?.pendingActions.find(action => action.type === 'CLAIM_REWARDS')
      if (claimAction == null) throw new Error('Did not find pending claim action')

      const actionPendingRes = await actionPending({
        integrationId: adapterConfig.integrationId,
        passthrough: claimAction.passthrough,
        type: claimAction.type,
        args: { amount: div(nativeAmount, exchangeDenomMultiplier, DECIMAL_PRECISION), validatorAddress: adapterConfig.preferredValidatorAddress }
      })

      const unsignedTransactions = await getUnsignedTransactions(actionPendingRes.transactions)

      const edgeTxs = unsignedTransactions.map(tx => {
        const networkFee = mul(exchangeDenomMultiplier, tx.gasEstimate?.amount ?? '0')

        const edgeTx: EdgeTransaction = {
          blockHeight: 0,
          currencyCode: requestAssetId.currencyCode,
          date: 0,
          isSend: true,
          memos: [],
          metadata: {
            name: metadataName,
            category: 'Income:Claim',
            notes: `Claim ${metadataPoolAssetName} rewards from ${adapterConfig.preferredValidatorName} staking`
          },
          nativeAmount: sub(nativeAmount, networkFee),
          networkFee,
          ourReceiveAddresses: [],
          signedTx: '',
          tokenId: null,
          txid: '',
          walletId: wallet.id
        }
        return edgeTx
      })

      const allocations: QuoteAllocation[] = [
        {
          allocationType: 'claim',
          pluginId: requestAssetId.pluginId,
          currencyCode: requestAssetId.currencyCode,
          nativeAmount
        }
      ]

      return await prepareChangeQuote(wallet, unsignedTransactions, edgeTxs, allocations)
    },

    async fetchStakeQuote(wallet, requestAssetId, requestNativeAmount): Promise<ChangeQuote> {
      const { exchangeDenomMultiplier, stakeKitAddresses } = await workflowUtils(wallet)

      const args: ActionRequestDto['args'] = {
        amount: div(requestNativeAmount, exchangeDenomMultiplier, DECIMAL_PRECISION),
        validatorAddress: adapterConfig.preferredValidatorAddress
      }

      const actionEnterRes = await actionEnter({
        integrationId: adapterConfig.integrationId,
        addresses: stakeKitAddresses,
        args
      })
      const unsignedTransactions = await getUnsignedTransactions(actionEnterRes.transactions)

      const edgeTxs = unsignedTransactions.map(tx => {
        const networkFee = mul(exchangeDenomMultiplier, tx.gasEstimate?.amount ?? '0')

        const edgeTx: EdgeTransaction = {
          blockHeight: 0,
          currencyCode: requestAssetId.currencyCode,
          date: 0,
          isSend: true,
          memos: [],
          metadata: {
            name: metadataName,
            category: 'Transfer:Staking',
            notes: `Stake ${metadataPoolAssetName} to ${adapterConfig.preferredValidatorName}`
          },
          nativeAmount: `-${networkFee}`,
          networkFee,
          ourReceiveAddresses: [],
          savedAction: {
            actionType: 'stake',
            pluginId: stakeProviderInfo.pluginId,
            stakeAssets: [
              {
                nativeAmount: requestNativeAmount,
                pluginId: policyConfig.parentPluginId,
                tokenId: null
              }
            ]
          },
          signedTx: '',
          tokenId: null,
          txid: '',
          walletId: wallet.id
        }
        return edgeTx
      })

      // Calculate the stake asset native amounts:
      const allocations: QuoteAllocation[] = [
        {
          allocationType: 'stake',
          pluginId: requestAssetId.pluginId,
          currencyCode: requestAssetId.currencyCode,
          nativeAmount: requestNativeAmount
        }
      ]

      return await prepareChangeQuote(wallet, unsignedTransactions, edgeTxs, allocations)
    },

    async fetchUnstakeQuote(wallet, requestAssetId, requestNativeAmount): Promise<ChangeQuote> {
      const { exchangeDenomMultiplier, stakeKitAddresses } = await workflowUtils(wallet)

      const args: ActionRequestDto['args'] = {
        amount: div(requestNativeAmount, exchangeDenomMultiplier, DECIMAL_PRECISION),
        validatorAddress: adapterConfig.preferredValidatorAddress
      }

      const actionExitRes = await actionExit({
        integrationId: adapterConfig.integrationId,
        addresses: stakeKitAddresses,
        args
      })
      const unsignedTransactions = await getUnsignedTransactions(actionExitRes.transactions)

      const edgeTxs = unsignedTransactions.map(tx => {
        const networkFee = mul(exchangeDenomMultiplier, tx.gasEstimate?.amount ?? '0')

        const edgeTx: EdgeTransaction = {
          blockHeight: 0,
          currencyCode: requestAssetId.currencyCode,
          date: 0,
          isSend: true,
          memos: [],
          metadata: {
            name: metadataName,
            category: 'Transfer:Unstaking',
            notes: `Unstake ${metadataPoolAssetName} from ${adapterConfig.preferredValidatorName}`
          },
          nativeAmount: `-${networkFee}`,
          networkFee,
          ourReceiveAddresses: [],
          savedAction: {
            actionType: 'stake',
            pluginId: stakeProviderInfo.pluginId,
            stakeAssets: [
              {
                nativeAmount: requestNativeAmount,
                pluginId: policyConfig.parentPluginId,
                tokenId: null
              }
            ]
          },
          signedTx: '',
          tokenId: null,
          txid: '',
          walletId: wallet.id
        }
        return edgeTx
      })

      const allocations: QuoteAllocation[] = [
        {
          allocationType: 'unstake',
          pluginId: requestAssetId.pluginId,
          currencyCode: requestAssetId.currencyCode,
          nativeAmount: requestNativeAmount
        }
      ]

      return await prepareChangeQuote(wallet, unsignedTransactions, edgeTxs, allocations)
    },

    async fetchUnstakeExactQuote(wallet, requestAssetId, nativeAmount): Promise<ChangeQuote> {
      throw new Error('fetchUnstakeExactQuote not implemented for StakeKit')
    },

    async fetchStakePosition(wallet): Promise<StakePosition> {
      const { exchangeDenomMultiplier, stakeKitAddresses } = await workflowUtils(wallet)
      const { currencyCode, pluginId } = wallet.currencyInfo

      const walletBalance = wallet.balanceMap.get(null) ?? '0'
      const canStake = gt(walletBalance, '0')
      let canUnstakeAndClaim = false
      let canClaim = false

      const yieldBalancesRes = await yieldGetSingleYieldBalances(adapterConfig.integrationId, {
        addresses: stakeKitAddresses,
        args: { validatorAddresses: [adapterConfig.preferredValidatorAddress] }
      })

      const allocations: PositionAllocation[] = []
      for (const balance of yieldBalancesRes) {
        const {
          amount,
          // groupId,
          pendingActions,
          // pricePerShare,
          // token,
          type,
          date,
          validatorAddress
          // validatorAddresses
        } = balance
        if (adapterConfig.preferredValidatorAddress != null) {
          if (validatorAddress !== adapterConfig.preferredValidatorAddress) continue
        }

        const nativeAmount = floor(mul(amount, exchangeDenomMultiplier), 0)
        if (eq(nativeAmount, '0')) continue

        const locktime = date != null ? new Date(date) : undefined

        // Build allocations
        switch (type) {
          case 'rewards': {
            allocations.push({
              pluginId,
              currencyCode,
              allocationType: 'earned',
              nativeAmount,
              locktime
            })
            break
          }
          case 'staked': {
            canUnstakeAndClaim = true
            allocations.push({
              pluginId,
              currencyCode,
              allocationType: 'staked',
              nativeAmount,
              locktime
            })
            break
          }
          case 'unstaking': {
            allocations.push({
              pluginId,
              currencyCode,
              allocationType: 'unstaked',
              nativeAmount,
              locktime
            })
            break
          }
          default: {
            continue
          }
        }

        for (const action of pendingActions) {
          switch (action.type) {
            case 'CLAIM_REWARDS': {
              canClaim = true
              break
            }
            default: {
              // do nothing
            }
          }
        }
      }

      if (allocations.length === 0) {
        allocations.push({
          pluginId,
          currencyCode,
          allocationType: 'staked',
          nativeAmount: '0'
        })
      }

      return {
        allocations,
        canStake,
        canUnstake: false,
        canUnstakeAndClaim,
        canClaim
      }
    },

    async fetchYieldInfo() {
      const infoServerResponse = asInfoServerResponse(infoServerData.rollup?.apyValues ?? { policies: {} })
      const apy = infoServerResponse.policies[stakePolicyId] ?? 0
      return { apy }
    }
  }

  return instance
}
