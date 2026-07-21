import {
  asBoolean,
  asMaybe,
  asNumber,
  asObject,
  asOptional,
  asString,
  asValue
} from 'cleaners'
import type { EdgeCurrencyWallet } from 'edge-core-js'

//
// Typed access to the Zcash engine's Orchard -> Ironwood migration surface
// (edge-currency-accountbased exposes it through wallet.otherMethods, which is
// untyped). Cleaners mirror the engine's shapes.
//
// v1 is detection-only: 'required' means a sweep is worthwhile (recommended,
// not mandatory — Orchard stays spendable post-fork and drains passively
// through ordinary spends). The GUI answers it with a prefilled max
// send-to-self through the regular send scene. The 'scheduled'/'error' states
// belong to the guided (v2) migration lifecycle and are dormant in v1.
//

export const asZcashMigrationStatus = asObject({
  state: asValue('notNeeded', 'required', 'scheduled', 'complete', 'error'),
  completedTransfers: asMaybe(asNumber, 0),
  totalTransfers: asMaybe(asNumber, 0),
  remainingOrchardZatoshi: asMaybe(asString, '0'),
  hasOverdueTransfers: asMaybe(asBoolean, false),
  isSynced: asMaybe(asBoolean, false),
  nextTransferReadyAtHeight: asOptional(asNumber)
})
export type ZcashMigrationStatus = ReturnType<typeof asZcashMigrationStatus>

// Both platforms implement the migration surface against their respective
// zcash SDKs, so there is no platform gate: an accountbased build without the
// method is the only case that needs excluding.
const isMigrationCapable = (wallet: EdgeCurrencyWallet): boolean =>
  wallet.currencyInfo.pluginId === 'zcash' &&
  typeof wallet.otherMethods.getMigrationStatus === 'function'

/**
 * The wallet's migration status, or undefined when the wallet is not a
 * migration-capable Zcash wallet (wrong plugin, old accountbased build) or the
 * engine call fails.
 */
export async function getZcashMigrationStatus(
  wallet: EdgeCurrencyWallet
): Promise<ZcashMigrationStatus | undefined> {
  if (!isMigrationCapable(wallet)) return undefined
  try {
    return asZcashMigrationStatus(
      await wallet.otherMethods.getMigrationStatus()
    )
  } catch (error) {
    console.warn('getZcashMigrationStatus failed', error)
    return undefined
  }
}
