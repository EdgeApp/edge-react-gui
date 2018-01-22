// @flow

import {connect} from 'react-redux'
import type {State} from '../../../ReduxTypes'
import ChangeMiningFee, {
  type ChangeMiningFeeStateProps,
  type ChangeMiningFeeDispatchProps
} from './ChangeMiningFee.ui.js'
import { changeFee } from '../../../../modules/UI/scenes/SendConfirmation/action'

export const mapStateToProps = (state: State): ChangeMiningFeeStateProps => ({
  // fee: state.ui.scenes.sendConfirmation.fee,
  feeSetting: state.ui.scenes.sendConfirmation.feeSetting
})

export const mapDispatchToProps = (dispatch: Dispatch): ChangeMiningFeeDispatchProps => ({
  onSubmit: changeFee
})

export default connect(mapStateToProps, mapDispatchToProps)(ChangeMiningFee)
