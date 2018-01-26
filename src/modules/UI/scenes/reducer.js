// @flow

import { combineReducers } from 'redux'

import scan from './Scan/reducer'
import sendConfirmation from './SendConfirmation/reducer'
import transactionList from './TransactionList/reducer'
import transactionDetails from './TransactionDetails/reducer'
import walletList from './WalletList/reducer'
import { walletTransferListReducer as walletTransferList } from './WalletTransferList/reducer'
import request from './Request/reducer.js'
import createWallet from './CreateWallet/reducer'
import editToken from './EditToken/reducer'

import controlPanel from '../components/ControlPanel/reducer.js'
import sideMenu from '../components/SideMenu/reducer'
import { helpModal } from '../components/HelpModal/reducer.js'
import ABAlert from '../components/ABAlert/reducer'
import transactionAlert from '../components/TransactionAlert/reducer.js'
import walletListModal from '../components/WalletListModal/reducer'
import exchangeRate from '../components/ExchangeRate/reducer.js'
import dimensions from '../dimensions/reducer'

export const scenes = combineReducers({
  scan,
  sendConfirmation,
  transactionList,
  transactionDetails,
  controlPanel,
  walletList,
  walletTransferList,
  walletListModal,
  sideMenu,
  createWallet,
  editToken,
  request,
  dimensions,
  helpModal,
  transactionAlert,
  exchangeRate,
  ABAlert
})
