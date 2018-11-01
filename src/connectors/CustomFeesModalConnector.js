// @flow

import _ from 'lodash'
import { Actions } from 'react-native-router-flux'
import { connect } from 'react-redux'

import { updateMiningFees } from '../actions/SendConfirmationActions'
import CustomFeesModal from '../components/modals/CustomFeesModal'
import type { CustomFees, CustomFeesModalDispatchProps, CustomFeesModalOwnProps, CustomFeesModalStateProps } from '../components/modals/CustomFeesModal'
import * as Constants from '../constants/indexConstants.js'
import type { Dispatch, State } from '../modules/ReduxTypes'
import { getCustomNetworkFee } from '../modules/UI/scenes/SendConfirmation/selectors.js'

const mapStateToProps = (state: State, ownProps: CustomFeesModalOwnProps): CustomFeesModalStateProps => {
  const wallet = ownProps.sourceWallet
  let customFeeSettings: Array<string> = []
  if (_.has(wallet, 'currencyInfo.defaultSettings.customFeeSettings')) {
    customFeeSettings = wallet.currencyInfo.defaultSettings.customFeeSettings
  }

  return {
    customNetworkFee: getCustomNetworkFee(state),
    customFeeSettings: customFeeSettings,
    visibilityBoolean: state.ui.scenes.changeMiningFee.isCustomFeeVisible
  }
}

const mapDispatchToProps = (dispatch: Dispatch): CustomFeesModalDispatchProps => ({
  onPositive: (customNetworkFee: CustomFees) => {
    dispatch(
      updateMiningFees({
        networkFeeOption: Constants.CUSTOM_FEES,
        customNetworkFee
      })
    )
    dispatch({ type: 'CLOSE_CUSTOM_FEES_MODAL' })
    Actions.pop()
  },
  onDone: () => dispatch({ type: 'CLOSE_CUSTOM_FEES_MODAL' })
})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(CustomFeesModal)
