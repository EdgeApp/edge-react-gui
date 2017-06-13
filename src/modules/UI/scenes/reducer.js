import { combineReducers } from 'redux'
import scan from './Scan/reducer'
import { sendConfirmation } from './SendConfirmation/reducer'
import transactionList from './TransactionList/reducer'
import walletList from './WalletList/reducer'
import walletTransferListReducer from './WalletTransferList/reducer'
import { request } from './Request/reducer.js'
import addWallet from './AddWallet/reducer'

import controlPanel from '../components/ControlPanel/reducer.js'
import sideMenu from '../components/SideMenu/reducer'
import { helpModal } from '../components/HelpModal/reducer.js'
import transactionAlert from '../components/TransactionAlert/reducer.js'
import walletListModal from '../components/WalletListModal/reducer'
import exchangeRate from '../components/ExchangeRate/reducer.js'
import dimensions from '../dimensions/reducer'

export const scenes = combineReducers({
  scan,
  sendConfirmation,
  transactionList,
  controlPanel,
  walletList,
  walletTransferList: walletTransferListReducer,
  walletListModal,
  sideMenu,
  addWallet,
  request,
  dimensions,
  helpModal,
  transactionAlert,
  exchangeRate
})
