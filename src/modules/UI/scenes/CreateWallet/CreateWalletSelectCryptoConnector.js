// @flow

import {connect} from 'react-redux'
import {CreateWalletSelectCryptoComponent} from './CreateWalletSelectCrypto.ui.js'
import * as SETTINGS_SELECTORS from '../../Settings/selectors.js'
import type {State, Dispatch} from '../../../ReduxTypes'
import type {GuiWalletType, DeviceDimensions} from '../../../../types'

export type StateProps = {
  supportedWalletTypes: Array<GuiWalletType>,
  dimensions: DeviceDimensions
}

export type OwnProps = {
  walletName: string
}

const mapStateToProps = (state: State): StateProps => ({
  supportedWalletTypes: SETTINGS_SELECTORS.getSupportedWalletTypes(state),
  dimensions: state.ui.scenes.dimensions
})

export const CreateWalletSelectCrypto = connect(mapStateToProps)(CreateWalletSelectCryptoComponent)
