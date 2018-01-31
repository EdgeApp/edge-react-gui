// @flow

import {connect} from 'react-redux'
import type { State, Dispatch } from '../../../ReduxTypes'
import ChangeMiningFee from './ChangeMiningFee.ui'
import { changeFee } from '../../../../actions/CryptoExchangeActions.js'

export const mapStateToProps = (state: State) => ({
  feeSetting: state.cryptoExchange.feeSetting
})

export const mapDispatchToProps = (dispatch: Dispatch) => ({
  onSubmit: (feeSetting: string) => dispatch(changeFee(feeSetting))
})

export default connect(mapStateToProps, mapDispatchToProps)(ChangeMiningFee)
