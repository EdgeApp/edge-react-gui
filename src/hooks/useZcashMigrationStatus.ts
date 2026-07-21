import type { EdgeCurrencyWallet } from 'edge-core-js'
import * as React from 'react'

import {
  getZcashMigrationStatus,
  type ZcashMigrationStatus
} from '../util/zcashMigration'
import { useRefresher } from './useRefresher'

/**
 * Polls the Zcash Orchard -> Ironwood migration status for a wallet.
 * Returns undefined (forever) for anything that is not a migration-capable
 * Zcash wallet, so it is safe to call unconditionally from shared scenes.
 */
export function useZcashMigrationStatus(
  wallet: EdgeCurrencyWallet,
  delay: number = 10000
): ZcashMigrationStatus | undefined {
  const refresher = React.useCallback(
    async () => await getZcashMigrationStatus(wallet),
    [wallet]
  )
  return useRefresher(refresher, undefined, delay)
}
