// @flow

import { connect } from 'react-redux'

import { createCurrencyWallet } from '../../actions/CreateWalletActions.js'
import { CreateWalletReview as CreateWalletReviewConnector } from '../../components/scenes/CreateWalletReviewScene'
import type { CreateWalletReviewDispatchProps } from '../../components/scenes/CreateWalletReviewScene'
import { getSupportedWalletTypes } from '../../modules/Settings/selectors.js'
import type { Dispatch, State } from '../../types/reduxTypes.js'

const mapStateToProps = (state: State) => ({
  isCreatingWallet: state.ui.scenes.createWallet.isCreatingWallet,
  supportedWalletTypes: getSupportedWalletTypes(state)
})

const mapDispatchToProps = (dispatch: Dispatch): CreateWalletReviewDispatchProps => ({
  createCurrencyWallet: (walletName: string, walletType: string, fiatCurrencyCode: string, isScenePop: boolean, selectWallet: boolean, importText?: string) =>
    dispatch(createCurrencyWallet(walletName, walletType, fiatCurrencyCode, isScenePop, false, importText))
})

export const CreateWalletReview = connect(
  mapStateToProps,
  mapDispatchToProps
)(CreateWalletReviewConnector)
