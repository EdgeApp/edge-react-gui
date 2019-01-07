// @flow

import { connect } from 'react-redux'

import { CreateWalletSelectFiat as CreateWalletSelectFiatComponent } from '../../components/scenes/CreateWalletSelectFiatScene'
import type { CreateWalletSelectFiatStateProps } from '../../components/scenes/CreateWalletSelectFiatScene'
import type { State } from '../../modules/ReduxTypes'
import { getDefaultFiat } from '../../modules/Settings/selectors.js'
import { getSupportedFiats } from '../../util/utils'

const mapStateToProps = (state: State): CreateWalletSelectFiatStateProps => {
  const defaultFiat = getDefaultFiat(state)
  const supportedFiats = getSupportedFiats(defaultFiat)
  const out = {
    supportedFiats,
    dimensions: state.ui.scenes.dimensions
  }
  return out
}
const mapDispatchToProps = () => ({})
export const CreateWalletSelectFiat = connect(
  mapStateToProps,
  mapDispatchToProps
)(CreateWalletSelectFiatComponent)
