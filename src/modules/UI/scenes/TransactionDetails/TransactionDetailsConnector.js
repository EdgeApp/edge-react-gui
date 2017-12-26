// @flow

import {connect} from 'react-redux'
import type {AbcMetadata, AbcCurrencyInfo, AbcCurrencyPlugin} from 'airbitz-core-types'

import type {Dispatch, State} from '../../../ReduxTypes'
import type {GuiWallet, GuiContact} from '../../../../types'

import * as UI_SELECTORS from '../../selectors'
import * as SETTINGS_SELECTORS from '../../Settings/selectors.js'
import platform from '../../../../theme/variables/platform.js'
import * as UTILS from '../../../utils'
import {
  setTransactionDetails,
  getSubcategories
} from './action.js'

import {TransactionDetails} from './TransactionDetails.ui'

const mapStateToProps = (state: State, ownProps: any) => {
  const wallets: Array<GuiWallet> = UI_SELECTORS.getWallets(state)
  const contacts: Array<GuiContact> = state.ui.contacts.contactList
  const usableHeight: number = platform.usableHeight
  const subcategoriesList: Array<string> = state.ui.scenes.transactionDetails.subcategories
  const settings = SETTINGS_SELECTORS.getSettings(state)
  const currencyCode: string = ownProps.abcTransaction.currencyCode
  const plugins: any = SETTINGS_SELECTORS.getPlugins(state)
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
  getSubcategories: () => dispatch(getSubcategories())
})

export default connect(mapStateToProps, mapDispatchToProps)(TransactionDetails)
