// @flow

import {connect} from 'react-redux'

import type {Dispatch} from './ReduxTypes'
import Main from './Main.ui'

import {addCurrencyPlugin} from './UI/Settings/action'
import {setKeyboardHeight} from './UI/dimensions/action'
import {addContext, addUsernames} from './Core/Context/action.js'
import {enableScan, disableScan} from './UI/scenes/Scan/action'
import * as actions from '../actions/indexActions'
import {requestPermission} from '../reducers/permissions/actions.js'

import makeContextCallbacks from './Core/Context/callbacks'

const mapStateToProps = () => ({})
const mapDispatchToProps = (dispatch: Dispatch) => ({
  requestPermission: (permission) => {
    return dispatch(requestPermission(permission))
  },
  dispatchEnableScan: () => {
    return dispatch(enableScan())
  },
  dispatchDisableScan: () => {
    return dispatch(disableScan())
  },
  addCurrencyPlugin: (plugin) => {
    return dispatch(addCurrencyPlugin(plugin))
  },
  setKeyboardHeight: (keyboardHeight) => {
    return dispatch(setKeyboardHeight(keyboardHeight))
  },
  addContext: (context) => {
    return dispatch(addContext(context))
  },
  addUsernames: (usernames) => {
    return dispatch(addUsernames(usernames))
  },
  // commented out since it was blowing up flow && doesnt seem to be called.. TODO remove
  /* setLocaleInfo: (localeInfo) => {
    return dispatch(setLocaleInfo(localeInfo))
  }, */
  urlReceived: (backupKey) => {
    return dispatch(actions.deepLinkLogout(backupKey))
  },
  contextCallbacks: makeContextCallbacks(dispatch)
})
export default connect(mapStateToProps, mapDispatchToProps)(Main)
