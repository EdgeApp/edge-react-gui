// @flow

import _ from 'lodash'
import { Actions } from 'react-native-router-flux'
import { connect } from 'react-redux'

import { sendConfirmationUpdateTx } from '../../actions/SendConfirmationActions'
import type { CustomFees } from '../../components/modals/CustomFeesModal.js'
import ChangeMiningFee from '../../components/scenes/ChangeMiningFeeScene.js'
import type { ChangeMiningFeeDispatchProps, ChangeMiningFeeOwnProps, ChangeMiningFeeStateProps } from '../../components/scenes/ChangeMiningFeeScene.js'
import * as Constants from '../../constants/indexConstants.js'
import { getCustomNetworkFee, getNetworkFeeOption } from '../../modules/UI/scenes/SendConfirmation/selectors'
import type { Dispatch, State } from '../../types/reduxTypes.js'

export const mapStateToProps = (state: State, ownProps: ChangeMiningFeeOwnProps): ChangeMiningFeeStateProps => {
  const wallet = ownProps.sourceWallet
  let customFeeSettings: Array<string> = []
  if (_.has(wallet, 'currencyInfo.defaultSettings.customFeeSettings')) {
    customFeeSettings = wallet.currencyInfo.defaultSettings.customFeeSettings
  }
  const hideCustomFeeOption = !!Constants.getSpecialCurrencyInfo(wallet.currencyInfo.currencyCode).noCustomMiningFee
  return {
    customNetworkFee: getCustomNetworkFee(state),
    customFeeSettings: customFeeSettings,
    // fee: state.ui.scenes.sendConfirmation.fee,
    feeSetting: getNetworkFeeOption(state),
    hideCustomFeeOption
  }
}

export const mapDispatchToProps = (dispatch: Dispatch): ChangeMiningFeeDispatchProps => ({
  onSubmit: (networkFeeOption: string) => dispatch(sendConfirmationUpdateTx({ networkFeeOption })),
  onSubmitCustomFee: (customNetworkFee: CustomFees) => {
    dispatch(
      sendConfirmationUpdateTx({
        networkFeeOption: Constants.CUSTOM_FEES,
        customNetworkFee
      })
    )
    Actions.pop()
  }
})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ChangeMiningFee)
