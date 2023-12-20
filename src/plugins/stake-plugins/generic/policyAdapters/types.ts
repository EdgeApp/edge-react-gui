import { EdgeCurrencyWallet } from 'edge-core-js'

import { AssetId, ChangeQuote, StakePolicy, StakePosition } from '../../types'
import { GlifInfinityPoolAdapterConfig } from './GlifInfinityPoolAdapter'
import { TarotPoolAdapterConfig } from './TarotPoolAdaptor'

// Union of all adapter configs
export type StakeAdapterConfig = GlifInfinityPoolAdapterConfig | TarotPoolAdapterConfig

export interface StakePolicyAdapter {
  stakePolicyId: string
  fetchStakeQuote: (wallet: EdgeCurrencyWallet, requestAssetId: AssetId, nativeAmount: string) => Promise<ChangeQuote>
  fetchUnstakeQuote: (wallet: EdgeCurrencyWallet, requestAssetId: AssetId, nativeAmount: string) => Promise<ChangeQuote>
  fetchClaimQuote: (wallet: EdgeCurrencyWallet, requestAssetId: AssetId, nativeAmount: string) => Promise<ChangeQuote>
  fetchUnstakeExactQuote: (wallet: EdgeCurrencyWallet, requestAssetId: AssetId, nativeAmount: string) => Promise<ChangeQuote>
  fetchStakePosition: (wallet: EdgeCurrencyWallet) => Promise<StakePosition>
  fetchYieldInfo: () => Promise<Pick<StakePolicy, 'apy' | 'yieldType'>>
}
