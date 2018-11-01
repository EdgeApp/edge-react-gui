// @flow

import { connect } from 'react-redux'

import { createCurrencyWallet } from '../../actions/CreateWalletActions.js'
import { CreateWalletReview as CreateWalletReviewConnector } from '../../components/scenes/CreateWalletReviewScene'
import type { CreateWalletReviewDispatchProps } from '../../components/scenes/CreateWalletReviewScene'
import type { Dispatch, State } from '../../modules/ReduxTypes'
import { getSupportedWalletTypes } from '../../modules/Settings/selectors.js'
import { getSupportedFiats } from '../../util/utils.js'

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

export const CreateWalletReview = connect(
  mapStateToProps,
  mapDispatchToProps
)(CreateWalletReviewConnector)
