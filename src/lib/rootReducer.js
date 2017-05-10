import { combineReducers } from 'redux'
import routes from './routesReducer'

import sideMenu from '../modules/SideMenu/SideMenu.reducer'
import transactionList from '../modules/Transactions/Transactions.reducer'
import scan from '../modules/Scan/Scan.reducer'
import controlPanel from '../modules/ControlPanel/reducer'
import walletList from '../modules/WalletList/WalletList.reducer'
import walletTransferListReducer from '../modules/WalletTransferList/WalletTransferList.reducer'
import addWallet from '../modules/AddWallet/reducer'
import container from '../modules/Container.reducer'

import { airbitz, account } from '../modules/Login/Login.reducer.js'

import { walletsOld } from '../modules/UI/Wallets/Wallets.reducer.js'
import * as wallets from '../modules/Wallets/Wallets.reducer.js'

import Login from '../modules/Login/Login.reducer.js'
import request from '../modules/Request/Request.reducer.js'

const store = combineReducers({
  routes,
  airbitz,
  account,

  wallets: combineReducers({
    wallets: Wallets.wallets, // wallets
    walletList: Wallets.walletList, // ?
    walletListOrder: Wallets.walletListOrder, // ?
    selectedWallet: Wallets.selectedWallet // UI
  }),

  request,

  ui: combineReducers({
    scan,
    transactionList,
    controlPanel,
    walletList,
    walletTransferList: walletTransferListReducer,
    wallets: walletsOld,
    sideMenu,
    addWallet,
    main: container
  })

})

export default store
