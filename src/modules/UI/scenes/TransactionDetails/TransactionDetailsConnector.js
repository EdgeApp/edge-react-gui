// @flow

import type { AbcCurrencyInfo, AbcCurrencyPlugin, AbcMetadata } from 'edge-login'
import { connect } from 'react-redux'

import { PLATFORM } from '../../../../theme/variables/platform.js'
import type { GuiContact } from '../../../../types'
import type { Dispatch, State } from '../../../ReduxTypes'
import * as UTILS from '../../../utils'
import { displayDropdownAlert } from '../../components/DropdownAlert/actions'
import { setContactList } from '../../contacts/action'
import * as UI_SELECTORS from '../../selectors'
import * as SETTINGS_SELECTORS from '../../Settings/selectors.js'
import { getSubcategories, setTransactionDetails } from './action.js'
import { TransactionDetails } from './TransactionDetails.ui'
import type { TransactionDetailsOwnProps } from './TransactionDetails.ui'

const mapStateToProps = (state: State, ownProps: TransactionDetailsOwnProps) => {
  const wallets = UI_SELECTORS.getWallets(state)
  const contacts: Array<GuiContact> = state.ui.contacts.contactList
  const usableHeight: number = PLATFORM.usableHeight
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
  setTransactionDetails: (txid: string, currencyCode: string, abcMetadata: AbcMetadata) => {
    dispatch(setTransactionDetails(txid, currencyCode, abcMetadata))
  },
  setContactList: contacts => dispatch(setContactList(contacts)),
  getSubcategories: () => dispatch(getSubcategories()),
  displayDropdownAlert: (message: string, title: string) => dispatch(displayDropdownAlert({ message, title }))
})

export default connect(mapStateToProps, mapDispatchToProps)(TransactionDetails)
