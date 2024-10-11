import { EdgeCurrencyWallet } from 'edge-core-js'

import { ChangeQuote, StakeAssetInfo, StakePolicy, StakePosition } from '../../types'
import { CardanoPooledKilnAdapterConfig } from './CardanoKilnAdaptor'
import { CoreumNativeSkateKitAdapterConfig } from './CoreumStakeKitAdaptor'
import { EthereumPooledKilnAdapterConfig } from './EthereumKilnAdaptor'
import { GlifInfinityPoolAdapterConfig } from './GlifInfinityPoolAdapter'
import { TarotPoolAdapterConfig } from './TarotPoolAdaptor'

// Union of all adapter configs
export type StakeAdapterConfig =
  | CardanoPooledKilnAdapterConfig
  | CoreumNativeSkateKitAdapterConfig
  | EthereumPooledKilnAdapterConfig
  | GlifInfinityPoolAdapterConfig
  | TarotPoolAdapterConfig

export interface StakePolicyAdapter {
  stakePolicyId: string
  fetchStakeQuote: (wallet: EdgeCurrencyWallet, requestAssetId: StakeAssetInfo, nativeAmount: string) => Promise<ChangeQuote>
  fetchUnstakeQuote: (wallet: EdgeCurrencyWallet, requestAssetId: StakeAssetInfo, nativeAmount: string) => Promise<ChangeQuote>
  fetchClaimQuote: (wallet: EdgeCurrencyWallet, requestAssetId: StakeAssetInfo, nativeAmount: string) => Promise<ChangeQuote>
  fetchUnstakeExactQuote: (wallet: EdgeCurrencyWallet, requestAssetId: StakeAssetInfo, nativeAmount: string) => Promise<ChangeQuote>
  fetchStakePosition: (wallet: EdgeCurrencyWallet) => Promise<StakePosition>
  fetchYieldInfo: () => Promise<Pick<StakePolicy, 'apy' | 'yieldType'>>
}
