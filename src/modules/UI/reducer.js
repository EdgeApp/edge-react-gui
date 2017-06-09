import { combineReducers } from 'redux'
import scan from './scenes/Scan/reducer'
import { sendConfirmation } from './scenes/SendConfirmation/reducer'
import transactionList from './scenes/TransactionList/reducer'
import controlPanel from './components/ControlPanel/reducer'
import walletList from './scenes/WalletList/reducer'
import walletTransferListReducer from './scenes/WalletTransferList/reducer'
import { walletsUI } from './Wallets/reducer.js'
import { requestUI } from './scenes/Request/reducer.js'
import sideMenu from './components/SideMenu/reducer'
import addWallet from './scenes/AddWallet/reducer'
import { helpModal } from './components/HelpModal/reducer.js'
import { request } from './Request/reducer.js'
import transactionAlert from './components/TransactionAlert/reducer.js'
import walletListModal from './components/WalletListModal/reducer'
import dimensions from './dimensions/reducer'
import exchangeRate from './components/ExchangeRate/reducer.js'

export const ui = combineReducers({
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
  dimensions,
  helpModal,
  transactionAlert,
  request,
  exchangeRate
})
