// @flow

import {connect} from 'react-redux'
import type {State} from '../../../ReduxTypes'
import ChangeMiningFee from './ChangeMiningFee.ui'
import { changeFee } from '../../../../actions/CryptoExchangeActions'

export const mapStateToProps = (state: State) => ({
  // fee: state.cryptoExchange.fee,
  feeSetting: state.cryptoExchange.feeSetting,
})

export const mapDispatchToProps = ({
  onSubmit: changeFee
})

export default connect(mapStateToProps, mapDispatchToProps)(ChangeMiningFee)
