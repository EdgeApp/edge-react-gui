import { Middleware } from 'redux'

import { Action, RootState } from '../../types/reduxTypes'

export const loginStatusChecker: Middleware<RootState, Action> = store => next => action => {
  const state = store.getState()
  // @ts-expect-error
  const { loginStatus } = state.ui.settings

  const allowedActions = ['LOGOUT', 'REACT_NATIVE_ROUTER_FLUX_PUSH', 'REACT_NATIVE_ROUTER_FLUX_FOCUS']
  return loginStatus === false && !allowedActions.includes(action.type) ? action : next(action)
}
