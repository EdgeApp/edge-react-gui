import {
  asBoolean,
  asCodec,
  asMaybe,
  asNumber,
  asObject,
  asOptional,
  asString,
  asTuple,
  asValue,
  Cleaner
} from 'cleaners'
import { EdgeAddress } from 'edge-core-js/types'
import type { BalanceEvent } from 'zcash-native'

import { asWalletInfo } from '../common/types'

type ZcashNetworkName = 'mainnet' | 'testnet'

export interface ZcashNetworkInfo {
  rpcNode: {
    networkName: ZcashNetworkName
    defaultHost: string
    defaultPort: number
  }
  defaultNetworkFee: string
}

const asCachedEdgeAddresses = asTuple<EdgeAddress[]>(
  asObject({
    addressType: asValue('unifiedAddress'),
    publicAddress: asString
  }),
  asObject({
    addressType: asValue('saplingAddress'),
    publicAddress: asString
  }),
  asObject({
    addressType: asValue('transparentAddress'),
    publicAddress: asString
  })
)
export type CachedEdgeAddresses = ReturnType<typeof asCachedEdgeAddresses>

export const asZcashWalletOtherData = asObject({
  cachedAddresses: asMaybe(asCachedEdgeAddresses),
  isSdkInitializedOnDisk: asMaybe(asBoolean, false)
})

export type ZcashWalletOtherData = ReturnType<typeof asZcashWalletOtherData>

export type ZcashBalances = Omit<
  BalanceEvent,
  'availableZatoshi' | 'totalZatoshi'
>

export const asZecPublicKey = asObject({
  birthdayHeight: asNumber,
  publicKey: asString
})

export type SafeZcashWalletInfo = ReturnType<typeof asSafeZcashWalletInfo>
export const asSafeZcashWalletInfo = asWalletInfo(asZecPublicKey)

export interface ZcashPrivateKeys {
  mnemonic: string
  birthdayHeight: number
}
export const asZcashPrivateKeys = (
  pluginId: string
): Cleaner<ZcashPrivateKeys> => {
  const asKeys = asObject({
    [`${pluginId}Mnemonic`]: asString,
    [`${pluginId}BirthdayHeight`]: asNumber
  })

  return asCodec(
    raw => {
      const clean = asKeys(raw)
      return {
        mnemonic: clean[`${pluginId}Mnemonic`] as string,
        birthdayHeight: clean[`${pluginId}BirthdayHeight`] as number
      }
    },
    clean => {
      return {
        [`${pluginId}Mnemonic`]: clean.mnemonic,
        [`${pluginId}BirthdayHeight`]: clean.birthdayHeight
      }
    }
  )
}

//
// Info Payload
//

export const asZcashInfoPayload = asObject({
  rpcNode: asOptional(
    asObject({
      networkName: asValue('mainnet', 'testnet'),
      defaultHost: asString,
      defaultPort: asNumber
    })
  )
})
export type ZcashInfoPayload = ReturnType<typeof asZcashInfoPayload>

//
// Orchard -> Ironwood migration (engine-level shape, consumed by the GUI
// through wallet.otherMethods — kept independent of the SDK's enums so SDK
// churn doesn't ripple into the GUI).
//

export const asZcashMigrationStatus = asObject({
  /**
   * notNeeded: nothing to offer (no meaningful Orchard funds, pre-activation,
   *   not yet synced, or a guided run owns the funds) — show nothing.
   * required: a sweep is worthwhile — offer it. Recommended, not mandatory:
   *   Orchard stays spendable and drains passively through ordinary spends.
   * scheduled: reserved for the guided (v2) migration lifecycle.
   * complete: everything migrated (guided-run terminal state).
   * error: reserved for the guided (v2) migration lifecycle.
   */
  state: asValue('notNeeded', 'required', 'scheduled', 'complete', 'error'),
  completedTransfers: asMaybe(asNumber, 0),
  totalTransfers: asMaybe(asNumber, 0),
  remainingOrchardZatoshi: asMaybe(asString, '0'),
  hasOverdueTransfers: asMaybe(asBoolean, false),
  isSynced: asMaybe(asBoolean, false),
  /** Height after which the next pre-signed transfer becomes executable. */
  nextTransferReadyAtHeight: asOptional(asNumber)
})
export type ZcashMigrationStatus = ReturnType<typeof asZcashMigrationStatus>
