// @flow

import { connect } from 'react-redux'

import { changeFee } from '../../../../actions/CryptoExchangeActions'
import type { Dispatch, State } from '../../../ReduxTypes'
import ChangeMiningFee from './ChangeMiningFee.ui.js'
import type { ChangeMiningFeeStateProps } from './ChangeMiningFee.ui.js'

export const mapStateToProps = (state: State): ChangeMiningFeeStateProps => ({
  // fee: state.cryptoExchange.fee,
  feeSetting: state.cryptoExchange.feeSetting
})

export const mapDispatchToProps = (dispatch: Dispatch) => ({
  onSubmit: (feeSetting: string) => dispatch(changeFee(feeSetting))
})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ChangeMiningFee)
