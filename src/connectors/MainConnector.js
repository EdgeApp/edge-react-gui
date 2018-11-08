// @flow

import { connect } from 'react-redux'

import { checkEnabledExchanges, getShapeShiftTokens } from '../actions/CryptoExchangeActions.js'
import { setKeyboardHeight } from '../actions/DimensionsActions.js'
import * as actions from '../actions/indexActions'
import { disableScan, enableScan } from '../actions/ScanActions'
import { openDawer, updateCurrentSceneKey } from '../actions/ScenesActions.js'
import { showReEnableOtpModal } from '../actions/SettingsActions.js'
import { selectWallet } from '../actions/WalletActions.js'
import Main from '../components/Main.ui'
import { addContext, addUsernames } from '../modules/Core/Context/action.js'
import makeContextCallbacks from '../modules/Core/Context/callbacks'
import { requestPermission } from '../modules/PermissionsManager.js'
import type { Dispatch } from '../modules/ReduxTypes'
import { addCurrencyPlugin } from '../modules/Settings/SettingsActions'

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
  showReEnableOtpModal: () => dispatch(showReEnableOtpModal()),
  openDrawer: () => dispatch(openDawer()),
  checkEnabledExchanges: () => {
    dispatch(checkEnabledExchanges())
    dispatch(getShapeShiftTokens())
  }
})
export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Main)
