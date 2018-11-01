// @flow

import { connect } from 'react-redux'

import { updateMiningFees } from '../../actions/SendConfirmationActions'
import ChangeMiningFee from '../../components/scenes/ChangeMiningFeeScene.js'
import type { ChangeMiningFeeDispatchProps, ChangeMiningFeeStateProps } from '../../components/scenes/ChangeMiningFeeScene.js'
import type { Dispatch, State } from '../../modules/ReduxTypes'
import { getNetworkFeeOption } from '../../modules/UI/scenes/SendConfirmation/selectors'

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
