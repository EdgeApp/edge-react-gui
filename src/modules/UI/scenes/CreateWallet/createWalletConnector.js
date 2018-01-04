// @flow

import {connect} from 'react-redux'
import CreateWallet, {type Props, type DispatchProps} from './CreateWallet.ui'
import * as SETTINGS_SELECTORS from '../../Settings/selectors.js'
import * as UTILS from '../../../utils'
import {createCurrencyWallet} from './action'
import type {State, Dispatch} from '../../../ReduxTypes'

const mapStateToProps = (state: State): Props => ({
  supportedWalletTypes: SETTINGS_SELECTORS.getSupportedWalletTypes(state),
  supportedFiats: UTILS.getSupportedFiats()
})

const mapDispatchToProps = (dispatch: Dispatch): DispatchProps => ({
  createCurrencyWallet: (walletName: string, walletType: string, fiatCurrencyCode: string): any =>
  dispatch(createCurrencyWallet(walletName, walletType, fiatCurrencyCode))
})

export default connect(mapStateToProps, mapDispatchToProps)(CreateWallet)
