// @flow

import {connect} from 'react-redux'
import { Actions } from 'react-native-router-flux'
import _ from 'lodash'
import CustomFeesModal from './CustomFeesModal.ui'
import * as Constants from '../../../../../../constants/indexConstants.js'
import type {Dispatch, State} from '../../../../../ReduxTypes'
import {
  VISIBLE_MODAL_NAME,
  CLOSE_MODAL_VALUE
} from '../../../WalletList/components/WalletOptions/action'

import * as CORE_SELECTORS from '../../../../../Core/selectors.js'
import * as UI_SELECTORS from '../../../../selectors.js'
import { changeFee } from '../../action'

const mapStateToProps = (state: State) => {
  const selectedWalletId = UI_SELECTORS.getSelectedWalletId(state)
  const wallet = CORE_SELECTORS.getWallet(state, selectedWalletId)
  let customFeeSettings = []
  if (_.has(wallet, 'currencyInfo.defaultSettings.customFeeSettings')) {
    customFeeSettings = wallet.currencyInfo.defaultSettings.customFeeSettings
  }
  return ({
    customFeeSettings: customFeeSettings,
    visibilityBoolean: state.ui.scenes.walletList[VISIBLE_MODAL_NAME(Constants.CUSTOM_FEES)]
  })
}

const mapDispatchToProps = (dispatch: Dispatch) => ({
  onPositive: (customFees: any) => {
    dispatch(changeFee('custom', customFees))
    dispatch({type: CLOSE_MODAL_VALUE(Constants.CUSTOM_FEES)})
    Actions.pop()
  },
  onDone: () => dispatch({type: CLOSE_MODAL_VALUE(Constants.CUSTOM_FEES)})
})

export default connect(mapStateToProps, mapDispatchToProps)(CustomFeesModal)
