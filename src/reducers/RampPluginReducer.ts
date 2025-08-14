import type { RampPlugin } from '../plugins/ramps/rampPluginTypes'
import type { Action } from '../types/reduxTypes'

export interface RampPluginState {
  readonly isLoading: boolean
  readonly plugins: Record<string, RampPlugin>
}

const initialState: RampPluginState = {
  isLoading: true,
  plugins: {}
}

export const rampPlugins = (
  state: RampPluginState = initialState,
  action: Action
): RampPluginState => {
  switch (action.type) {
    case 'RAMP_PLUGINS/LOADING_COMPLETE':
      return {
        ...state,
        isLoading: false,
        plugins: action.data.plugins
      }

    case 'LOGOUT':
      return initialState

    default:
      return state
  }
}
