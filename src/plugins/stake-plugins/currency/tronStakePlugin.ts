import { gt, lt } from 'biggystring'
import { EdgeSpendInfo } from 'edge-core-js'

import { lstrings } from '../../../locales/strings'
import {
  ChangeQuote,
  ChangeQuoteRequest,
  filterStakePolicies,
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
  rewardsNotClaimable: true,
  mustMaxUnstake: true
}

const policies: StakePolicy[] = [
  {
    ...policyDefault,
    mustMaxUnstake: false,
    stakeProviderInfo: { ...stakeProviderInfo, displayName: lstrings.stake_resource_display_name_v2 },
    stakePolicyId: 'currency:tron:BANDWIDTH_V2',
    rewardAssets: [
      {
        pluginId: 'tron',
        currencyCode: 'BANDWIDTH_V2',
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
    mustMaxUnstake: false,
    stakeProviderInfo: { ...stakeProviderInfo, displayName: lstrings.stake_resource_display_name_v2 },
    stakePolicyId: 'currency:tron:ENERGY_V2',
    rewardAssets: [
      {
        pluginId: 'tron',
        currencyCode: 'ENERGY_V2',
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
    stakePolicyId: 'currency:tron:BANDWIDTH',
    rewardAssets: [
      {
        pluginId: 'tron',
        currencyCode: 'BANDWIDTH',
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
    stakePolicyId: 'currency:tron:ENERGY',
    rewardAssets: [
      {
        pluginId: 'tron',
        currencyCode: 'ENERGY',
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
    },
    async fetchStakePosition(request: StakePositionRequest): Promise<StakePosition> {
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
        canClaim: false
      }
    }
  }
  return instance
}
