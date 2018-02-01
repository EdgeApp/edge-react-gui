// @flow

import {connect} from 'react-redux'
import type {State, Dispatch} from '../../../ReduxTypes'
import ChangeMiningFee, {
  type ChangeMiningFeeStateProps,
  type ChangeMiningFeeDispatchProps
} from './ChangeMiningFee.ui.js'
import { getNetworkFeeOption } from '../SendConfirmation/selectors'
import { updateMiningFees } from '../SendConfirmation/action'

export const mapStateToProps = (state: State): ChangeMiningFeeStateProps => ({
  // fee: state.ui.scenes.sendConfirmation.fee,
  feeSetting: getNetworkFeeOption(state)})

export const mapDispatchToProps = (dispatch: Dispatch): ChangeMiningFeeDispatchProps => ({
  onSubmit: (networkFeeOption: string) => dispatch(updateMiningFees({ networkFeeOption }))
})

export default connect(mapStateToProps, mapDispatchToProps)(ChangeMiningFee)
