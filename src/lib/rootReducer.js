import { combineReducers } from 'redux'
import routes from './routesReducer'

import * as SideMenu from '../modules/SideMenu/SideMenu.reducer'
import * as Transactions from '../modules/Transactions/Transactions.reducer'
import * as Scan from '../modules/Scan/Scan.reducer'
import * as ControlPanel from '../modules/ControlPanel/reducer'
import * as WalletList from '../modules/WalletList/WalletList.reducer'
import * as WalletTransferList from '../modules/WalletTransferList/WalletTransferList.reducer'
import Login from '../modules/Login/Login.reducer.js'
import Wallets from '../modules/Wallets/Wallets.reducer.js'
import { helpModal } from '../modules/HelpModal/reducer.js'

const store = combineReducers({
  airbitz: Login,
  account: Login,

  sidemenu: combineReducers({
    view: SideMenu.view
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

  controlPanel: combineReducers({
    usersView: ControlPanel.usersView,
    usersList: ControlPanel.usersList,
    selectedUser: ControlPanel.selectedUser
  }),
  walletList: combineReducers({
    walletList: WalletList.walletList,
    walletsVisible: WalletList.walletsVisible,
    archiveVisible: WalletList.archiveVisible
  }),
  walletTransferList: combineReducers({
    walletTransferList: WalletTransferList.walletTransferList,
    walletListModalVisible: WalletTransferList.walletListModalVisible
  }),

  wallets: Wallets,
  helpModal,

  routes
})

export default store
