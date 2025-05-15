import { gt } from 'biggystring'
import { asObject, asOptional, asString } from 'cleaners'

import { fetchWaterfall } from '../../../util/network'
import {
  ChangeQuote,
  ChangeQuoteRequest,
  filterStakePolicies,
  StakePlugin,
  StakePolicy,
  StakePolicyFilter,
  StakePosition,
  StakePositionRequest,
  StakeProviderInfo
} from '../types'
import { EdgeGuiPluginOptions } from '../util/internalTypes'

const THORNODE_SERVERS_DEFAULT = ['https://thornode.ninerealms.com']

const asInitOptions = asObject({
  ninerealmsClientId: asOptional(asString, '')
})

const asTcyStaker = asObject({
  address: asString,
  amount: asString
})

const stakeProviderInfo: StakeProviderInfo = {
  displayName: 'Thorchain TCY',
  pluginId: 'thorchainrune',
  stakeProviderId: 'thorchain-tcy'
}

const policy: StakePolicy = {
  stakePolicyId: 'tcy',
  stakeProviderInfo,
  rewardAssets: [
    {
      pluginId: 'thorchainrune',
      currencyCode: 'RUNE'
    }
  ],
  stakeAssets: [
    {
      pluginId: 'thorchainrune',
      currencyCode: 'TCY'
    }
  ],
  hideClaimAction: true,
  hideUnstakeAction: false,
  hideUnstakeAndClaimAction: true
}

const thornodeServers: string[] = THORNODE_SERVERS_DEFAULT

export const makeThorchainTcyPlugin = async (pluginId: string, opts: EdgeGuiPluginOptions): Promise<StakePlugin | undefined> => {
  if (pluginId !== 'thorchainrune') return

  const instance: StakePlugin = {
    getPolicies(filter?: StakePolicyFilter): StakePolicy[] {
      return filterStakePolicies([policy], filter)
    },
    async fetchChangeQuote(request: ChangeQuoteRequest): Promise<ChangeQuote> {
      throw new Error('unsupported')
    },
    async fetchStakePosition(request: StakePositionRequest): Promise<StakePosition> {
      return await getStakePosition(opts, request)
    }
  }
  return instance
}

const getStakePosition = async (opts: EdgeGuiPluginOptions, request: StakePositionRequest): Promise<StakePosition> => {
  const { wallet } = request

  const addresses = await wallet.getAddresses({ tokenId: null })
  const address = addresses[0].publicAddress

  const { ninerealmsClientId } = asInitOptions(opts.initOptions)
  const tcyStakerResponse = await fetchWaterfall(thornodeServers, `thorchain/tcy_staker/${address}`, {
    headers: { 'x-client-id': ninerealmsClientId, 'Content-Type': 'application/json' }
  })

  const position: StakePosition = {
    allocations: [],
    canStake: false,
    canUnstake: false,
    canUnstakeAndClaim: false,
    canClaim: false
  }

  if (!tcyStakerResponse.ok) {
    const responseText = await tcyStakerResponse.text()
    if (responseText.includes("fail to tcy staker: TCYStaker doesn't exist")) {
      return position
    }
    throw new Error(`Thorchain could not fetch /tcy_staker: ${responseText}`)
  }
  const stakerJson = await tcyStakerResponse.json()
  const staker = asTcyStaker(stakerJson)

  if (gt(staker.amount, '0')) {
    position.allocations.push({
      pluginId: 'thorchainrune',
      currencyCode: 'TCY',
      allocationType: 'staked',
      nativeAmount: staker.amount
    })
  }

  return position
}
