// @flow

import { connect } from 'react-redux'

import * as actions from '../actions/indexActions'
import { addContext, addUsernames } from './Core/Context/action.js'
import makeContextCallbacks from './Core/Context/callbacks'
import Main from './Main.ui'
import { requestPermission } from './PermissionsManager.js'
import type { Dispatch } from './ReduxTypes'
import { setKeyboardHeight } from './UI/dimensions/action'
import { updateCurrentSceneKey } from './UI/scenes/action.js'
import { disableScan, enableScan } from './UI/scenes/Scan/action'
import { showReEnableOtpModal } from './UI/scenes/Settings/action.js'
import { addCurrencyPlugin } from './UI/Settings/action'
import { selectWallet } from './UI/Wallets/action.js'

const mapStateToProps = () => ({})
const mapDispatchToProps = (dispatch: Dispatch) => ({
  requestPermission: permission => {
    return requestPermission(permission)
  },
  dispatchEnableScan: () => {
    return dispatch(enableScan())
  },
  dispatchDisableScan: () => {
    return dispatch(disableScan())
  },
  addCurrencyPlugin: plugin => {
    return dispatch(addCurrencyPlugin(plugin))
  },
  setKeyboardHeight: keyboardHeight => {
    return dispatch(setKeyboardHeight(keyboardHeight))
  },
  addContext: (context, folder) => {
    return dispatch(addContext(context, folder))
  },
  addUsernames: usernames => {
    return dispatch(addUsernames(usernames))
  },
  updateCurrentSceneKey: sceneKey => {
    return dispatch(updateCurrentSceneKey(sceneKey))
  },
  // commented out since it was blowing up flow && doesnt seem to be called.. TODO remove
  /* setLocaleInfo: (localeInfo) => {
    return dispatch(setLocaleInfo(localeInfo))
  }, */
  urlReceived: backupKey => {
    return dispatch(actions.deepLinkLogout(backupKey))
  },
  contextCallbacks: makeContextCallbacks(dispatch),
  onSelectWallet: (walletId, currencyCode) => dispatch(selectWallet(walletId, currencyCode)),
  showReEnableOtpModal: () => dispatch(showReEnableOtpModal())
})
export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Main)
