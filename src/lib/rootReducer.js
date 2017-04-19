import { combineReducers } from 'redux'
import routes from './routesReducer'

import * as SideMenu from '../modules/SideMenu/SideMenu.reducer'
import * as Transactions from '../modules/Transactions/Transactions.reducer'
import * as Scan from '../modules/Scan/Scan.reducer'
import * as WalletList from '../modules/WalletList/WalletList.reducer'

const store = combineReducers({

  sidemenu: combineReducers({
    view  : SideMenu.view
  }),

  transactions: combineReducers({
    transactionsList: Transactions.transactionsList,
    searchVisible: Transactions.searchVisible,
    contactsList: Transactions.contactsList
  }),

  scan: combineReducers({
    torchEnabled: Scan.torchEnabled,
    addressModalVisible: Scan.addressModalVisible,
    recipientAddress: Scan.recipientAddress
  }),

  walletList: combineReducers({
    walletList: WalletList.walletList
  }),

  routes
})

export default store
