import type { EdgeCurrencyWallet } from 'edge-core-js'

import type {
  ChangeQuote,
  StakeAssetInfo,
  StakePolicy,
  StakePosition
} from '../../types'
import type { CardanoPooledKilnAdapterConfig } from './CardanoKilnAdaptor'
import type { CoreumNativeStakeKitAdapterConfig } from './CoreumStakeKitAdaptor'
import type { EthereumPooledKilnAdapterConfig } from './EthereumKilnAdaptor'
import type { GlifInfinityPoolAdapterConfig } from './GlifInfinityPoolAdapter'
import type { TarotPoolAdapterConfig } from './TarotPoolAdaptor'
import type { ThorchainYieldAdapterConfig } from './ThorchainYieldAdaptor'

// Union of all adapter configs
export type StakeAdapterConfig =
  | CardanoPooledKilnAdapterConfig
  | CoreumNativeStakeKitAdapterConfig
  | EthereumPooledKilnAdapterConfig
  | GlifInfinityPoolAdapterConfig
  | TarotPoolAdapterConfig
  | ThorchainYieldAdapterConfig

export interface StakePolicyAdapter {
  stakePolicyId: string
  fetchStakeQuote: (
    wallet: EdgeCurrencyWallet,
    requestAssetId: StakeAssetInfo,
    nativeAmount: string
  ) => Promise<ChangeQuote>
  fetchUnstakeQuote: (
    wallet: EdgeCurrencyWallet,
    requestAssetId: StakeAssetInfo,
    nativeAmount: string
  ) => Promise<ChangeQuote>
  fetchClaimQuote: (
    wallet: EdgeCurrencyWallet,
    requestAssetId: StakeAssetInfo,
    nativeAmount: string
  ) => Promise<ChangeQuote>
  fetchUnstakeExactQuote: (
    wallet: EdgeCurrencyWallet,
    requestAssetId: StakeAssetInfo,
    nativeAmount: string
  ) => Promise<ChangeQuote>
  fetchStakePosition: (wallet: EdgeCurrencyWallet) => Promise<StakePosition>
  fetchYieldInfo: () => Promise<Pick<StakePolicy, 'apy' | 'yieldType'>>
}
