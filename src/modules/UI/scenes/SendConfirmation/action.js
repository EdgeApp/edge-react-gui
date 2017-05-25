export const SET_AMOUNT_REQUESTED_IN_CRYPTO = 'SET_AMOUNT_REQUESTED_IN_CRYPTO'
export const SET_AMOUNT_REQUESTED_IN_FIAT = 'SET_AMOUNT_REQUESTED_IN_FIAT'
export const SET_AMOUNT_RECEIVED_IN_CRYPTO = 'SET_AMOUNT_RECEIVED_IN_CRYPTO'
export const SET_FIAT_PER_CRYPTO = 'SET_FIAT_PER_CRYPTO'
export const SET_PUBLIC_ADDRESS = 'SET_PUBLIC_ADDRESS'
export const SET_INPUT_CURRENCY_SELECTED = 'SET_INPUT_CURRENCY_SELECTED'
export const SET_LABEL = 'SET_LABEL'
export const SET_MAX_AVAILABLE_TO_SPEND_IN_CRYPTO = 'SET_MAX_AVAILABLE_TO_SPEND_IN_CRYPTO'
export const SET_IS_PIN_ENABLED = 'SET_IS_PIN_ENABLED'
export const SET_IS_SLIDER_ENABLED = 'SET_IS_SLIDER_ENABLED'
export const SET_DRAFT_STATUS = 'SET_DRAFT_STATUS'
export const SET_IS_KEYBOARD_VISIBLE = 'SET_IS_KEYBOARD_VISIBLE'
export const UPDATE_URI_SUCCESS = 'UPDATE_URI_SUCCESS'

import { openTransactionAlert } from '../../components/TransactionAlert/action.js'

export const setAmountRequestedInCrypto = amountRequestedInCrypto => {
  return {
    type: SET_AMOUNT_REQUESTED_IN_CRYPTO,
    data: { amountRequestedInCrypto }
  }
}

export const setAmountRequestedInFiat = amountRequestedInFiat => {
  return {
    type: SET_AMOUNT_REQUESTED_IN_FIAT,
    data: { amountRequestedInFiat }
  }
}

export const setAmountReceivedInCrypto = amountReceivedInCrypto => {
  return {
    type: SET_AMOUNT_RECEIVED_IN_CRYPTO,
    data: { amountReceivedInCrypto }
  }
}

export const setFiatPerCrypto = fiatPerCrypto => {
  return {
    type: SET_FIAT_PER_CRYPTO,
    data: { fiatPerCrypto }
  }
}

export const setInputCurrencySelected = inputCurrencySelected => {
  return {
    type: SET_INPUT_CURRENCY_SELECTED,
    data: { inputCurrencySelected }
  }
}

export const setLabel = label => {
  return {
    type: SET_LABEL,
    data: { label }
  }
}

export const setMaxAvailableToSpendInCrypto = maxAvailableToSpendInCrypto => {
  return {
    type: SET_MAX_AVAILABLE_TO_SPEND_IN_CRYPTO,
    data: { maxAvailableToSpendInCrypto }
  }
}

export const setIsPinEnabled = isPinEnabled => {
  return {
    type: SET_IS_PIN_ENABLED,
    data: { isPinEnabled }
  }
}

export const setIsSliderEnabled = isSliderEnabled => {
  return {
    type: SET_IS_SLIDER_ENABLED,
    data: { isSliderEnabled }
  }
}

export const setDraftStatus = draftStatus => {
  return {
    type: SET_DRAFT_STATUS,
    data: { draftStatus }
  }
}

export const setIsKeyboardVisible = isKeyboardVisible => {
  return {
    type: SET_IS_KEYBOARD_VISIBLE,
    data: { isKeyboardVisible }
  }
}

export const makeSignBroadcastAndSave = spendInfo => {
  return (dispatch, getState) => {
    const { wallets: { byId }, ui: { wallets: { selectedWalletId } } } = getState()
    const wallet = byId[selectedWalletId]

    wallet.makeSpend(spendInfo)
    .then(transaction => {
      console.log('transaction', transaction)
      wallet.signTx(transaction)
      .then(transaction => {
        console.log('transaction', transaction)
        wallet.broadcastTx(transaction)
        .then(transaction => {
          console.log('transaction', transaction)
          wallet.saveTx(transaction)
          .then(transaction => {
            console.log('transaction', transaction)
            console.log('Sent transaction with ID = ' + transaction.txid)
            dispatch(openTransactionAlert('Sent transaction with ID = ' + transaction.txid))
          })
        })
      })
    })
  }
}
