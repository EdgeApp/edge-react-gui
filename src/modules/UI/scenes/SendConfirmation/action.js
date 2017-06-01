export const UPDATE_AMOUNT_SATOSHI = 'UPDATE_AMOUNT_SATOSHI'
export const UPDATE_AMOUNT_FIAT = 'UPDATE_AMOUNT_FIAT'
export const UPDATE_FIAT_PER_CRYPTO = 'UPDATE_FIAT_PER_CRYPTO'
export const UPDATE_INPUT_CURRENCY_SELECTED = 'UPDATE_INPUT_CURRENCY_SELECTED'
export const UPDATE_LABEL = 'UPDATE_LABEL'
export const UPDATE_MAX_AVAILABLE_TO_SPEND_IN_CRYPTO = 'UPDATE_MAX_AVAILABLE_TO_SPEND_IN_CRYPTO'
export const ENABLE_SLIDER = 'ENABLE_SLIDER'
export const UPDATE_DRAFT_STATUS = 'UPDATE_DRAFT_STATUS'
export const UPDATE_IS_KEYBOARD_VISIBLE = 'UPDATE_IS_KEYBOARD_VISIBLE'
export const UPDATE_URI_SUCCESS = 'UPDATE_URI_SUCCESS'
export const UPDATE_TRANSACTION = 'UPDATE_TRANSACTION'
export const UPDATE_FEE = 'UPDATE_FEE'
export const UPDATE_MAX_SATOSHI = 'UPDATE_MAX_SATOSHI'

export const UPDATE_WALLET_TRANSFER = 'UPDATE_WALLET_TRANSFER'
export const UPDATE_PUBLIC_ADDRESS = 'UPDATE_PUBLIC_ADDRESS'
export const UPDATE_SPEND_INFO = 'UPDATE_SPEND_INFO'
export const RESET = 'RESET'

import { Actions } from 'react-native-router-flux'

export const updateAmountSatoshiRequest = amountSatoshi => {
  return (dispatch, getState) => {
    dispatch(updateAmountSatoshi(amountSatoshi))
    if (amountSatoshi == 0) return

    const state = getState()
    const wallet = getSelectedWallet(state)

    const { publicAddress } = state.ui.sendConfirmation
    const spendInfo = makeSpendInfo({ amountSatoshi, publicAddress })

    wallet.makeSpend(spendInfo)
    .then(transaction => {
      const { providerFee = 0, networkFee = 0 } = transaction
      const feeTotal = providerFee + networkFee

      dispatch(updateTransaction(transaction))
      dispatch(updateFee(feeTotal))
    })
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

export const updateTransaction = transaction => {
  return {
    type: UPDATE_TRANSACTION,
    data: { transaction }
  }
}

export const signBroadcastAndSave = unsignedTransaction => {
  return (dispatch, getState) => {
    const state = getState()
    const wallet = getSelectedWallet(state)

    wallet.signTx(unsignedTransaction)
    .then(transaction => {
      console.log('broadcast transaction', transaction)
      return wallet.broadcastTx(transaction)
    })
    .then(transaction => {
      return wallet.saveTx(transaction)
    })
    .then(transaction => {
      const message = 'Sent Transaction: ' + JSON.stringify(transaction)
      console.log('Sent transaction' + message)
      // dispatch(reset())
    })
    .then(() => {
      Actions.transactionList()
    })
  }
}

export const updateMaxSatoshiRequest = () => {
  return (dispatch, getState) => {
    const state = getState()
    const wallet = getSelectedWallet(state)

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
    const { maxSatoshi } = getState().ui.sendConfirmation
    dispatch(updateAmountSatoshi(maxSatoshi))
  }
}

const getSelectedWallet = state => {
  const { wallets: { byId }, ui: { wallets: { selectedWalletId } } } = state
  const selectedWallet = byId[selectedWalletId]

  return selectedWallet
}

export const updateSpendInfo = spendInfo => {
  return {
    type: UPDATE_SPEND_INFO,
    data: { spendInfo }
  }
}

export const updateWalletTransfer = (wallet) => {
  return (dispatch) => {
    const spendInfo = makeSpendInfo({
      wallet
    })

    dispatch(updateLabel(wallet.name))
    dispatch(updateSpendInfo(spendInfo))
  }
}

export const updatePublicAddress = (publicAddress) => {
  return (dispatch) => {
    const spendInfo = makeSpendInfo({
      publicAddress
    })

    dispatch(updateLabel(publicAddress))
    dispatch(updateSpendInfo(spendInfo))
  }
}

export const updateUri = ({ data: uri }) => {
  return (dispatch, getState) => {
    const { account } = getState()
    account.parseUri = uri => {
      return Promise.resolve(
        {
          metadata: {},
          amountSatoshi: 0,
          publicAddress: uri
        }
      )
    }
    account.parseUri(uri)
    .then(parsedUri => {
      const {
        metadata,
        publicAddress,
        amountSatoshi
      } = parsedUri

      const spendInfo = makeSpendInfo({
        metadata,
        publicAddress,
        amountSatoshi
      })

      dispatch(updateLabel(publicAddress))
      dispatch(updateSpendInfo(spendInfo))
    })
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

const makeSpendInfo = ({metadata = {}, wallet, publicAddress = '', amountSatoshi = 0}) => {
  const spendInfo = {
    metadata,
    spendTargets: [
      {
        wallet,
        publicAddress,
        amountSatoshi
      }
    ]
  }

  return spendInfo
}
