// @flow

import {connect} from 'react-redux'
import type { State, Dispatch } from '../../../ReduxTypes'
import ChangeMiningFee from './ChangeMiningFee.ui'
import { getNetworkFeeOption } from '../SendConfirmation/selectors'
import { updateMiningFees } from '../SendConfirmation/action'

export const mapStateToProps = (state: State) => ({
  feeSetting: getNetworkFeeOption(state)
})

export const mapDispatchToProps = (dispatch: Dispatch) => ({
  onSubmit: (networkFeeOption: string) => dispatch(updateMiningFees({ networkFeeOption }))
})

export default connect(mapStateToProps, mapDispatchToProps)(ChangeMiningFee)
