// @flow

import {connect} from 'react-redux'
import type {State} from '../../../ReduxTypes'
import ChangeMiningFee, {
  type ChangeMiningFeeStateProps,
  type ChangeMiningFeeDispatchProps
} from './ChangeMiningFee.ui.js'
import { changeFee } from '../../../../actions/CryptoExchangeActions'

export const mapStateToProps = (state: State): ChangeMiningFeeStateProps => ({
  // fee: state.cryptoExchange.fee,
  feeSetting: state.cryptoExchange.feeSetting
})

export const mapDispatchToProps = (dispatch: Dispatch): ChangeMiningFeeDispatchProps => ({
  onSubmit: changeFee
})

export default connect(mapStateToProps, mapDispatchToProps)(ChangeMiningFee)
