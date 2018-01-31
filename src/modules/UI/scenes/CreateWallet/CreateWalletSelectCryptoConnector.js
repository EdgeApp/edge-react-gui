// @flow

import {connect} from 'react-redux'

import {CreateWalletSelectCrypto as CreateWalletSelectCryptoComponent, type CreateWalletSelectCryptoStateProps} from './CreateWalletSelectCrypto.ui.js'
import {getSupportedWalletTypes} from '../../Settings/selectors.js'
import type {State} from '../../../ReduxTypes'

import {getDimensions} from '../../dimensions/selectors'

const mapStateToProps = (state: State): CreateWalletSelectCryptoStateProps => ({
  supportedWalletTypes: getSupportedWalletTypes(state),
  dimensions: getDimensions(state)
})
const mapDispatchToProps = () => ({})
export const CreateWalletSelectCrypto = connect(mapStateToProps, mapDispatchToProps)(CreateWalletSelectCryptoComponent)
