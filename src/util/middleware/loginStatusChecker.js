// @flow

import { type Middleware } from 'redux'

import { type Action, type RootState } from '../../types/reduxTypes.js'

export const loginStatusChecker: Middleware<RootState, Action> = store => next => action => {
  const state = store.getState()
  const { loginStatus } = state.ui.settings

  const allowedActions = ['LOGOUT', 'REACT_NATIVE_ROUTER_FLUX_PUSH', 'REACT_NATIVE_ROUTER_FLUX_FOCUS']
  return loginStatus === false && !allowedActions.includes(action.type) ? action : next(action)
}
