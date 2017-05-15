import { combineReducers } from 'redux'
import routes from './routesReducer'

import sideMenu from '../modules/UI/components/SideMenu/reducer'
import transactionList from '../modules/UI/scenes/TransactionsList/reducer'
import scan from '../modules/UI/scenes/Scan/reducer'
import controlPanel from '../modules/UI/components/ControlPanel/reducer'
import walletList from '../modules/UI/scenes/WalletList/reducer'
import walletTransferListReducer from '../modules/UI/scenes/WalletTransferList/reducer'
import addWallet from '../modules/UI/scenes/AddWallet/reducer'
import container from '../modules/reducer'
import exchangeRate from '../modules/UI/components/ExchangeRate/reducer'

import { airbitz, account } from '../modules/Login/reducer.js'

import { walletsOld } from '../modules/UI/Wallets/reducer.js'
import { wallets } from '../modules/Wallets/reducer.js'
import { transactions } from '../modules/Transactions/reducer.js'
import { helpModal } from '../modules/UI/components/HelpModal/reducer.js'
import Login from '../modules/Login/reducer.js'
import request from '../modules/UI/scenes/Request/reducer.js'


const store = combineReducers({
  routes,
  airbitz,
  account,

  wallets,
  transactions,
  exchangeRate,
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
  }),

  helpModal,

})

export default store
