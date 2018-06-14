// @flow

import * as Constants from '../constants/indexConstants.js'
import type { Action, Store } from '../modules/ReduxTypes.js'
import * as SETTINGS_SELECTORS from '../modules/UI/Settings/selectors'

export default (store: Store) => (next: Function) => (action: Action) => {
  const state = store.getState()
  const loginStatus = SETTINGS_SELECTORS.getLoginStatus(state)
  const allowedActions = [Constants.LOGOUT, 'REACT_NATIVE_ROUTER_FLUX_PUSH', 'REACT_NATIVE_ROUTER_FLUX_FOCUS']
  return loginStatus === false && !allowedActions.includes(action.type) ? null : next(action)
}
