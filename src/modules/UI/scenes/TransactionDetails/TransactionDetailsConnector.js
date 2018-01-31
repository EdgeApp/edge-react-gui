// @flow

import {connect} from 'react-redux'
import type {AbcMetadata, AbcCurrencyInfo, AbcCurrencyPlugin} from 'edge-login'

import type {Dispatch, State} from '../../../ReduxTypes'

import {getWallets} from '../../selectors'
import {getSettings, getArrayPlugins} from '../../Settings/selectors.js'
import platform from '../../../../theme/variables/platform.js'
import {getCurrencyInfo} from '../../../utils'
import {
  setTransactionDetails,
  getSubcategories as getSubcategoriesAction
} from './action.js'

import {displayDropdownAlert} from '../../components/DropdownAlert/actions'
import {setContactList} from '../../contacts/action'
import {TransactionDetails, type TransactionDetailsOwnProps} from './TransactionDetails.ui'
import {getContactList} from '../../contacts/selectors.js'
import {getSubcategories} from './selectors.js'

const mapStateToProps = (state: State, ownProps: TransactionDetailsOwnProps) => {
  const wallets = getWallets(state)
  const contacts = getContactList(state)
  const usableHeight = platform.usableHeight
  const subcategoriesList = getSubcategories(state)
  const settings = getSettings(state)
  const currencyCode = ownProps.abcTransaction.currencyCode
  const arrayPlugins: Array<AbcCurrencyPlugin> = getArrayPlugins(state)
  const currencyInfo: AbcCurrencyInfo | void = getCurrencyInfo(arrayPlugins, currencyCode)

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
  setContactList: (contacts) => dispatch(setContactList(contacts)),
  getSubcategories: () => dispatch(getSubcategoriesAction()),
  displayDropdownAlert: (message: string, title: string) => dispatch(displayDropdownAlert({message, title}))
})

export default connect(mapStateToProps, mapDispatchToProps)(TransactionDetails)
