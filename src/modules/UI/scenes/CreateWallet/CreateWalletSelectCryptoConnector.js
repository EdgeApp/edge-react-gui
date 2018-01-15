// @flow

import {connect} from 'react-redux'
// eslint-disable-next-line no-duplicate-imports
import {
  CreateWalletSelectCryptoComponent
} from './CreateWalletSelectCrypto.ui.js'
// eslint-disable-next-line no-duplicate-imports
import type {
  CreateWalletSelectCryptoStateProps
} from './CreateWalletSelectCrypto.ui.js'
import * as SETTINGS_SELECTORS from '../../Settings/selectors.js'
import type {State, Dispatch} from '../../../ReduxTypes'
import type {GuiWalletType, DeviceDimensions} from '../../../../types'

const mapStateToProps = (state: State): CreateWalletSelectCryptoStateProps => ({
  supportedWalletTypes: SETTINGS_SELECTORS.getSupportedWalletTypes(state),
  dimensions: state.ui.scenes.dimensions
})

export const CreateWalletSelectCrypto = connect(mapStateToProps)(CreateWalletSelectCryptoComponent)
