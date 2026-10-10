import type { Action } from '../types/reduxTypes'
import type { HoudiniTokens } from '../util/houdiniChains'

export const initialState: HoudiniTokens = {}

export const houdiniTokens = (
  state: HoudiniTokens = initialState,
  action: Action
): HoudiniTokens => {
  switch (action.type) {
    case 'UPDATE_HOUDINI_TOKENS': {
      // The served list is a mirror of Houdini's, so each load replaces the
      // last one outright. Merging would keep a token Houdini dropped.
      return action.data
    }
    default:
      return state
  }
}
