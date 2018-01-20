// @flow

import {connect} from 'react-redux'

import CustomFeesModal from './CustomFeesModal.ui'
import * as Constants from '../../../../../../constants/indexConstants.js'
import type {Dispatch, GetState, State} from '../../../../../ReduxTypes'
import {
  VISIBLE_MODAL_NAME,
  CLOSE_MODAL_VALUE,
  START_MODAL_VALUE,
  SUCCESS_MODAL_VALUE,
  wrap
} from '../../../WalletList/components/WalletOptions/action'

import * as CORE_SELECTORS from '../../../../../Core/selectors.js'
import * as ACCOUNT_API from '../../../../../Core/Account/api.js'
import * as UI_SELECTORS from '../../../../selectors.js'
import { changeFee } from '../../../../scenes/SendConfirmation/action'

const mapStateToProps = (state: State) => {
  const selectedWalletId = UI_SELECTORS.getSelectedWalletId(state)
  let customFeeSettings = []
  if (selectedWalletId) {
    let currencyInfo = null
    const wallet = CORE_SELECTORS.getWallet(state, selectedWalletId)
    if (wallet) currencyInfo = wallet.currencyInfo
    if (
      currencyInfo &&
      currencyInfo.defaultSettings &&
      Array.isArray(currencyInfo.defaultSettings.customFeeSettings)
    ) {
      customFeeSettings = currencyInfo.defaultSettings.customFeeSettings
    }
  }
  return ({
    customFeeSettings: customFeeSettings,
    visibilityBoolean: state.ui.scenes.walletList[VISIBLE_MODAL_NAME(Constants.CUSTOM_FEES)]
  })
}

const mapDispatchToProps = (dispatch: Dispatch) => ({
  onExitButtonFxn: () => dispatch({ type: CLOSE_MODAL_VALUE(Constants.CUSTOM_FEES) }),
  onNegative: () => {},
  onPositive: (customFees) => dispatch(changeFee('custom', customFees)),
  onDone: () => dispatch({type: CLOSE_MODAL_VALUE(Constants.CUSTOM_FEES)})
})

export default connect(mapStateToProps, mapDispatchToProps)(CustomFeesModal)
