import type { Action } from '../types/reduxTypes'
import type { HoudiniChains } from '../util/houdiniChains'

export const initialState: HoudiniChains = new Map()

export const houdiniChains = (
  state: HoudiniChains = initialState,
  action: Action
): HoudiniChains => {
  switch (action.type) {
    case 'UPDATE_HOUDINI_CHAINS': {
      // The served list is a mirror of Houdini's, so each non-empty load
      // replaces the last one outright. Merging would keep an asset Houdini
      // dropped. `updateHoudiniChains` never replaces a list with an empty one.
      return action.data
    }
    default:
      return state
  }
}
