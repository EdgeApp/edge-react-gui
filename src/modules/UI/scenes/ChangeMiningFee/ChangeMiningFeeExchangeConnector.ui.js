// @flow

import {connect} from 'react-redux'
import type {State, Dispatch} from '../../../ReduxTypes'
import ChangeMiningFee, {
  type ChangeMiningFeeStateProps
} from './ChangeMiningFee.ui.js'
import { changeFee } from '../../../../actions/CryptoExchangeActions'

export const mapStateToProps = (state: State): ChangeMiningFeeStateProps => ({
  // fee: state.cryptoExchange.fee,
  feeSetting: state.cryptoExchange.feeSetting
})

export const mapDispatchToProps = (dispatch: Dispatch) => ({
  onSubmit: (feeSetting: string) => dispatch(changeFee(feeSetting))
})

export default connect(mapStateToProps, mapDispatchToProps)(ChangeMiningFee)
