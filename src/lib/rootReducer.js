import { combineReducers } from 'redux'
import routes from './routesReducer'

import sideMenu from '../modules/SideMenu/SideMenu.reducer'
import transactionList from '../modules/Transactions/Transactions.reducer'
import scan from '../modules/Scan/Scan.reducer'
import controlPanel from '../modules/ControlPanel/reducer'
import walletList from '../modules/WalletList/WalletList.reducer'
import walletTransferListReducer from '../modules/WalletTransferList/WalletTransferList.reducer'
import addWallet from '../modules/AddWallet/reducer'

import { airbitz, account } from '../modules/Login/Login.reducer.js'
import * as Wallets from '../modules/Wallets/Wallets.reducer.js'
import Login from '../modules/Login/Login.reducer.js'
import request from '../modules/Request/Request.reducer.js'

const store = combineReducers({
  request,
  //transactions,
  routes,  
  airbitz,
  account,


  wallets: combineReducers({
    wallets: Wallets.wallets,
    walletList: Wallets.walletList,
    walletListOrder: Wallets.walletListOrder,
    selectedWallet: Wallets.selectedWallet
  }),

  ui: combineReducers({
    scan,    
    transactionList,
    controlPanel,
    walletList,
    walletTransferList: walletTransferListReducer,
    sideMenu,
    addWallet
  })

})

export default store
