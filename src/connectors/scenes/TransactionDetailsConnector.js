// @flow

import { bns } from 'biggystring'
import { type EdgeCurrencyInfo, type EdgeDenomination, type EdgeMetadata, type EdgeTransaction } from 'edge-core-js'
import { connect } from 'react-redux'

import { getSubcategories, setNewSubcategory, setTransactionDetails } from '../../actions/TransactionDetailsActions.js'
import type { TransactionDetailsOwnProps } from '../../components/scenes/TransactionDetailsScene.js'
import { TransactionDetails } from '../../components/scenes/TransactionDetailsScene.js'
import * as SETTINGS_SELECTORS from '../../modules/Settings/selectors.js'
import * as UI_SELECTORS from '../../modules/UI/selectors.js'
import type { Dispatch, State } from '../../types/reduxTypes.js'
import * as UTILS from '../../util/utils.js'

const mapStateToProps = (state: State, ownProps: TransactionDetailsOwnProps) => {
  const { edgeTransaction } = ownProps
  const walletId = edgeTransaction.wallet ? edgeTransaction.wallet.id : null
  const wallet = walletId ? UI_SELECTORS.getWallet(state, walletId) : UI_SELECTORS.getSelectedWallet(state)
  const contacts = state.contacts
  const subcategoriesList: Array<string> = state.ui.scenes.transactionDetails.subcategories.sort()
  const settings = SETTINGS_SELECTORS.getSettings(state)
  const currencyCode: string = edgeTransaction.currencyCode
  const plugins: Object = SETTINGS_SELECTORS.getPlugins(state)
  const allCurrencyInfos: Array<EdgeCurrencyInfo> = plugins.allCurrencyInfos
  const currencyInfo: EdgeCurrencyInfo | void = UTILS.getCurrencyInfo(allCurrencyInfos, currencyCode)
  const walletDefaultDenomProps: EdgeDenomination = UTILS.isCryptoParentCurrency(wallet, edgeTransaction.currencyCode)
    ? UTILS.getWalletDefaultDenomProps(wallet, settings)
    : UTILS.getWalletDefaultDenomProps(wallet, settings, edgeTransaction.currencyCode)

  const nativeAmount = edgeTransaction && edgeTransaction.nativeAmount ? bns.abs(edgeTransaction.nativeAmount) : ''
  const cryptoAmount: string = UI_SELECTORS.convertNativeToExchangeRateDenomination(settings, currencyCode, nativeAmount)
  const currentFiatAmount = UI_SELECTORS.convertCurrencyFromExchangeRates(
    state.exchangeRates,
    currencyCode,
    wallet.isoFiatCurrencyCode,
    parseFloat(cryptoAmount)
  )

  const { swapData } = edgeTransaction
  const destinationDenomination = swapData ? SETTINGS_SELECTORS.getDisplayDenomination(state, swapData.payoutCurrencyCode) : undefined
  const destinationWallet = swapData ? UI_SELECTORS.getWallet(state, swapData.payoutWalletId) : undefined

  return {
    contacts,
    subcategoriesList,
    currencyInfo,
    currencyCode,
    guiWallet: wallet,
    currentFiatAmount,
    walletDefaultDenomProps,
    theme: state.theme,
    destinationDenomination,
    destinationWallet
  }
}

const mapDispatchToProps = (dispatch: Dispatch) => ({
  setTransactionDetails: (transaction: EdgeTransaction, edgeMetadata: EdgeMetadata) => {
    dispatch(setTransactionDetails(transaction, edgeMetadata))
  },
  getSubcategories: () => dispatch(getSubcategories()),
  setNewSubcategory: (newSubcategory: string) => dispatch(setNewSubcategory(newSubcategory))
})

export default connect(mapStateToProps, mapDispatchToProps)(TransactionDetails)
