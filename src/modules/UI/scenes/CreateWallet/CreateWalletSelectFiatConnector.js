// @flow

import {connect} from 'react-redux'
import {
  CreateWalletSelectFiat as CreateWalletSelectFiatComponent,
  type CreateWalletSelectFiatStateProps
} from './CreateWalletSelectFiat.ui'
import type {State} from '../../../ReduxTypes'
import * as UTILS from '../../../utils'

import {getDimensions} from '../../dimensions/selectors'

const mapStateToProps = (state: State): CreateWalletSelectFiatStateProps => ({
  supportedFiats: UTILS.getSupportedFiats(),
  dimensions: getDimensions(state)
})
const mapDispatchToProps = () => ({})
export const CreateWalletSelectFiat = connect(mapStateToProps, mapDispatchToProps)(CreateWalletSelectFiatComponent)
