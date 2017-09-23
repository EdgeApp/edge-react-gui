
import * as SETTINGS_SELECTORS from '../modules/UI/Settings/selectors'

export default (store) => (next) => (action) => {
  const state = store.getState()
  const loginStatus = SETTINGS_SELECTORS.getLoginStatus(state)
  const allowedActions = [
    'LOGOUT',
    'REACT_NATIVE_ROUTER_FLUX_PUSH',
    'REACT_NATIVE_ROUTER_FLUX_FOCUS'
  ]
  return (loginStatus === false) && (!allowedActions.includes(action.type))
    ? null
    : next(action)
}
