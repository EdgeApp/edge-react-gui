
import {connect} from 'react-redux'
import type {Props, DispatchProps} from './TransactionDetails.ui'
import * as UI_SELECTORS from '../../selectors.js'
import type {GuiWallet, GuiContact, GuiTransaction} from '../../../../types'
// import type {AbcTransaction} from 'airbitz-core-types'
import platform from '../../../../theme/variables/platform.js'
import * as UTILS from '../../../utils'
import {
    setTransactionDetails
} from './action.js'

const {TransactionDetails} = require('./TransactionDetails.ui')

const mapStateToProps = (state: any): Props => {
  const selectedWallet: GuiWallet = UI_SELECTORS.getSelectedWallet(state)
  const fiatSymbol: string = UTILS.getFiatSymbol(UI_SELECTORS.getSelectedWallet(state).fiatCurrencyCode)
  const contacts: Array<GuiContact> = state.ui.contacts.contactList
  const usableHeight: number = platform.usableHeight
  const subcategoriesList: Array<string> = state.ui.scenes.transactionDetails.subcategories
  const settings: any = state.ui.settings

  return {
    selectedWallet,
    fiatSymbol,
    contacts,
    usableHeight,
    subcategoriesList,
    settings
  }
}

const mapDispatchToProps = (dispatch: any): DispatchProps => ({
  setTransactionDetails: (currencyCode: string, transactionDetails: GuiTransaction) => { dispatch(setTransactionDetails(currencyCode, transactionDetails)) }
})

export default connect(mapStateToProps, mapDispatchToProps)(TransactionDetails)
