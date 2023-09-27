import { gt, lt } from 'biggystring'
import { asDate, asMaybe, asObject, asString } from 'cleaners'
import { EdgeSpendInfo, EdgeTransaction } from 'edge-core-js'

import { lstrings } from '../../../locales/strings'
import {
  ChangeQuote,
  ChangeQuoteRequest,
  filterStakePolicies,
  PositionAllocation,
  QuoteAllocation,
  StakeBelowLimitError,
  StakePlugin,
  StakePolicy,
  StakePolicyFilter,
  StakePosition,
  StakePositionRequest,
  StakeProviderInfo
} from '../types'

const MIN_TRX_STAKE = '1000000' // 1 TRX

const stakeProviderInfo: StakeProviderInfo = {
  displayName: lstrings.stake_resource_display_name,
  pluginId: 'tronResources',
  stakeProviderId: 'tronResources'
}

const policyDefault = {
  apy: 0,
  stakeProviderInfo,
  stakeWarning: null,
  unstakeWarning: null,
  claimWarning: null,
  hideUnstakeAndClaimAction: true
}

const policies: StakePolicy[] = [
  {
    ...policyDefault,
    stakeProviderInfo: { ...stakeProviderInfo, displayName: lstrings.stake_resource_display_name_v2 },
    stakePolicyId: 'currency:tron:BANDWIDTH_V2',
    rewardAssets: [
      {
        pluginId: 'tron',
        currencyCode: 'TRX',
        internalCurrencyCode: 'BANDWIDTH_V2',
        displayName: lstrings.stake_resource_bandwidth,
        cdnName: 'bandwidth'
      }
    ],
    stakeAssets: [
      {
        pluginId: 'tron',
        currencyCode: 'TRX'
      }
    ]
  },
  {
    ...policyDefault,
    stakeProviderInfo: { ...stakeProviderInfo, displayName: lstrings.stake_resource_display_name_v2 },
    stakePolicyId: 'currency:tron:ENERGY_V2',
    rewardAssets: [
      {
        pluginId: 'tron',
        currencyCode: 'TRX',
        internalCurrencyCode: 'ENERGY_V2',
        displayName: lstrings.stake_resource_energy,
        cdnName: 'energy'
      }
    ],
    stakeAssets: [
      {
        pluginId: 'tron',
        currencyCode: 'TRX'
      }
    ]
  },
  {
    ...policyDefault,
    deprecated: true,
    hideClaimAction: true,
    mustMaxUnstake: true,
    stakePolicyId: 'currency:tron:BANDWIDTH',
    rewardAssets: [
      {
        pluginId: 'tron',
        currencyCode: 'TRX',
        internalCurrencyCode: 'BANDWIDTH',
        displayName: lstrings.stake_resource_bandwidth,
        cdnName: 'bandwidth'
      }
    ],
    stakeAssets: [
      {
        pluginId: 'tron',
        currencyCode: 'TRX'
      }
    ]
  },
  {
    ...policyDefault,
    deprecated: true,
    hideClaimAction: true,
    mustMaxUnstake: true,
    stakePolicyId: 'currency:tron:ENERGY',
    rewardAssets: [
      {
        pluginId: 'tron',
        currencyCode: 'TRX',
        internalCurrencyCode: 'ENERGY',
        displayName: lstrings.stake_resource_energy,
        cdnName: 'energy'
      }
    ],
    stakeAssets: [
      {
        pluginId: 'tron',
        currencyCode: 'TRX'
      }
    ]
  }
]

const getPolicyFromId = (policyId: string): StakePolicy => {
  const policy = policies.find(policy => policy.stakePolicyId === policyId)
  if (policy == null) throw new Error(`Cannot find policy ${policyId}`)
  return policy
}

export const makeTronStakePlugin = async (): Promise<StakePlugin> => {
  const instance: StakePlugin = {
    getPolicies(filter?: StakePolicyFilter): StakePolicy[] {
      const out: StakePolicy[] = []

      for (const policy of policies) {
        if (policy.deprecated && filter?.wallet != null) {
          const deprecatedPolicyBalance = filter.wallet.stakingStatus.stakedAmounts.find(
            stakedAmount => policy.rewardAssets[0].currencyCode === stakedAmount.otherParams?.type && gt(stakedAmount.nativeAmount, '0')
          )
          if (deprecatedPolicyBalance == null) continue
        }
        out.push(policy)
      }

      return filterStakePolicies(out, filter)
    },
    async fetchChangeQuote(request: ChangeQuoteRequest): Promise<ChangeQuote> {
      if (isDeprecated(request.stakePolicyId)) return await fetchChangeQuoteV1(request)

      const { action, stakePolicyId, nativeAmount, wallet } = request
      const { pluginId, currencyCode } = wallet.currencyInfo

      if (pluginId !== wallet.currencyInfo.pluginId) {
        throw new Error('pluginId mismatch between request and policy')
      }

      const policy = getPolicyFromId(stakePolicyId)
      const resource = policy.rewardAssets[0].internalCurrencyCode ?? policy.rewardAssets[0].currencyCode
      const spendTargets = [
        {
          publicAddress: (await wallet.getReceiveAddress()).publicAddress
        }
      ]

      let edgeTransaction: EdgeTransaction
      switch (action) {
        case 'stake': {
          if (lt(nativeAmount, MIN_TRX_STAKE)) {
            // Only new stakes in v2 need to meet this min amount
            throw new StakeBelowLimitError(request, request.currencyCode, MIN_TRX_STAKE)
          }

          const spendInfo: EdgeSpendInfo = {
            spendTargets,
            otherParams: {
              type: 'addV2',
              params: { nativeAmount, resource }
            }
          }
          edgeTransaction = await wallet.makeSpend(spendInfo)
          break
        }
        case 'unstake': {
          const spendInfo: EdgeSpendInfo = {
            spendTargets,
            otherParams: {
              type: 'removeV2',
              params: { nativeAmount, resource }
            }
          }
          edgeTransaction = await wallet.makeSpend(spendInfo)
          break
        }
        case 'claim': {
          const spendInfo: EdgeSpendInfo = {
            spendTargets,
            otherParams: {
              type: 'withdrawExpireUnfreeze'
            }
          }
          edgeTransaction = await wallet.makeSpend(spendInfo)
          break
        }
        default: {
          throw new Error('Unsupported action')
        }
      }

      const allocations: QuoteAllocation[] = [
        {
          allocationType: action,
          pluginId,
          currencyCode,
          nativeAmount
        },
        {
          allocationType: 'networkFee',
          pluginId,
          currencyCode,
          nativeAmount: edgeTransaction.networkFee
        }
      ]

      const approve = async () => {
        const signedTx = await wallet.signTx(edgeTransaction)
        const broadcastedTx = await wallet.broadcastTx(signedTx)
        await wallet.saveTx(broadcastedTx)
      }

      return {
        allocations,
        approve
      }
    },
    async fetchStakePosition(request: StakePositionRequest): Promise<StakePosition> {
      if (isDeprecated(request.stakePolicyId)) return await fetchStakePositionV1(request)

      const { stakePolicyId, wallet } = request
      const { currencyCode, pluginId } = wallet.currencyInfo

      const policy = getPolicyFromId(stakePolicyId)
      const rewardAsset = policy.rewardAssets[0].internalCurrencyCode ?? policy.rewardAssets[0].currencyCode
      const balanceTrx = wallet.balances[currencyCode] ?? '0'
      const canStake = gt(balanceTrx, '0')
      const stakedAmountRaw = wallet.stakingStatus.stakedAmounts.find(amount => amount.otherParams?.type === rewardAsset)
      const stakedAmount = asMaybe(asTronStakedAmount)(stakedAmountRaw)
      if (stakedAmount == null) {
        return {
          allocations: [],
          canStake,
          canUnstake: false,
          canUnstakeAndClaim: false,
          canClaim: false
        }
      }

      const {
        nativeAmount: stakedNativeAmount,
        otherParams: { type: stakedType },
        unlockDate
      } = stakedAmount
      const locktime = unlockDate != null ? new Date(unlockDate) : undefined
      const allocations: PositionAllocation[] = [
        {
          pluginId,
          currencyCode,
          allocationType: 'staked',
          nativeAmount: stakedNativeAmount,
          locktime
        }
      ]

      let canClaim = false

      for (const amount of wallet.stakingStatus.stakedAmounts) {
        const {
          nativeAmount,
          otherParams: { type },
          unlockDate
        } = asTronStakedAmount(amount)
        if (unlockDate == null || type !== `WITHDRAWEXPIREUNFREEZE_${stakedType}`) continue
        if (new Date(unlockDate) < new Date()) {
          canClaim = true
        }
        allocations.push({
          pluginId,
          currencyCode: 'TRX',
          allocationType: 'earned',
          nativeAmount: nativeAmount,
          locktime: unlockDate
        })
      }

      return {
        allocations,
        canStake,
        canUnstake: gt(stakedNativeAmount, '0'),
        canUnstakeAndClaim: false,
        canClaim
      }
    }
  }
  return instance
}

// Stake v1 utils
const isDeprecated = (policyId: string): boolean => {
  const policy = policies.find(policy => policy.stakePolicyId === policyId)
  return policy?.deprecated === true
}
const fetchChangeQuoteV1 = async (request: ChangeQuoteRequest): Promise<ChangeQuote> => {
  const { action, stakePolicyId, nativeAmount, wallet } = request
  const { pluginId, currencyCode } = wallet.currencyInfo

  if (pluginId !== wallet.currencyInfo.pluginId) {
    throw new Error('pluginId mismatch between request and policy')
  }

  if (lt(nativeAmount, MIN_TRX_STAKE)) {
    throw new StakeBelowLimitError(request, request.currencyCode, MIN_TRX_STAKE)
  }

  const policy = getPolicyFromId(stakePolicyId)
  const resource = policy.rewardAssets[0].currencyCode
  const isStake = action === 'stake'

  const spendInfo: EdgeSpendInfo = {
    spendTargets: [
      {
        publicAddress: (await wallet.getReceiveAddress()).publicAddress
      }
    ],
    otherParams: {
      type: policy.deprecated ? 'remove' : isStake ? 'addV2' : 'removeV2',
      params: { nativeAmount, resource }
    }
  }
  const edgeTransaction = await wallet.makeSpend(spendInfo)

  const allocations: QuoteAllocation[] = [
    {
      allocationType: isStake ? 'stake' : 'unstake',
      pluginId,
      currencyCode,
      nativeAmount
    },
    {
      allocationType: 'networkFee',
      pluginId,
      currencyCode,
      nativeAmount: edgeTransaction.networkFee
    }
  ]

  const approve = async () => {
    const signedTx = await wallet.signTx(edgeTransaction)
    const broadcastedTx = await wallet.broadcastTx(signedTx)
    await wallet.saveTx(broadcastedTx)
  }

  return {
    allocations,
    approve
  }
}
const fetchStakePositionV1 = async (request: StakePositionRequest): Promise<StakePosition> => {
  const { stakePolicyId, wallet } = request
  const { currencyCode, pluginId } = wallet.currencyInfo

  const policy = getPolicyFromId(stakePolicyId)
  const rewardAsset = policy.rewardAssets[0].currencyCode
  const stakedAmount = wallet.stakingStatus.stakedAmounts.find(amount => amount.otherParams?.type === rewardAsset)
  const nativeAmount = stakedAmount?.nativeAmount ?? '0'
  const balanceTrx = wallet.balances[currencyCode] ?? '0'
  const locktime = stakedAmount?.unlockDate != null ? new Date(stakedAmount.unlockDate) : undefined

  return {
    allocations: [
      {
        pluginId,
        currencyCode,
        allocationType: 'staked',
        nativeAmount,
        locktime
      }
    ],
    canStake: !policy.deprecated && gt(balanceTrx, '0'),
    canUnstake: locktime != null ? new Date() >= new Date(locktime) : true,
    canUnstakeAndClaim: false,
    canClaim: false
  }
}

const asTronStakedAmount = asObject({
  nativeAmount: asString,
  unlockDate: asMaybe(asDate),
  otherParams: asObject({ type: asString })
})
