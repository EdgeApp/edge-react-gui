import type { ThunkAction } from '../types/reduxTypes'
import { asHoudiniChains } from '../util/houdiniChains'
import { infoServerData } from '../util/network'

/**
 * Loads the chains and assets Houdini can route, which the info server polls
 * from Houdini and serves as `houdiniAssets`.
 */
export function updateHoudiniChains(): ThunkAction<Promise<void>> {
  return async (dispatch, getState) => {
    try {
      // Read the field from the RAW rollup with our own cleaner, the way
      // `giftCardInfo` is read. `asHoudiniChains` drops a malformed chain and
      // keeps the others, where the rollup's cleaner would reject them all.
      const rollup = infoServerData.rollupRaw as
        { houdiniAssets?: unknown } | undefined
      // The server omits the field until its first complete fetch, and before
      // the rollup loads there is no field either. Both mean no chains, which
      // keeps Stealth hidden:
      const data = asHoudiniChains(rollup?.houdiniAssets ?? {})
      // Once a list has loaded, a rollup without one keeps the last list.
      // Dropping it would end an armed swap-send mid-entry and leave its
      // address on a plain send of the source asset:
      if (data.size === 0 && getState().ui.houdiniChains.size > 0) return
      dispatch({ type: 'UPDATE_HOUDINI_CHAINS', data })
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e)
      console.warn(`Failed to get info server houdiniAssets: ${message}`)
    }
  }
}
