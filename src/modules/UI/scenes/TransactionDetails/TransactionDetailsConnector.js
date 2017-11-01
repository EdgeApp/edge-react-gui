import {connect} from 'react-redux'
import type {Props, DispatchProps} from './TransactionDetails.ui'
import * as SETTINGS_SELECTORS from '../../Settings/selectors.js'
import type {GuiWallet, GuiContact} from '../../../../types'
import type {AbcMetadata, AbcCurrencyInfo, AbcCurrencyPlugin} from 'airbitz-core-types'
import platform from '../../../../theme/variables/platform.js'
import * as UTILS from '../../../utils'
import {
    setTransactionDetails,
    getSubcategories
} from './action.js'

const {TransactionDetails} = require('./TransactionDetails.ui')

const mapStateToProps = (state: any, ownProps: any): Props => {
  const wallets: Array<GuiWallet> = state.ui.wallets.byId
  const contacts: Array<GuiContact> = state.ui.contacts.contactList
  const usableHeight: number = platform.usableHeight
  const subcategoriesList: Array<string> = state.ui.scenes.transactionDetails.subcategories
  const settings: any = state.ui.settings
  const currencyCode: string = ownProps.abcTransaction.currencyCode
  const plugins: Array<AbcCurrencyPlugin> = SETTINGS_SELECTORS.getPlugins(state)
  const currencyInfo: AbcCurrencyInfo = UTILS.getCurrencyInfo(plugins.arrayPlugins, ownProps.abcTransaction.currencyCode)

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

const mapDispatchToProps = (dispatch: any): DispatchProps => ({
  setTransactionDetails: (txid: string, currencyCode: string, abcMetadata: AbcMetadata) => { dispatch(setTransactionDetails(txid, currencyCode, abcMetadata)) },
  getSubcategories: () => dispatch(getSubcategories())
})

export default connect(mapStateToProps, mapDispatchToProps)(TransactionDetails)
