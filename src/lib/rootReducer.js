import { combineReducers } from 'redux'
import routes from './routesReducer'

import sideMenu from '../modules/UI/components/SideMenu/reducer'
import transactionList from '../modules/UI/scenes/TransactionList/reducer'
import scan from '../modules/UI/scenes/Scan/reducer'
import controlPanel from '../modules/UI/components/ControlPanel/reducer'
import walletList from '../modules/UI/scenes/WalletList/reducer'
import walletTransferListReducer from '../modules/UI/scenes/WalletTransferList/reducer'
import addWallet from '../modules/UI/scenes/AddWallet/reducer'
import { sendConfirmation } from '../modules/UI/scenes/SendConfirmation/reducer'

import container from '../modules/reducer'
import exchangeRate from '../modules/UI/components/ExchangeRate/reducer'
import transactionAlert from '../modules/UI/components/TransactionAlert/reducer.js'
import walletListModal from '../modules/UI/components/WalletListModal/reducer'
import dimensions from '../modules/UI/dimensions/reducer'

import { airbitz, account } from '../modules/Login/reducer.js'

import { wallets } from '../modules/Wallets/reducer.js'
import { helpModal } from '../modules/UI/components/HelpModal/reducer.js'
import { request } from '../modules/Request/reducer.js'

import { walletsUI } from '../modules/UI/Wallets/reducer.js'
import { requestUI } from '../modules/UI/scenes/Request/reducer.js'

const store = combineReducers({
  routes,
  airbitz,
  account,

  wallets,
  exchangeRate,
  request,

  ui: combineReducers({
    scan,
    sendConfirmation,
    transactionList,
    controlPanel,
    walletList,
    walletTransferList: walletTransferListReducer,
    walletListModal,
    wallets: walletsUI,
    sideMenu,
    addWallet,
    requestUI,
    main: container,
    dimensions

  }),

  helpModal,
  transactionAlert

})

export default store
