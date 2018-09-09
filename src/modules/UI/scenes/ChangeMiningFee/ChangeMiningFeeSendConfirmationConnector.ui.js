// @flow

import { connect } from 'react-redux'

import type { Dispatch, State } from '../../../ReduxTypes'
import { updateMiningFees } from '../SendConfirmation/action'
import { getNetworkFeeOption } from '../SendConfirmation/selectors'
import ChangeMiningFee from './ChangeMiningFee.ui.js'
import type { ChangeMiningFeeDispatchProps, ChangeMiningFeeStateProps } from './ChangeMiningFee.ui.js'

export const mapStateToProps = (state: State): ChangeMiningFeeStateProps => ({
  // fee: state.ui.scenes.sendConfirmation.fee,
  feeSetting: getNetworkFeeOption(state)
})

export const mapDispatchToProps = (dispatch: Dispatch): ChangeMiningFeeDispatchProps => ({
  onSubmit: (networkFeeOption: string) => dispatch(updateMiningFees({ networkFeeOption }))
})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ChangeMiningFee)
