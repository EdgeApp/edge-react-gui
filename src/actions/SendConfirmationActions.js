// @flow

import { bns } from 'biggystring'
import type { EdgeCurrencyWallet, EdgeMetadata, EdgeParsedUri, EdgeSpendInfo, EdgeTransaction } from 'edge-core-js'
import * as React from 'react'
import { Alert } from 'react-native'
import { Actions } from 'react-native-router-flux'
import { sprintf } from 'sprintf-js'

import { selectWalletForExchange } from '../actions/CryptoExchangeActions.js'
import { ButtonsModal } from '../components/modals/ButtonsModal.js'
import { ThreeButtonSimpleConfirmationModal } from '../components/modals/ThreeButtonSimpleConfirmationModal.js'
import { Airship, showError } from '../components/services/AirshipInstance.js'
import { EXCHANGE_SCENE, FEE_ALERT_THRESHOLD, FIO_STR, PLUGIN_BUY, SEND_CONFIRMATION, TRANSACTION_DETAILS } from '../constants/indexConstants'
import { getSymbolFromCurrency } from '../constants/WalletAndCurrencyConstants.js'
import s from '../locales/strings.js'
import { addToFioAddressCache, recordSend } from '../modules/FioAddress/util'
import { getExchangeDenomination as settingsGetExchangeDenomination } from '../modules/Settings/selectors.js'
import { getAuthRequired, getSpendInfo, getTransaction } from '../modules/UI/scenes/SendConfirmation/selectors'
import type { AuthType } from '../modules/UI/scenes/SendConfirmation/selectors.js'
import { convertCurrencyFromExchangeRates, getExchangeRate, getSelectedCurrencyCode, getSelectedWallet, getSelectedWalletId } from '../modules/UI/selectors.js'
import { type GuiMakeSpendInfo } from '../reducers/scenes/SendConfirmationReducer.js'
import type { Dispatch, GetState } from '../types/reduxTypes.js'
import { convertNativeToExchange } from '../util/utils'
import { playSendSound } from './SoundActions.js'

export type FioSenderInfo = {
  fioAddress: string,
  fioWallet: EdgeCurrencyWallet | null,
  fioError: string,
  memo: string,
  memoError: string,
  skipRecord?: boolean
}

export const newSpendInfo = (spendInfo: EdgeSpendInfo, authRequired: AuthType) => ({
  type: 'UI/SEND_CONFIMATION/NEW_SPEND_INFO',
  data: { spendInfo, authRequired }
})

export const reset = () => ({
  type: 'UI/SEND_CONFIMATION/RESET'
})

export const updateTransaction = (transaction: ?EdgeTransaction, guiMakeSpendInfo: ?GuiMakeSpendInfo, forceUpdateGui: ?boolean, error: ?Error) => ({
  type: 'UI/SEND_CONFIMATION/UPDATE_TRANSACTION',
  data: { transaction, guiMakeSpendInfo, forceUpdateGui, error }
})

export const updateSpendPending = (pending: boolean) => ({
  type: 'UI/SEND_CONFIMATION/UPDATE_SPEND_PENDING',
  data: { pending }
})

export const newPin = (pin: string) => ({
  type: 'UI/SEND_CONFIMATION/NEW_PIN',
  data: { pin }
})

export const toggleCryptoOnTop = () => ({
  type: 'UI/SEND_CONFIMATION/TOGGLE_CRYPTO_ON_TOP',
  data: null
})

export const updateAmount = (nativeAmount: string, exchangeAmount: string, fiatPerCrypto: string, forceUpdateGui?: boolean = false) => (
  dispatch: Dispatch,
  getState: GetState
) => {
  const amountFiatString: string = bns.mul(exchangeAmount, fiatPerCrypto)
  const amountFiat: number = parseFloat(amountFiatString)
  const metadata: EdgeMetadata = { amountFiat }
  dispatch(sendConfirmationUpdateTx({ nativeAmount, metadata }, forceUpdateGui))
}

type EdgePaymentProtocolUri = EdgeParsedUri & { paymentProtocolURL: string }

const BITPAY = {
  domain: 'bitpay.com',
  merchantName: (memo: string) => {
    // Example BitPay memo
    // "Payment request for BitPay invoice DKffym7WxX6kzJ73yfYS7s for merchant Electronic Frontier Foundation"
    // eslint-disable-next-line no-unused-vars
    const [_, merchantName] = memo.split(' for merchant ')
    return merchantName
  }
}

export const paymentProtocolUriReceived = ({ paymentProtocolURL }: EdgePaymentProtocolUri) => (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const { currencyWallets = {} } = state.core.account

  const walletId = getSelectedWalletId(state)
  const edgeWallet = currencyWallets[walletId]

  Promise.resolve(paymentProtocolURL)
    .then(paymentProtocolURL => edgeWallet.getPaymentProtocolInfo(paymentProtocolURL))
    .then(paymentProtocolInfo => {
      const { domain, memo, nativeAmount, spendTargets } = paymentProtocolInfo

      const name = domain === BITPAY.domain ? BITPAY.merchantName(memo) : domain
      const notes = memo

      const guiMakeSpendInfo: GuiMakeSpendInfo = {
        networkFeeOption: 'standard',
        metadata: {
          name,
          notes
        },
        nativeAmount,
        spendTargets,
        otherParams: { paymentProtocolInfo }
      }
      guiMakeSpendInfo.lockInputs = true
      Actions[SEND_CONFIRMATION]({ guiMakeSpendInfo })
    })
    .catch((error: Error) => {
      console.log(error)
      setTimeout(
        () => Alert.alert(s.strings.scan_invalid_address_error_title, s.strings.scan_invalid_address_error_description, [{ text: s.strings.string_ok }]),
        500
      )
    })
}

export const sendConfirmationUpdateTx = (guiMakeSpendInfo: GuiMakeSpendInfo | EdgeParsedUri, forceUpdateGui?: boolean = true) => async (
  dispatch: Dispatch,
  getState: GetState
) => {
  const state = getState()
  const { currencyWallets = {} } = state.core.account

  const walletId = getSelectedWalletId(state)
  const edgeWallet = currencyWallets[walletId]
  const guiMakeSpendInfoClone = { ...guiMakeSpendInfo }
  const spendInfo = getSpendInfo(state, guiMakeSpendInfoClone)

  const authRequired = getAuthRequired(state, spendInfo)
  dispatch(newSpendInfo(spendInfo, authRequired))

  await edgeWallet
    .makeSpend(spendInfo)
    .then(edgeTransaction => {
      return dispatch(updateTransaction(edgeTransaction, guiMakeSpendInfoClone, forceUpdateGui, null))
    })
    .catch(e => {
      console.log(e)
      if (e.name === 'InsufficientFundsError' && e.currencyCode != null && spendInfo.currencyCode !== e.currencyCode) {
        const createBuyExchangeModal = (currencyCode: string) => {
          return Airship.show(bridge => (
            <ThreeButtonSimpleConfirmationModal
              bridge={bridge}
              title={s.strings.buy_crypto_modal_title}
              subTitle={sprintf(s.strings.buy_parent_crypto_modal_message, currencyCode)}
              cancelText={s.strings.buy_crypto_decline}
              oneText={sprintf(s.strings.buy_crypto_modal_buy_action, currencyCode)}
              twoText={s.strings.buy_crypto_modal_exchange}
            />
          ))
        }
        createBuyExchangeModal(e.currencyCode).then(result => {
          switch (result) {
            case 'one':
              Actions.jump(PLUGIN_BUY)
              return
            case 'two':
              dispatch(selectWalletForExchange(walletId, e.currencyCode, 'to'))
              Actions.jump(EXCHANGE_SCENE)
              break
            default:
              break
          }
        })
      }
      return dispatch(updateTransaction(null, guiMakeSpendInfoClone, forceUpdateGui, e))
    })
}

export const updateMaxSpend = () => (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const { currencyWallets = {} } = state.core.account

  const walletId = getSelectedWalletId(state)
  const edgeWallet = currencyWallets[walletId]
  const spendInfo = getSpendInfo(state)

  edgeWallet
    .getMaxSpendable(spendInfo)
    .then(nativeAmount => {
      const state = getState()
      const spendInfo = getSpendInfo(state, { nativeAmount })
      const authRequired = getAuthRequired(state, spendInfo)

      const guiWallet = getSelectedWallet(state)
      const currencyCode = getSelectedCurrencyCode(state)
      const isoFiatCurrencyCode = guiWallet.isoFiatCurrencyCode
      const exchangeDenomination = settingsGetExchangeDenomination(state, currencyCode)

      const exchangeAmount = convertNativeToExchange(exchangeDenomination.multiplier)(nativeAmount)
      const fiatPerCrypto = getExchangeRate(state, currencyCode, isoFiatCurrencyCode)

      dispatch(reset())

      dispatch(toggleCryptoOnTop())

      dispatch(newSpendInfo(spendInfo, authRequired))

      dispatch(updateAmount(nativeAmount, exchangeAmount, fiatPerCrypto.toString(), true))
    })
    .catch(showError)
}

export const signBroadcastAndSave = (fioSender?: FioSenderInfo) => async (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const { account } = state.core
  const { currencyWallets = {} } = account

  const selectedWalletId = getSelectedWalletId(state)
  const wallet = currencyWallets[selectedWalletId]
  const edgeUnsignedTransaction: EdgeTransaction = getTransaction(state)

  const guiWallet = getSelectedWallet(state)
  const currencyCode = getSelectedCurrencyCode(state)
  const isoFiatCurrencyCode = guiWallet.isoFiatCurrencyCode
  const exchangeDenomination = settingsGetExchangeDenomination(state, currencyCode)

  const exchangeAmount = convertNativeToExchange(exchangeDenomination.multiplier)(edgeUnsignedTransaction.nativeAmount)
  const fiatPerCrypto = getExchangeRate(state, currencyCode, isoFiatCurrencyCode).toString()
  const amountFiatString = bns.abs(bns.mul(exchangeAmount, fiatPerCrypto))
  const amountFiat = parseFloat(amountFiatString)

  const spendInfo = state.ui.scenes.sendConfirmation.spendInfo
  const guiMakeSpendInfo = state.ui.scenes.sendConfirmation.guiMakeSpendInfo

  if (guiMakeSpendInfo.beforeTransaction) {
    dispatch(updateSpendPending(true))
    try {
      guiMakeSpendInfo.beforeTransaction && (await guiMakeSpendInfo.beforeTransaction())
    } catch (e) {
      dispatch(updateSpendPending(false))
      return
    }
    dispatch(updateSpendPending(false))
  }

  if (!spendInfo) throw new Error(s.strings.invalid_spend_request)
  const authRequired = getAuthRequired(state, spendInfo)
  const pin = state.ui.scenes.sendConfirmation.pin

  // check hwo high fee is and decide whether to display warninig
  const exchangeConverter = convertNativeToExchange(exchangeDenomination.multiplier)
  const cryptoFeeExchangeAmount = exchangeConverter(edgeUnsignedTransaction.networkFee)
  const feeAmountInUSD = convertCurrencyFromExchangeRates(state.exchangeRates, currencyCode, 'iso:USD', parseFloat(cryptoFeeExchangeAmount))
  const feeAmountInWalletFiat = convertCurrencyFromExchangeRates(state.exchangeRates, currencyCode, isoFiatCurrencyCode, parseFloat(cryptoFeeExchangeAmount))
  const feeAmountInWalletFiatShortened = feeAmountInWalletFiat.toFixed(2)
  const walletFiatSymbol = getSymbolFromCurrency(isoFiatCurrencyCode)
  const feeAmountInWalletFiatSyntax = `${walletFiatSymbol}${feeAmountInWalletFiatShortened}`
  if (feeAmountInUSD > FEE_ALERT_THRESHOLD) {
    const feeAlertResponse = await displayFeeAlert(feeAmountInWalletFiatSyntax)
    if (!feeAlertResponse) {
      dispatch(updateTransaction(edgeUnsignedTransaction, guiMakeSpendInfo, true, new Error('transactionCancelled')))
      return
    }
  }

  dispatch(updateSpendPending(true))
  let edgeSignedTransaction: EdgeTransaction = edgeUnsignedTransaction
  try {
    if (authRequired === 'pin') {
      const isAuthorized = await account.checkPin(pin)
      if (!isAuthorized) throw new IncorrectPinError()
    }
    edgeSignedTransaction = await wallet.signTx(edgeUnsignedTransaction)
    edgeSignedTransaction = await wallet.broadcastTx(edgeSignedTransaction)
    await wallet.saveTx(edgeSignedTransaction)
    let edgeMetadata = { ...spendInfo.metadata }
    if (state.ui.scenes.sendConfirmation.transactionMetadata) {
      edgeMetadata = { ...edgeMetadata, ...state.ui.scenes.sendConfirmation.transactionMetadata }
    }
    if (guiMakeSpendInfo.fioAddress) {
      edgeMetadata.name = guiMakeSpendInfo.fioAddress
    }
    const publicAddress = spendInfo ? spendInfo.spendTargets[0].publicAddress : ''
    if (!edgeMetadata.amountFiat) {
      edgeMetadata.amountFiat = amountFiat
    }
    if (guiMakeSpendInfo.fioAddress && fioSender) {
      let fioNotes = `${s.strings.fragment_transaction_list_sent_prefix}${s.strings.fragment_send_from_label.toLowerCase()} ${fioSender.fioAddress}`
      fioNotes += fioSender.memo ? `\n${s.strings.fio_sender_memo_label}: ${fioSender.memo}` : ''
      edgeMetadata.notes = `${fioNotes}\n${edgeMetadata.notes || ''}`
    }
    await wallet.saveTxMetadata(edgeSignedTransaction.txid, edgeSignedTransaction.currencyCode, edgeMetadata)

    edgeSignedTransaction.metadata = edgeMetadata
    edgeSignedTransaction.wallet = wallet

    if (guiMakeSpendInfo.fioAddress) {
      addToFioAddressCache(account, [guiMakeSpendInfo.fioAddress])
    }

    // fio
    if (fioSender) {
      const { fioAddress, fioWallet, memo, skipRecord } = fioSender
      const payeeFioAddress = guiMakeSpendInfo.fioAddress
      if (payeeFioAddress && fioAddress && fioWallet) {
        if (guiMakeSpendInfo.fioPendingRequest) {
          const { fioPendingRequest: pendingRequest } = guiMakeSpendInfo
          try {
            await recordSend(fioWallet, fioAddress, {
              fioRequestId: pendingRequest.fio_request_id,
              payeeFioAddress: pendingRequest.payee_fio_address,
              payerPublicAddress: pendingRequest.payer_fio_public_key,
              payeePublicAddress: pendingRequest.content.payee_public_address,
              amount: pendingRequest.content.amount,
              currencyCode: pendingRequest.content.token_code.toUpperCase(),
              chainCode: pendingRequest.content.chain_code.toUpperCase(),
              txid: edgeSignedTransaction.txid,
              memo
            })
          } catch (e) {
            showError(e)
          }
        } else if ((guiMakeSpendInfo.publicAddress || publicAddress) && (!skipRecord || edgeSignedTransaction.currencyCode === FIO_STR)) {
          const payerPublicAddress = wallet.publicWalletInfo.keys.publicKey
          const amount = guiMakeSpendInfo.nativeAmount || '0'
          let chainCode
          if (edgeSignedTransaction.wallet && edgeSignedTransaction.wallet.currencyInfo) {
            chainCode = edgeSignedTransaction.wallet.currencyInfo.currencyCode
          }
          try {
            recordSend(fioWallet, fioAddress, {
              payeeFioAddress,
              payerPublicAddress,
              payeePublicAddress: guiMakeSpendInfo.publicAddress || publicAddress || '',
              amount: amount && bns.div(amount, exchangeDenomination.multiplier, 18),
              currencyCode: edgeSignedTransaction.currencyCode,
              chainCode: chainCode || guiWallet.currencyCode,
              txid: edgeSignedTransaction.txid,
              memo
            })
          } catch (e) {
            showError(e)
          }
        }
      }
    }
    dispatch(updateSpendPending(false))

    playSendSound().catch(error => console.log(error)) // Fail quietly
    if (!guiMakeSpendInfo.dismissAlert) {
      Alert.alert(s.strings.transaction_success, s.strings.transaction_success_message, [
        {
          onPress() {},
          style: 'default',
          text: s.strings.string_ok
        }
      ])
    }

    if (guiMakeSpendInfo.onDone) {
      guiMakeSpendInfo.onDone(null, edgeSignedTransaction)
    } else {
      Actions.replace(TRANSACTION_DETAILS, { edgeTransaction: edgeSignedTransaction })
    }
  } catch (e) {
    console.log(e)
    dispatch(updateSpendPending(false))
    let message = sprintf(s.strings.transaction_failure_message, e.message)
    if (e.name === 'ErrorEosInsufficientCpu') {
      message = s.strings.send_confirmation_eos_error_cpu
    } else if (e.name === 'ErrorEosInsufficientNet') {
      message = s.strings.send_confirmation_eos_error_net
    } else if (e.name === 'ErrorEosInsufficientRam') {
      message = s.strings.send_confirmation_eos_error_ram
    }

    Alert.alert(s.strings.transaction_failure, message, [
      {
        onPress() {},
        style: 'default',
        text: s.strings.string_ok
      }
    ])
  }
}

const errorNames = {
  IncorrectPinError: 'IncorrectPinError'
}
export function IncorrectPinError(message: ?string = s.strings.incorrect_pin) {
  const error = new Error(message)
  error.name = errorNames.IncorrectPinError
  return error
}

export const displayFeeAlert = async (feeAmountInFiatSyntax: string) => {
  const resolveValue = await Airship.show(bridge => (
    <ButtonsModal
      bridge={bridge}
      title={s.strings.send_confirmation_fee_modal_alert_title}
      message={`${s.strings.send_confirmation_fee_modal_alert_message_fragment_1} ${feeAmountInFiatSyntax} ${s.strings.send_confirmation_fee_modal_alert_message_fragment_2}`}
      buttons={{
        confirm: { label: s.strings.title_send },
        cancel: { label: s.strings.string_cancel_cap, type: 'secondary' }
      }}
    />
  ))

  console.log('resolveValue is: ', resolveValue)
  return resolveValue === 'confirm'
}

export const getAuthRequiredDispatch = (spendInfo: EdgeSpendInfo) => (dispatch: Dispatch, getState: GetState) => {
  return getAuthRequired(getState(), spendInfo)
}
