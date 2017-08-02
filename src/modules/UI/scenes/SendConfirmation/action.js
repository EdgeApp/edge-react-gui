const PREFIX = 'UI/SendConfimation/'
export const UPDATE_AMOUNT_SATOSHI = PREFIX + 'UPDATE_AMOUNT_SATOSHI'
export const UPDATE_AMOUNT_FIAT = PREFIX + 'UPDATE_AMOUNT_FIAT'
export const UPDATE_FIAT_PER_CRYPTO = PREFIX + 'UPDATE_FIAT_PER_CRYPTO'
export const UPDATE_INPUT_CURRENCY_SELECTED = PREFIX + 'UPDATE_INPUT_CURRENCY_SELECTED'
export const UPDATE_LABEL = PREFIX + 'UPDATE_LABEL'
export const UPDATE_MAX_AVAILABLE_TO_SPEND_IN_CRYPTO = PREFIX + 'UPDATE_MAX_AVAILABLE_TO_SPEND_IN_CRYPTO'
export const ENABLE_SLIDER = PREFIX + 'ENABLE_SLIDER'
export const UPDATE_DRAFT_STATUS = PREFIX + 'UPDATE_DRAFT_STATUS'
export const UPDATE_IS_KEYBOARD_VISIBLE = PREFIX + 'UPDATE_IS_KEYBOARD_VISIBLE'
export const UPDATE_FEE = PREFIX + 'UPDATE_FEE'
export const UPDATE_MAX_SATOSHI = PREFIX + 'UPDATE_MAX_SATOSHI'
export const UPDATE_SPEND_PENDING = PREFIX + 'UPDATE_SPEND_PENDING'
export const UPDATE_SPEND_SUFFICIENT_FUNDS = PREFIX + 'UPDATE_SPEND_SUFFICIENT_FUNDS'

export const UPDATE_PARSED_URI = PREFIX + 'UPDATE_PARSED_URI'
export const UPDATE_TRANSACTION = PREFIX + 'UPDATE_TRANSACTION'

export const UPDATE_WALLET_TRANSFER = PREFIX + 'UPDATE_WALLET_TRANSFER'
export const UPDATE_PUBLIC_ADDRESS = PREFIX + 'UPDATE_PUBLIC_ADDRESS'
export const UPDATE_SPEND_INFO = PREFIX + 'UPDATE_SPEND_INFO'
export const RESET = PREFIX + 'RESET'

import { Actions } from 'react-native-router-flux'
import { openABAlert } from '../../components/ABAlert/action'
import * as CORE_SELECTORS from '../../../Core/selectors.js'
import * as UI_SELECTORS from '../../../UI/selectors.js'
import * as WALLET_API from '../../../Core/Wallets/api.js'

export const updateAmountSatoshiRequest = (amountCryptoString) => {
  return (dispatch, getState) => {
    const amountSatoshi = parseFloat(amountCryptoString)
    dispatch(updateAmountSatoshi(amountSatoshi))
    if (amountSatoshi === 0) return

    const state = getState()
    const selectedWalletId = UI_SELECTORS.getSelectedWalletId(state)
    const wallet = CORE_SELECTORS.getWallet(state, selectedWalletId)
    const currencyCode = UI_SELECTORS.getSelectedCurrencyCode(state)

    const { publicAddress } = state.ui.scenes.sendConfirmation
    const spendInfo = makeSpendInfo({ nativeAmount: amountSatoshi, publicAddress, currencyCode })

    WALLET_API.makeSpend(wallet, spendInfo)
    .then(transaction => {
      const { providerFee = 0, networkFee = 0 } = transaction
      const feeTotal = providerFee + networkFee
      dispatch(updateTransaction(transaction))
      dispatch(updateFee(feeTotal))
      dispatch(updateSpendSufficientFunds(null))
    })
    .catch(e => {
      if (e.name === 'InsufficientFundsError') {
        console.log('make text red!')
        dispatch(updateSpendSufficientFunds('over'))
      }
    })
  }
}

export const updateSpendSufficientFunds = mode => {
  return {
    type: UPDATE_SPEND_SUFFICIENT_FUNDS,
    data: { mode }
  }
}

export const updateAmountSatoshi = amountSatoshi => {
  return {
    type: UPDATE_AMOUNT_SATOSHI,
    data: { amountSatoshi }
  }
}

export const updateFee = feeSatoshi => {
  return {
    type: UPDATE_FEE,
    data: { feeSatoshi }
  }
}

export const updateAmountFiat = amountFiat => {
  return {
    type: UPDATE_AMOUNT_FIAT,
    data: { amountFiat }
  }
}

export const updateFiatPerCrypto = fiatPerCrypto => {
  return {
    type: UPDATE_FIAT_PER_CRYPTO,
    data: { fiatPerCrypto }
  }
}

export const updateInputCurrencySelected = inputCurrencySelected => {
  return {
    type: UPDATE_INPUT_CURRENCY_SELECTED,
    data: { inputCurrencySelected }
  }
}

export const updateDraftStatus = draftStatus => {
  return {
    type: UPDATE_DRAFT_STATUS,
    data: { draftStatus }
  }
}

export const updateTransaction = (transaction) => {
  return {
    type: UPDATE_TRANSACTION,
    data: { transaction }
  }
}

export const updateSpendPending = pending => {
  return {
    type: UPDATE_SPEND_PENDING,
    data: { pending }
  }
}

export const signBroadcastAndSave = unsignedTransaction => {
  return (dispatch, getState) => {
    const state = getState()
    const selectedWalletId = UI_SELECTORS.getSelectedWalletId(state)
    const wallet = CORE_SELECTORS.getWallet(state, selectedWalletId)
    let alertSyntax

    // TODO: refactor this to use WALLET_API
    wallet.signTx(unsignedTransaction)
    .then(transaction => {
      console.log('broadcast transaction', transaction)
      return wallet.broadcastTx(transaction).then(() =>
        wallet.saveTx(transaction)
      )
    })
    .then(() => {
      dispatch(updateSpendPending(false))
      Actions.transactionList()
      alertSyntax = { title: 'Transaction Sent', message: 'Your transaction has been successfully sent.' }
      dispatch(openABAlert(alertSyntax))
    })
    .catch(e => {
      console.log('error is: ', e)
      dispatch(updateSpendPending(false))
      alertSyntax = { title: 'Transaction Failure', message: e.message }
      dispatch(openABAlert(alertSyntax))
    })
  }
}

export const updateMaxSatoshiRequest = () => {
  return (dispatch, getState) => {
    const state = getState()
    const selectedWalletId = UI_SELECTORS.getSelectedWalletId(state)
    const wallet = CORE_SELECTORS.getWallet(state, selectedWalletId)

    wallet.getMaxSpendable()
    .then(amountSatoshi => {
      dispatch(updateMaxSatoshi(amountSatoshi))
    })
  }
}

export const updateMaxSatoshi = maxSatoshi => {
  return {
    type: UPDATE_MAX_SATOSHI,
    data: { maxSatoshi }
  }
}

export const useMaxSatoshi = () => {
  return (dispatch, getState) => {
    const state = getState()
    const { maxSatoshi } = state.ui.scenes.sendConfirmation
    dispatch(updateAmountSatoshi(maxSatoshi))
  }
}

export const updateWalletTransfer = (wallet) => {
  return (dispatch) => {
    const spendInfo = makeSpendInfo({
      wallet
    })

    dispatch(updateLabel(wallet.name))
  }
}

export const updatePublicAddressRequest = (publicAddress) => {
  return (dispatch) => {
    dispatch(updatePublicAddress(publicAddress))
  }
}

export const updatePublicAddress = publicAddress => {
  return {
    type: UPDATE_PUBLIC_ADDRESS,
    data: { publicAddress }
  }
}

export const processURI = (uri) => {
  return (dispatch, getState) => {
    console.log('uri', uri)
    const state = getState()
    const walletId = UI_SELECTORS.getSelectedWalletId(state)
    const wallet = CORE_SELECTORS.getWallet(state, walletId)

    try {
      const parsedURI = WALLET_API.parseURI(wallet, uri)
      dispatch(updateParsedURI(parsedURI))

      const {
        publicAddress,
        nativeAmount,
        metadata
      } = parsedURI
      const currencyCode = UI_SELECTORS.getSelectedCurrencyCode(state)
      const spendInfo = makeSpendInfo({
        publicAddress,
        nativeAmount,
        metadata,
        currencyCode
      })

      return wallet.makeSpend(spendInfo).then(transaction => {
        dispatch(updateTransaction(transaction))
      })
    } catch (e) {
      console.log(e)
    }
  }
}

export const updateParsedURI = (parsedURI) => {
  return {
    type: UPDATE_PARSED_URI,
    data: { parsedURI }
  }
}
export const updateLabel = label => {
  return {
    type: UPDATE_LABEL,
    data: { label }
  }
}

export const reset = () => {
  return {
    type: RESET,
    data: {}
  }
}

const makeSpendInfo = ({ nativeAmount = '0', publicAddress = '', currencyCode = '', wallet, metadata = {} }) => {
  const spendTargets = [{ wallet, publicAddress, nativeAmount }]
  const spendInfo = {
    currencyCode,
    metadata,
    spendTargets
  }
  return spendInfo
}
