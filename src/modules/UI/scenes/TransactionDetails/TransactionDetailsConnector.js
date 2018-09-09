// @flow

import type { EdgeCurrencyInfo, EdgeMetadata } from 'edge-core-js'
import { connect } from 'react-redux'

import { PLATFORM } from '../../../../theme/variables/platform.js'
import type { Dispatch, State } from '../../../ReduxTypes'
import * as UTILS from '../../../utils'
import { displayDropdownAlert } from '../../components/DropdownAlert/actions'
import * as UI_SELECTORS from '../../selectors'
import * as SETTINGS_SELECTORS from '../../Settings/selectors.js'
import { getSubcategories, setNewSubcategory, setTransactionDetails } from './action.js'
import { TransactionDetails } from './TransactionDetails.ui'
import type { TransactionDetailsOwnProps } from './TransactionDetails.ui'

const mapStateToProps = (state: State, ownProps: TransactionDetailsOwnProps) => {
  const wallets = UI_SELECTORS.getWallets(state)
  const contacts = state.contacts
  const usableHeight: number = PLATFORM.usableHeight
  const subcategoriesList: Array<string> = state.ui.scenes.transactionDetails.subcategories.sort()
  const settings = SETTINGS_SELECTORS.getSettings(state)
  const currencyCode: string = ownProps.edgeTransaction.currencyCode
  const plugins: Object = SETTINGS_SELECTORS.getPlugins(state)
  const allCurrencyInfos: Array<EdgeCurrencyInfo> = plugins.allCurrencyInfos
  const currencyInfo: EdgeCurrencyInfo | void = UTILS.getCurrencyInfo(allCurrencyInfos, currencyCode)

  return {
    contacts,
    usableHeight,
    subcategoriesList,
    settings,
    currencyInfo,
    currencyCode,
    wallets
  }
}

const mapDispatchToProps = (dispatch: Dispatch) => ({
  setTransactionDetails: (txid: string, currencyCode: string, edgeMetadata: EdgeMetadata) => {
    dispatch(setTransactionDetails(txid, currencyCode, edgeMetadata))
  },
  getSubcategories: () => dispatch(getSubcategories()),
  displayDropdownAlert: (message: string, title: string) => dispatch(displayDropdownAlert({ message, title })),
  setNewSubcategory: (newSubcategory: string) => dispatch(setNewSubcategory(newSubcategory))
})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(TransactionDetails)
