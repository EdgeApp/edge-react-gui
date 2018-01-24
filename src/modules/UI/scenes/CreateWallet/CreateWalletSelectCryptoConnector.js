// @flow

import {connect} from 'react-redux'

import {CreateWalletSelectCryptoComponent, type CreateWalletSelectCryptoStateProps} from './CreateWalletSelectCrypto.ui.js'

import * as SETTINGS_SELECTORS from '../../Settings/selectors.js'
import type {State} from '../../../ReduxTypes'

const mapStateToProps = (state: State): CreateWalletSelectCryptoStateProps => ({
  supportedWalletTypes: SETTINGS_SELECTORS.getSupportedWalletTypes(state),
  dimensions: state.ui.scenes.dimensions
})
const mapDispatchToProps = () => ({})
export const CreateWalletSelectCrypto = connect(mapStateToProps, mapDispatchToProps)(CreateWalletSelectCryptoComponent)
