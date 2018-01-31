// @flow

import {connect} from 'react-redux'
// eslint-disable-next-line no-duplicate-imports
import {
  CreateWalletReviewComponent
} from './CreateWalletReview.ui'
// eslint-disable-next-line no-duplicate-imports
import type {
  CreateWalletReviewDispatchProps
} from './CreateWalletReview.ui'
import {createCurrencyWallet} from './action'
import type {State, Dispatch} from '../../../ReduxTypes'
import {getSupportedFiats} from '../../../utils.js'
import {getSupportedWalletTypes} from '../../Settings/selectors.js'

import {getIsCreatingWallet} from './selectors.js'

const mapStateToProps = (state: State) => ({
  isCreatingWallet: getIsCreatingWallet(state),
  supportedWalletTypes: getSupportedWalletTypes(state),
  supportedFiats: getSupportedFiats()
})

const mapDispatchToProps = (dispatch: Dispatch): CreateWalletReviewDispatchProps => ({
  createCurrencyWallet: (walletName: string, walletType: string, fiatCurrencyCode: string): any => dispatch(createCurrencyWallet(walletName, walletType, fiatCurrencyCode))
})

export const CreateWalletReview = connect(mapStateToProps, mapDispatchToProps)(CreateWalletReviewComponent)
