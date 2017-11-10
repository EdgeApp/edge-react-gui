// @flow

import {connect} from 'react-redux'
import type {State} from '../../../ReduxTypes'
import ChangeMiningFee from './ChangeMiningFee.ui'
import { changeFee } from '../../../../modules/UI/scenes/SendConfirmation/action'

export const mapStateToProps = (state: State) => ({
  // fee: state.ui.scenes.sendConfirmation.fee,
  feeSetting: state.ui.scenes.sendConfirmation.feeSetting,
})

export const mapDispatchToProps = ({
  onSubmit: changeFee
})

export default connect(mapStateToProps, mapDispatchToProps)(ChangeMiningFee)
