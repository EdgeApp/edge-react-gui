import type { ThunkAction } from '../types/reduxTypes'
import { asHoudiniTokens } from '../util/houdiniChains'
import { infoServerData } from '../util/network'

/**
 * Loads the tokens Houdini can route, which the info server polls from
 * Houdini and serves as `houdiniTokens`.
 */
export function updateHoudiniTokens(): ThunkAction<Promise<void>> {
  return async dispatch => {
    try {
      // Read the field from the RAW rollup with our own cleaner, the way
      // `giftCardInfo` is read, so this does not wait on an `edge-info-server`
      // release whose `asInfoRollup` knows the field.
      const rollup = infoServerData.rollupRaw as
        | { houdiniTokens?: unknown }
        | undefined
      // The server omits the field until its first complete fetch, and before
      // the rollup loads there is no field either. Both mean no tokens:
      const data = asHoudiniTokens(rollup?.houdiniTokens ?? {})
      dispatch({ type: 'UPDATE_HOUDINI_TOKENS', data })
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e)
      console.warn(`Failed to get info server houdiniTokens: ${message}`)
    }
  }
}
