// @flow

import {connect} from 'react-redux'
import CreateWalletReview from './CreateWalletReview.ui'
import {createCurrencyWallet} from './action'
import type {State, Dispatch} from '../../../ReduxTypes'

export type OwnProps = {
  walletName: string,
  selectedWalletType: string,
  selectedFiat: string
}

export type DispatchProps = {
  createCurrencyWallet: (string, string, string) => void
}

const mapStateToProps = (state: State) => ({
  isCreatingWallet: state.ui.scenes.createWallet.isCreatingWallet
})

const mapDispatchToProps = (dispatch: Dispatch): DispatchProps => ({
  createCurrencyWallet: (walletName: string, walletType: string, fiatCurrencyCode: string): any => dispatch(createCurrencyWallet(walletName, walletType, fiatCurrencyCode))
})

export default connect(mapStateToProps, mapDispatchToProps)(CreateWalletReview)
