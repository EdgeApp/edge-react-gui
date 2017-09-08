
import * as SETTINGS_SELECTORS from '../modules/UI/Settings/selectors'

export default (store) => (next) => (action) => {
  const state = store.getState()
  const loginStatus = SETTINGS_SELECTORS.getLoginStatus(state)
  return (loginStatus === false) && (action.type !== 'LOGOUT') ?
    null :
    next(action)
}
