// @flow
import type {State, Dispatch} from './ReduxTypes'

import * as SETTINGS_SELECTORS from './UI/Settings/selectors'
import {logoutRequest} from './Login/action'

import {connect} from 'react-redux'
import Main from './Main.ui'

import {addExchangeTimer} from  './UI/Settings/action'
import {setKeyboardHeight} from './UI/dimensions/action'
import {addContext} from './Core/Context/action.js'
import {addCurrencyPlugin} from './UI/Settings/action.js'
import {addUsernames} from './Core/Context/action'
import {setLocaleInfo} from './UI/locale/action'
import {enableScan, disableScan} from './UI/scenes/Scan/action'

import makeContextCallbacks from './Core/Context/callbacks'

const mapStateToProps = (state: State) => ({
  routes: state.routes,
  autoLogoutTimeInSeconds: SETTINGS_SELECTORS.getAutoLogoutTimeInSeconds(state)
})
const mapDispatchToProps = (dispatch: Dispatch) => ({
  dispatchEnableScan: () => {
    return dispatch(enableScan())
  },
  dispatchDisableScan: () => {
    return dispatch(disableScan())
  },
  addExchangeTimer: () => dispatch(addExchangeTimer()),
  addCurrencyPlugin: (plugin) => dispatch(addCurrencyPlugin(plugin)),
  setKeyboardHeight: (keyboardHeight) => dispatch(setKeyboardHeight(keyboardHeight)),
  addContext: (context) => dispatch(addContext(context)),
  addUsernames: (usernames) => dispatch(addUsernames(usernames)),
  setLocaleInfo: (localeInfo) => dispatch(setLocaleInfo(localeInfo)),
  autoLogout: () => dispatch(logoutRequest()),
  contextCallbacks: makeContextCallbacks(dispatch)
})

export default connect(mapStateToProps, mapDispatchToProps)(Main)
