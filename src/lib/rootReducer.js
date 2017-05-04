import { combineReducers } from 'redux'
import routes from './routesReducer'

import * as SideMenu from '../modules/SideMenu/SideMenu.reducer'
import * as Transactions from '../modules/Transactions/Transactions.reducer'
import * as Scan from '../modules/Scan/Scan.reducer'
import * as ControlPanel from '../modules/ControlPanel/reducer'
import * as WalletList from '../modules/WalletList/WalletList.reducer'
import * as WalletTransferList from '../modules/WalletTransferList/WalletTransferList.reducer'
import * as AddWallet from '../modules/AddWallet/reducer'
import * as Wallets from '../modules/Wallets/Wallets.reducer.js'
import Login from '../modules/Login/Login.reducer.js'
import Request from '../modules/Request/Request.reducer.js'

const store = combineReducers({
  airbitz: Login.airbitz,
  account: Login.account,

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
    archiveVisible: WalletList.archiveVisible,
    renameWalletVisible: WalletList.renameWalletVisible,
    deleteWalletVisible: WalletList.deleteWalletVisible,
    currentWalletRename: WalletList.currentWalletRename,
    currentWalletBeingRenamed: WalletList.currentWalletBeingRenamed,
    currentWalletBeingDeleted: WalletList.currentWalletBeingDeleted
  }),
  walletTransferList: combineReducers({
    walletTransferList: WalletTransferList.walletTransferList,
    walletListModalVisible: WalletTransferList.walletListModalVisible
  }),

  wallets: combineReducers({
    wallets: Wallets.wallets,
    walletList: Wallets.walletList,
    walletListOrder: Wallets.walletListOrder,
    selectedWallet: Wallets.selectedWallet
  }),

  addWallet: combineReducers({
    newWalletName: AddWallet.newWalletName
  }),

  request: Request,

  routes
})

export default store
