// @flow

import { connect } from 'react-redux'

import type { State } from '../../../ReduxTypes'
import { getSupportedFiats } from '../../../utils'
import { CreateWalletSelectFiat as CreateWalletSelectFiatComponent } from './CreateWalletSelectFiat.ui'
import type { CreateWalletSelectFiatStateProps } from './CreateWalletSelectFiat.ui'

const mapStateToProps = (state: State): CreateWalletSelectFiatStateProps => ({
  supportedFiats: getSupportedFiats(),
  dimensions: state.ui.scenes.dimensions
})
const mapDispatchToProps = () => ({})
export const CreateWalletSelectFiat = connect(
  mapStateToProps,
  mapDispatchToProps
)(CreateWalletSelectFiatComponent)
