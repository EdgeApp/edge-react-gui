import { Middleware } from 'redux'

import { Dispatch, RootState } from '../../types/reduxTypes'

export const loginStatusChecker: Middleware<{}, RootState, Dispatch> = store => next => action => {
  const state = store.getState()
  const { settingsLoaded } = state.ui.settings

  // Once we un-load our settings, ban all actions except logout:
  if (settingsLoaded === false && action.type !== 'LOGOUT') return action

  return next(action)
}
