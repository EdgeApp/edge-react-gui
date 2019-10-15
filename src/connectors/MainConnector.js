// @flow

import { connect } from 'react-redux'

import { checkEnabledExchanges } from '../actions/CryptoExchangeActions.js'
import * as actions from '../actions/indexActions'
import { checkAndShowGetCryptoModal } from '../actions/ScanActions.js'
import { openDrawer } from '../actions/ScenesActions.js'
import { showReEnableOtpModal } from '../actions/SettingsActions.js'
import { selectWallet } from '../actions/WalletActions.js'
import Main from '../components/Main.ui'
import { requestPermission } from '../modules/PermissionsManager.js'
import type { Dispatch } from '../types/reduxTypes.js'

const mapStateToProps = () => ({})
const mapDispatchToProps = (dispatch: Dispatch) => ({
  hideWalletListModal () {
    return dispatch({ type: 'DISABLE_WALLET_LIST_MODAL_VISIBILITY' })
  },
  requestPermission: permission => {
    return requestPermission(permission)
  },
  dispatchEnableScan: () => {
    return dispatch({ type: 'ENABLE_SCAN' })
  },
  dispatchDisableScan: () => {
    return dispatch({ type: 'DISABLE_SCAN' })
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
  checkAndShowGetCryptoModal: (routeData: string) => {
    if (routeData === 'sweepPrivateKey') {
      return null
    }
    dispatch(checkAndShowGetCryptoModal())
  },
  logout: (username?: string) => dispatch(actions.logoutRequest(username)),
  turnOnDeveloperMode: () => dispatch({ type: 'DEVELOPER_MODE_ON' }),
  turnOffDeveloperMode: () => dispatch({ type: 'DEVELOPER_MODE_OFF' })
})
export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Main)
