import type { InfoRollup } from 'edge-info-server'

/**
 * DEV-ONLY override for the info-server ramp rollup (kept on the test-feta
 * branch for review).
 *
 * The production info rollup ships a `rampQuoteFilter` whose `$nor` list
 * contains blanket `{ rampPluginId: 'infinite' }` clauses. A `$nor` selector
 * passes a quote only when NONE of its clauses match, so those blanket clauses
 * block EVERY Infinite quote at the remote-filter layer in
 * `validateRampConstraintParams` (see rampConstraints.ts) — before the local
 * constraints ever run. The net effect is that Infinite never surfaces a quote
 * in any region or for any payment type, which is why relaxing the local ACH
 * gate alone is not enough to make Infinite ACH appear outside the US.
 *
 * This override rewrites the fetched rollup so the remote filter no longer
 * blocks Infinite: it strips the Infinite-targeting clauses from `$nor` and
 * leaves every other clause (e.g. moonpay buy/ach, paybis sell rules) intact.
 * Infinite ACH is then gated solely by Infinite's own `checkSupport` (its
 * /countries API, which already covers non-US regions such as FR and GB via EU
 * member states) plus the local rampConstraints. This mirrors the backend
 * change of "enable Infinite in the rollup".
 *
 * To restore the unmodified production rollup, set
 * `INFO_ROLLUP_DEV_OVERRIDE_ENABLED` to false, or delete this file and its call
 * site in util/network.ts.
 */
export const INFO_ROLLUP_DEV_OVERRIDE_ENABLED = true

/** Ramp plugin whose remote rollup block we strip for local development. */
const UNBLOCKED_RAMP_PLUGIN_ID = 'infinite'

/**
 * Minimal view of the `rampQuoteFilter` shape we manipulate. The rollup cleaner
 * types this loosely as a map of Mango selectors, but at runtime it is a single
 * selector that uses a top-level `$nor` array, so we narrow to that here.
 */
interface NorRampQuoteFilter {
  $nor?: Array<{ rampPluginId?: string; [key: string]: unknown }>
  [key: string]: unknown
}

/**
 * Returns a copy of the rollup with the dev override applied, or the original
 * rollup unchanged when the override is disabled, there is no filter, or there
 * is nothing to strip.
 */
export const applyInfoRollupDevOverride = (
  rollup: InfoRollup | undefined
): InfoRollup | undefined => {
  if (!INFO_ROLLUP_DEV_OVERRIDE_ENABLED || rollup?.rampQuoteFilter == null) {
    return rollup
  }

  const filter = rollup.rampQuoteFilter as unknown as NorRampQuoteFilter
  const norClauses = filter.$nor
  if (!Array.isArray(norClauses)) {
    return rollup
  }

  const nextNor = norClauses.filter(
    clause => clause?.rampPluginId !== UNBLOCKED_RAMP_PLUGIN_ID
  )
  if (nextNor.length === norClauses.length) {
    // No Infinite clauses to strip; leave the rollup untouched.
    return rollup
  }

  return {
    ...rollup,
    rampQuoteFilter: {
      ...filter,
      $nor: nextNor
    } as unknown as InfoRollup['rampQuoteFilter']
  }
}
