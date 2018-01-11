// @flow

import {connect} from 'react-redux'
import {CreateWalletReviewComponent} from './CreateWalletReview.ui'
import {createCurrencyWallet} from './action'
import type {State, Dispatch} from '../../../ReduxTypes'
import {getSupportedFiats} from '../../../utils.js'
import {getSupportedWalletTypes} from '../../Settings/selectors.js'

export type OwnProps = {
  walletName: string,
  selectedWalletType: string,
  selectedFiat: string
}

export type DispatchProps = {
  createCurrencyWallet: (string, string, string) => void
}

const mapStateToProps = (state: State) => ({
  isCreatingWallet: state.ui.scenes.createWallet.isCreatingWallet,
  supportedWalletTypes: getSupportedWalletTypes(state),
  supportedFiats: getSupportedFiats()
})

const mapDispatchToProps = (dispatch: Dispatch): DispatchProps => ({
  createCurrencyWallet: (walletName: string, walletType: string, fiatCurrencyCode: string): any => dispatch(createCurrencyWallet(walletName, walletType, fiatCurrencyCode))
})

export const CreateWalletReview = connect(mapStateToProps, mapDispatchToProps)(CreateWalletReviewComponent)
