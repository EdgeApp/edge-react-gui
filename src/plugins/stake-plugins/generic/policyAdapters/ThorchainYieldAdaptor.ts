import { div, gt, mul } from 'biggystring'
import { asObject, asString } from 'cleaners'
import { EdgeAssetAction, EdgeCurrencyWallet, EdgeTransaction, EdgeTxActionStake } from 'edge-core-js'
import { sprintf } from 'sprintf-js'

import { lstrings } from '../../../../locales/strings'
import { StringMap } from '../../../../types/types'
import { fetchWaterfall, infoServerData } from '../../../../util/network'
import { ChangeQuote, QuoteAllocation, StakeAssetInfo, StakePosition } from '../../types'
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

// copied from edge-currency-accountbased
interface MakeTxParams {
  type: 'MakeTxDeposit'
  assets: Array<{
    amount: string
    asset: string
    decimals: string
  }>
  memo: string
  assetAction: EdgeAssetAction
  savedAction: EdgeTxActionStake
}

export const makeThorchainYieldAdapter = (policyConfig: StakePolicyConfig<ThorchainYieldAdapterConfig>): StakePolicyAdapter => {
  const { stakePolicyId, adapterConfig } = policyConfig
  const { thornodeServers, ninerealmsClientId } = adapterConfig
  const headers: StringMap = { 'Content-Type': 'application/json' }
  if (ninerealmsClientId != null) {
    headers['x-client-id'] = ninerealmsClientId
  }

  // Metadata constants:
  const metadataName = 'Thorchain Yield'
  const stakeAsset = policyConfig.stakeAssets[0]
  const metadataPoolAssetName = stakeAsset.currencyCode

  const getStakedTcyAmount = async (wallet: EdgeCurrencyWallet): Promise<string> => {
    const addresses = await wallet.getAddresses({ tokenId: null })
    const address = addresses[0].publicAddress

    const tcyStakerResponse = await fetchWaterfall(thornodeServers, `thorchain/tcy_staker/${address}`, { headers })

    if (!tcyStakerResponse.ok) {
      const responseText = await tcyStakerResponse.text()
      if (responseText.includes("fail to tcy staker: TCYStaker doesn't exist")) {
        return '0'
      }
      throw new Error(`Thorchain could not fetch /tcy_staker: ${responseText}`)
    }
    const stakerJson = await tcyStakerResponse.json()
    const staker = asTcyStaker(stakerJson)
    return staker.amount
  }

  const instance: StakePolicyAdapter = {
    stakePolicyId,

    async fetchClaimQuote(wallet: EdgeCurrencyWallet, requestAssetId: StakeAssetInfo, nativeAmount: string): Promise<ChangeQuote> {
      throw new Error('fetchClaimQuote not implemented')
    },

    async fetchStakeQuote(wallet: EdgeCurrencyWallet, requestAssetId: StakeAssetInfo, requestNativeAmount: string): Promise<ChangeQuote> {
      const makeTxParams: MakeTxParams = {
        type: 'MakeTxDeposit',
        assets: [
          {
            amount: requestNativeAmount,
            asset: 'THOR.TCY',
            decimals: '100000000'
          }
        ],
        memo: 'TCY+',
        assetAction: { assetActionType: 'stake' },
        savedAction: {
          actionType: 'stake',
          pluginId: 'thorchainrune',
          stakeAssets: [{ pluginId: 'thorchainrune', tokenId: 'tcy', nativeAmount: requestNativeAmount }]
        }
      }
      const edgeTx: EdgeTransaction = await wallet.otherMethods.makeTx(makeTxParams)
      edgeTx.metadata = {
        name: metadataName,
        category: 'Transfer:Staking',
        notes: `Stake ${metadataPoolAssetName}`
      }

      const networkFee = edgeTx.networkFees.find(fee => fee.tokenId == null)?.nativeAmount ?? '0'
      const runeBalance = wallet.balanceMap.get(null) ?? '0'
      if (gt(networkFee, runeBalance)) {
        throw new Error(sprintf(lstrings.stake_error_insufficient_s, 'RUNE'))
      }

      const allocations: QuoteAllocation[] = [
        {
          allocationType: 'stake',
          pluginId: requestAssetId.pluginId,
          currencyCode: requestAssetId.currencyCode,
          nativeAmount: requestNativeAmount
        },
        {
          allocationType: 'networkFee',
          pluginId: 'thorchainrune',
          currencyCode: 'RUNE',
          nativeAmount: networkFee
        }
      ]

      const approve = async () => {
        let signedTx = await wallet.signTx(edgeTx)
        signedTx = await wallet.broadcastTx(signedTx)
        await wallet.saveTx(signedTx)
      }

      return {
        allocations,
        approve
      }
    },

    async fetchUnstakeQuote(wallet: EdgeCurrencyWallet, requestAssetId: StakeAssetInfo, requestNativeAmount: string): Promise<ChangeQuote> {
      const tcyStakedAmount = await getStakedTcyAmount(wallet)

      // 10000 basis points = 100% of staked balance https://dev.thorchain.org/concepts/memos.html#unstake-tcy
      const basisPoints = mul(div(requestNativeAmount, tcyStakedAmount, 4), '10000')

      const makeTxParams: MakeTxParams = {
        type: 'MakeTxDeposit',
        assets: [
          {
            amount: '0',
            asset: 'THOR.TCY',
            decimals: '100000000'
          }
        ],
        memo: `TCY-:${basisPoints}`,
        assetAction: { assetActionType: 'unstake' },
        savedAction: {
          actionType: 'stake',
          pluginId: 'thorchainrune',
          stakeAssets: [{ pluginId: 'thorchainrune', tokenId: 'tcy', nativeAmount: requestNativeAmount }]
        }
      }
      const edgeTx: EdgeTransaction = await wallet.otherMethods.makeTx(makeTxParams)
      edgeTx.metadata = {
        name: metadataName,
        category: 'Transfer:Unstaking',
        notes: `Unstake ${metadataPoolAssetName}`
      }

      const networkFee = edgeTx.networkFees.find(fee => fee.tokenId == null)?.nativeAmount ?? '0'
      const runeBalance = wallet.balanceMap.get(null) ?? '0'
      if (gt(networkFee, runeBalance)) {
        throw new Error(sprintf(lstrings.stake_error_insufficient_s, 'RUNE'))
      }

      const allocations: QuoteAllocation[] = [
        {
          allocationType: 'unstake',
          pluginId: requestAssetId.pluginId,
          currencyCode: requestAssetId.currencyCode,
          nativeAmount: requestNativeAmount
        },
        {
          allocationType: 'networkFee',
          pluginId: 'thorchainrune',
          currencyCode: 'RUNE',
          nativeAmount: networkFee
        }
      ]

      const approve = async () => {
        let signedTx = await wallet.signTx(edgeTx)
        signedTx = await wallet.broadcastTx(signedTx)
        await wallet.saveTx(signedTx)
      }

      return {
        allocations,
        approve
      }
    },

    async fetchUnstakeExactQuote(wallet: EdgeCurrencyWallet, requestAssetId: StakeAssetInfo, nativeAmount: string): Promise<ChangeQuote> {
      throw new Error('fetchUnstakeExactQuote not implemented')
    },

    async fetchStakePosition(wallet: EdgeCurrencyWallet): Promise<StakePosition> {
      const balance = wallet.balanceMap.get('tcy') ?? '0'
      const tcyStakedAmount = await getStakedTcyAmount(wallet)

      const position: StakePosition = {
        allocations: [
          {
            pluginId: 'thorchainrune',
            currencyCode: 'TCY',
            allocationType: 'staked',
            nativeAmount: tcyStakedAmount
          }
        ],
        canStake: gt(balance, '0'),
        canUnstake: gt(tcyStakedAmount, '0'),
        canUnstakeAndClaim: false,
        canClaim: false
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
