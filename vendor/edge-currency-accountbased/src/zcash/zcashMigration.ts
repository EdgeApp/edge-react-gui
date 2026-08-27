import { gt } from 'biggystring'
import type { EdgeSpendInfo } from 'edge-core-js/types'

import { ZcashMigrationStatus } from './zcashTypes'

/**
 * Whether a spend is the Orchard -> Ironwood sweep, which the GUI flags with
 * top-level `otherParams.ironwoodMigration` (per-target otherParams gets
 * overwritten by the send scene's address handlers).
 *
 * Such a spend ignores the caller's amount: the SDK's Orchard-only proposal
 * defines both amount and fee.
 */
export function isIronwoodMigrationSpend(
  edgeSpendInfo: EdgeSpendInfo
): boolean {
  return (edgeSpendInfo.otherParams as any)?.ironwoodMigration === true
}

/**
 * The minimum spendable Orchard balance worth prompting a sweep for: roughly
 * 2x the ZIP-317 marginal fee per logical action, so the prompt never asks
 * the user to pay a fee that rounds to their whole balance. Below it, passive
 * drain via ordinary spends still migrates the dust eventually.
 */
export const MIN_SWEEP_ZATOSHI = '10000'

/**
 * The migration status the GUI consumes.
 *
 * There is no SDK migration state to read: the sweep is one ordinary
 * transaction, so whether to offer it follows entirely from the chain having
 * reached NU6.3, the wallet being synced, and there being enough spendable
 * Orchard left to be worth a fee. Broadcasting the sweep spends those notes,
 * which withdraws the offer on its own.
 *
 * Pure, so the decision table is unit-testable.
 */
export function mapMigrationStatus(opts: {
  isSynced: boolean
  orchardAvailableZatoshi: string
  networkBlockHeight: number
  /** NU6.3 activation height, or null when unknown/unsupported. */
  activationHeight: number | null
}): ZcashMigrationStatus {
  const {
    isSynced,
    orchardAvailableZatoshi,
    networkBlockHeight,
    activationHeight
  } = opts
  const base = {
    completedTransfers: 0,
    totalTransfers: 0,
    remainingOrchardZatoshi: orchardAvailableZatoshi,
    hasOverdueTransfers: false,
    isSynced,
    nextTransferReadyAtHeight: undefined
  }

  // Pre-activation (or unknown activation) a sweep is pointless: Orchard can
  // still receive, so the funds would land right back where they started.
  if (
    activationHeight == null ||
    networkBlockHeight < activationHeight ||
    !isSynced
  ) {
    return { ...base, state: 'notNeeded' }
  }

  return {
    ...base,
    state: gt(orchardAvailableZatoshi, MIN_SWEEP_ZATOSHI)
      ? 'required'
      : 'notNeeded'
  }
}
