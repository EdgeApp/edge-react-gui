// @flow

import {connect} from 'react-redux'
import type { State, Dispatch } from '../../../ReduxTypes'
import ChangeMiningFee from './ChangeMiningFee.ui'
import { updateMiningFees } from '../SendConfirmation/action'

export const mapStateToProps = (state: State) => ({
  feeSetting: state.cryptoExchange.feeSetting
})

export const mapDispatchToProps = (dispatch: Dispatch) => ({
  onSubmit: (networkFeeOption: string) => dispatch(updateMiningFees({ networkFeeOption }))
})

export default connect(mapStateToProps, mapDispatchToProps)(ChangeMiningFee)
