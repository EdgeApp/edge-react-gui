// @flow

import {connect} from 'react-redux'
import type {State} from '../../../ReduxTypes'
import ChangeMiningFee from './ChangeMiningFee.ui'
import { changeFee } from './action'
import { getNetworkFeeOption } from '../SendConfirmation/selectors'

export const mapStateToProps = (state: State) => ({
  feeSetting: getNetworkFeeOption(state)
})

export const mapDispatchToProps = ({
  onSubmit: changeFee
})

export default connect(mapStateToProps, mapDispatchToProps)(ChangeMiningFee)
