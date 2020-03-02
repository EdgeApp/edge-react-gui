// @flow

import type { EdgeCurrencyInfo, EdgeMetadata, EdgeTransaction } from 'edge-core-js'
import { connect } from 'react-redux'

import { getSubcategories, setNewSubcategory, setTransactionDetails } from '../../actions/TransactionDetailsActions.js'
import type { TransactionDetailsOwnProps } from '../../components/scenes/TransactionDetailsScene'
import { TransactionDetails } from '../../components/scenes/TransactionDetailsScene'
import * as SETTINGS_SELECTORS from '../../modules/Settings/selectors.js'
import * as UI_SELECTORS from '../../modules/UI/selectors'
import type { Dispatch, State } from '../../types/reduxTypes.js'
import * as UTILS from '../../util/utils'

const mapStateToProps = (state: State, ownProps: TransactionDetailsOwnProps) => {
  const walletId = ownProps.edgeTransaction.wallet ? ownProps.edgeTransaction.wallet.id : null
  const wallet = walletId ? UI_SELECTORS.getWallet(state, walletId) : null
  const wallets = UI_SELECTORS.getWallets(state)
  const contacts = state.contacts
  const subcategoriesList: Array<string> = state.ui.scenes.transactionDetails.subcategories.sort()
  const settings = SETTINGS_SELECTORS.getSettings(state)
  const currencyCode: string = ownProps.edgeTransaction.currencyCode
  const plugins: Object = SETTINGS_SELECTORS.getPlugins(state)
  const allCurrencyInfos: Array<EdgeCurrencyInfo> = plugins.allCurrencyInfos
  const currencyInfo: EdgeCurrencyInfo | void = UTILS.getCurrencyInfo(allCurrencyInfos, currencyCode)

  const currentFiatAmount = wallet ?
    UI_SELECTORS.calculateWalletFiatBalanceWithoutState(wallet, currencyCode, state.ui.settings ,state.exchangeRates) :
    null

  return {
    contacts,
    subcategoriesList,
    settings,
    currencyInfo,
    currencyCode,
    wallets,
    currentFiatAmount
  }
}

const mapDispatchToProps = (dispatch: Dispatch) => ({
  setTransactionDetails: (transaction: EdgeTransaction, edgeMetadata: EdgeMetadata) => {
    dispatch(setTransactionDetails(transaction, edgeMetadata))
  },
  getSubcategories: () => dispatch(getSubcategories()),
  setNewSubcategory: (newSubcategory: string) => dispatch(setNewSubcategory(newSubcategory))
})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(TransactionDetails)
