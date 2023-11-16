import { EdgeCurrencyWallet } from 'edge-core-js'

import { AssetId, ChangeQuote, StakePolicy, StakePosition } from '../../types'
import { GlifInfinityPoolAdapterConfig } from './GlifInfinityPoolAdapter'

// Union of all adapter configs
export type StakeAdapterConfig = GlifInfinityPoolAdapterConfig

export interface StakePolicyAdapter {
  stakePolicyId: string
  fetchStakeQuote: (wallet: EdgeCurrencyWallet, requestAssetId: AssetId, nativeAmount: string) => Promise<ChangeQuote>
  fetchUnstakeQuote: (wallet: EdgeCurrencyWallet, requestAssetId: AssetId, nativeAmount: string) => Promise<ChangeQuote>
  fetchClaimQuote: (wallet: EdgeCurrencyWallet, requestAssetId: AssetId, nativeAmount: string) => Promise<ChangeQuote>
  fetchUnstakeExactQuote: (wallet: EdgeCurrencyWallet, requestAssetId: AssetId, nativeAmount: string) => Promise<ChangeQuote>
  fetchStakePosition: (wallet: EdgeCurrencyWallet) => Promise<StakePosition>
  fetchYieldInfo: () => Promise<Pick<StakePolicy, 'apy' | 'yieldType'>>
}
