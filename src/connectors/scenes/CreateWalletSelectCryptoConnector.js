// @flow

import { connect } from 'react-redux'

import { CreateWalletSelectCrypto as CreateWalletSelectCryptoComponent } from '../../components/scenes/CreateWalletSelectCryptoScene.js'
import type { CreateWalletSelectCryptoStateProps } from '../../components/scenes/CreateWalletSelectCryptoScene.js'
import type { State } from '../../modules/ReduxTypes'
import * as SETTINGS_SELECTORS from '../../modules/Settings/selectors.js'

const mapStateToProps = (state: State): CreateWalletSelectCryptoStateProps => {
  const supportedWalletTypes = SETTINGS_SELECTORS.getSupportedWalletTypes(state)

  // Ripple hack
  for (const type of supportedWalletTypes) {
    if (type.currencyCode.toLowerCase() === 'xrp') {
      type.label = 'Ripple'
    }
  }

  return {
    supportedWalletTypes,
    dimensions: state.ui.scenes.dimensions
  }
}
const mapDispatchToProps = () => ({})
export const CreateWalletSelectCrypto = connect(
  mapStateToProps,
  mapDispatchToProps
)(CreateWalletSelectCryptoComponent)
