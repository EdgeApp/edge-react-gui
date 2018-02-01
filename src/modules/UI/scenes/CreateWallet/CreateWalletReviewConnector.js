// @flow

import {connect} from 'react-redux'
import {
  CreateWalletReview as CreateWalletReviewConnector,
  type CreateWalletReviewDispatchProps
} from './CreateWalletReview.ui'

import {createCurrencyWallet} from './action'
import type {State, Dispatch} from '../../../ReduxTypes'
import {getSupportedFiats} from '../../../utils.js'
import {getSupportedWalletTypes} from '../../Settings/selectors.js'

const mapStateToProps = (state: State) => ({
  isCreatingWallet: state.ui.scenes.createWallet.isCreatingWallet,
  supportedWalletTypes: getSupportedWalletTypes(state),
  supportedFiats: getSupportedFiats()
})

const mapDispatchToProps = (dispatch: Dispatch): CreateWalletReviewDispatchProps => ({
  createCurrencyWallet: (walletName: string, walletType: string, fiatCurrencyCode: string) => {
    dispatch(createCurrencyWallet(walletName, walletType, fiatCurrencyCode))
  }
})

export const CreateWalletReview = connect(mapStateToProps, mapDispatchToProps)(CreateWalletReviewConnector)
