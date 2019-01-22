// @flow

import { connect } from 'react-redux'

import { checkEnabledExchanges } from '../actions/CryptoExchangeActions.js'
import { setKeyboardHeight } from '../actions/DimensionsActions.js'
import * as actions from '../actions/indexActions'
import { checkAndShowGetCryptoModal } from '../actions/ScanActions.js'
import { openDrawer, updateCurrentSceneKey } from '../actions/ScenesActions.js'
import { showReEnableOtpModal } from '../actions/SettingsActions.js'
import { selectWallet } from '../actions/WalletActions.js'
import Main from '../components/Main.ui'
import { addContext, addUsernames } from '../modules/Core/Context/action.js'
import { requestPermission } from '../modules/PermissionsManager.js'
import type { Dispatch } from '../modules/ReduxTypes'
import { addCurrencyPlugin } from '../modules/Settings/SettingsActions'

const mapStateToProps = () => ({})
const mapDispatchToProps = (dispatch: Dispatch) => ({
  requestPermission: permission => {
    return requestPermission(permission)
  },
  dispatchEnableScan: () => {
    return dispatch({ type: 'ENABLE_SCAN' })
  },
  dispatchDisableScan: () => {
    return dispatch({ type: 'DISABLE_SCAN' })
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
  onSelectWallet: (walletId, currencyCode) => dispatch(selectWallet(walletId, currencyCode)),
  showReEnableOtpModal: () => dispatch(showReEnableOtpModal()),
  openDrawer: () => dispatch(openDrawer()),
  checkEnabledExchanges: () => {
    dispatch(checkEnabledExchanges())
  },
  dispatchAddressDeepLinkReceived: addressDeepLinkData =>
    dispatch({
      type: 'ADDRESS_DEEP_LINK_RECEIVED',
      data: addressDeepLinkData
    }),
  checkAndShowGetCryptoModal: () => dispatch(checkAndShowGetCryptoModal())
})
export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Main)
