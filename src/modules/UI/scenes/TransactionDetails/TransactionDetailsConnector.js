// @flow

import {connect} from 'react-redux'
import type {AbcMetadata, AbcCurrencyInfo, AbcCurrencyPlugin} from 'edge-login'

import type {Dispatch, State} from '../../../ReduxTypes'

import * as UI_SELECTORS from '../../selectors'
import * as SETTINGS_SELECTORS from '../../Settings/selectors.js'
import platform from '../../../../theme/variables/platform.js'
import * as UTILS from '../../../utils'
import {
  setTransactionDetails,
  getSubcategories
} from './action.js'

import {displayDropdownAlert} from '../../components/DropdownAlert/actions'
import {TransactionDetails, type TransactionDetailsOwnProps} from './TransactionDetails.ui'
import {getContacts} from '../../../../reducers/contacts/selectors.js'

const mapStateToProps = (state: State, ownProps: TransactionDetailsOwnProps) => {
  const wallets = UI_SELECTORS.getWallets(state)
  const contacts = getContacts(state)
  const usableHeight: number = platform.usableHeight
  const subcategoriesList: Array<string> = state.ui.scenes.transactionDetails.subcategories
  const settings = SETTINGS_SELECTORS.getSettings(state)
  const currencyCode: string = ownProps.abcTransaction.currencyCode
  const plugins: Object = SETTINGS_SELECTORS.getPlugins(state)
  const arrayPlugins: Array<AbcCurrencyPlugin> = plugins.arrayPlugins
  const currencyInfo: AbcCurrencyInfo | void = UTILS.getCurrencyInfo(arrayPlugins, currencyCode)

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
  setTransactionDetails: (txid: string, currencyCode: string, abcMetadata: AbcMetadata) => { dispatch(setTransactionDetails(txid, currencyCode, abcMetadata)) },
  getSubcategories: () => dispatch(getSubcategories()),
  displayDropdownAlert: (message: string, title: string) => dispatch(displayDropdownAlert({message, title}))
})

export default connect(mapStateToProps, mapDispatchToProps)(TransactionDetails)
