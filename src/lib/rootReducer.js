import { combineReducers } from 'redux'
import routes from './routesReducer'

import * as SideMenu from '../modules/SideMenu/SideMenu.reducer'
import * as Transactions from '../modules/Transactions/Transactions.reducer'
import * as Scan from '../modules/Scan/Scan.reducer'
import * as WalletTransferList from '../modules/WalletTransferList/WalletTransferList.reducer'
import * as Login from '../modules/Login/Login.reducer.js'

const store = combineReducers({
  airbitz: Login.airbitz,
  account: Login.account,

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

  walletTransferList: combineReducers({
    walletTransferList: WalletTransferList.walletTransferList,
    walletListModalVisible: WalletTransferList.walletListModalVisible
  }),

  routes
})

export default store
