// @flow

import _ from 'lodash'
import { Actions } from 'react-native-router-flux'
import { connect } from 'react-redux'

import * as Constants from '../../../../../../constants/indexConstants.js'
import type { Dispatch, State } from '../../../../../ReduxTypes'
import { updateMiningFees } from '../../../SendConfirmation/action'
import { CLOSE_MODAL_VALUE } from '../../../WalletList/components/WalletOptions/action'
import CustomFeesModal from './CustomFeesModal.ui'
import type { CustomFees, CustomFeesModalOwnProps } from './CustomFeesModal.ui'

const mapStateToProps = (state: State, ownProps: CustomFeesModalOwnProps) => {
  const wallet = ownProps.sourceWallet
  let customFeeSettings = []
  if (_.has(wallet, 'currencyInfo.defaultSettings.customFeeSettings')) {
    customFeeSettings = wallet.currencyInfo.defaultSettings.customFeeSettings
  }
  return {
    customFeeSettings: customFeeSettings,
    visibilityBoolean: state.ui.scenes.changeMiningFee.isCustomFeeVisible
  }
}

const mapDispatchToProps = (dispatch: Dispatch) => ({
  onPositive: (customNetworkFee: CustomFees) => {
    dispatch(
      updateMiningFees({
        networkFeeOption: Constants.CUSTOM_FEES,
        customNetworkFee
      })
    )
    dispatch({ type: CLOSE_MODAL_VALUE(Constants.CUSTOM_FEES) })
    Actions.pop()
  },
  onDone: () => dispatch({ type: CLOSE_MODAL_VALUE(Constants.CUSTOM_FEES) })
})

export default connect(mapStateToProps, mapDispatchToProps)(CustomFeesModal)
