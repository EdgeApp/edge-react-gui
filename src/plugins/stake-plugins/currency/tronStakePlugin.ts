import { gt } from 'biggystring'
import { EdgeSpendInfo } from 'edge-core-js'

import s from '../../../locales/strings'
import { ChangeQuote, ChangeQuoteRequest, QuoteAllocation, StakePlugin, StakePolicy, StakePosition, StakePositionRequest, StakeProviderInfo } from '../types'

const stakeProviderInfo: StakeProviderInfo = {
  displayName: s.strings.stake_resource_display_name,
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
    stakePolicyId: 'currency:tron:BANDWIDTH',
    rewardAssets: [
      {
        pluginId: 'tron',
        currencyCode: 'BANDWIDTH',
        displayName: s.strings.stake_resource_bandwidth,
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
    stakePolicyId: 'currency:tron:ENERGY',
    rewardAssets: [
      {
        pluginId: 'tron',
        currencyCode: 'ENERGY',
        displayName: s.strings.stake_resource_energy,
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
    policies,
    async fetchChangeQuote(request: ChangeQuoteRequest): Promise<ChangeQuote> {
      const { action, stakePolicyId, nativeAmount, wallet } = request
      const { pluginId, currencyCode } = wallet.currencyInfo

      if (pluginId !== wallet.currencyInfo.pluginId) {
        throw new Error('pluginId mismatch between request and policy')
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
          type: isStake ? 'add' : 'remove',
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
      const locktime = new Date(stakedAmount?.unlockDate ?? Date.now())

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
        canStake: gt(balanceTrx, '0'),
        canUnstake: new Date() > new Date(locktime),
        canClaim: false
      }
    }
  }
  return instance
}
