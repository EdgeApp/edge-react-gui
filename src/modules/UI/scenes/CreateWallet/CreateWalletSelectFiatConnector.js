// @flow

import {connect} from 'react-redux'

import {CreateWalletSelectFiatComponent, type CreateWalletSelectFiatStateProps} from './CreateWalletSelectFiat.ui'

import type {State} from '../../../ReduxTypes'
import * as UTILS from '../../../utils'

const mapStateToProps = (state: State): CreateWalletSelectFiatStateProps => ({
  supportedFiats: UTILS.getSupportedFiats(),
  dimensions: state.ui.scenes.dimensions
})
const mapDispatchToProps = () => ({})
export const CreateWalletSelectFiat = connect(mapStateToProps, mapDispatchToProps)(CreateWalletSelectFiatComponent)
