// @flow

import { bns } from 'biggystring'
import { createYesNoModal } from 'edge-components'
import type { EdgeMetadata, EdgeParsedUri, EdgeSpendInfo, EdgeTransaction } from 'edge-core-js'
import React from 'react'
import { Alert } from 'react-native'
import { Actions } from 'react-native-router-flux'
import { sprintf } from 'sprintf-js'

import { launchModal } from '../components/common/ModalProvider.js'
import { showError } from '../components/services/AirshipInstance.js'
import { EXCLAMATION, FEE_ALERT_THRESHOLD, MATERIAL_COMMUNITY, SEND_CONFIRMATION, TRANSACTION_DETAILS } from '../constants/indexConstants'
import { getSpecialCurrencyInfo, getSymbolFromCurrency } from '../constants/WalletAndCurrencyConstants.js'
import s from '../locales/strings.js'
import { getAccount, getWallet } from '../modules/Core/selectors.js'
import { getExchangeDenomination as settingsGetExchangeDenomination } from '../modules/Settings/selectors.js'
import Text from '../modules/UI/components/FormattedText/FormattedText.ui.js'
import { Icon } from '../modules/UI/components/Icon/Icon.ui.js'
import { getAuthRequired, getSpendInfo, getTransaction } from '../modules/UI/scenes/SendConfirmation/selectors'
import type { AuthType } from '../modules/UI/scenes/SendConfirmation/selectors.js'
import { convertCurrencyFromExchangeRates, getExchangeRate, getSelectedCurrencyCode, getSelectedWallet, getSelectedWalletId } from '../modules/UI/selectors.js'
import { type GuiMakeSpendInfo } from '../reducers/scenes/SendConfirmationReducer.js'
import { B } from '../styles/common/textStyles.js'
import type { Dispatch, GetState } from '../types/reduxTypes.js'
import { convertNativeToExchange } from '../util/utils'
import { playSendSound } from './SoundActions.js'

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
  const walletId = getSelectedWalletId(state)
  const edgeWallet = getWallet(state, walletId)

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
  const walletId = getSelectedWalletId(state)
  const edgeWallet = getWallet(state, walletId)
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
      return dispatch(updateTransaction(null, guiMakeSpendInfoClone, forceUpdateGui, e))
    })
}

export const updateMaxSpend = () => (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const walletId = getSelectedWalletId(state)
  const edgeWallet = getWallet(state, walletId)
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

export const signBroadcastAndSave = () => async (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const account = getAccount(state)
  const selectedWalletId = getSelectedWalletId(state)
  const wallet = getWallet(state, selectedWalletId)
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

  try {
    if (guiMakeSpendInfo.beforeTransaction) {
      await guiMakeSpendInfo.beforeTransaction()
    }
  } catch (e) {
    return
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
    if (publicAddress) {
      if (edgeMetadata.notes) {
        edgeMetadata.notes += `\n${s.strings.tx_notes_metadata_recipient_address + publicAddress}`
      } else {
        edgeMetadata.notes = s.strings.tx_notes_metadata_recipient_address + publicAddress
      }
    }
    if (!edgeMetadata.amountFiat) {
      edgeMetadata.amountFiat = amountFiat
    }
    if (getSpecialCurrencyInfo(currencyCode).uniqueIdentifierToNotes && edgeSignedTransaction.otherParams != null) {
      const newNotesSyntax = sprintf(
        s.strings.tx_notes_metadata,
        s.strings.unique_identifier_payment_id,
        edgeSignedTransaction.otherParams.sendParams.paymentId,
        edgeSignedTransaction.otherParams.sendParams.targetAddress
      )
      if (edgeMetadata.notes) {
        edgeMetadata.notes += `\n${newNotesSyntax}`
      } else {
        edgeMetadata.notes = newNotesSyntax
      }
    }
    await wallet.saveTxMetadata(edgeSignedTransaction.txid, edgeSignedTransaction.currencyCode, edgeMetadata)
    dispatch(updateSpendPending(false))

    edgeSignedTransaction.metadata = edgeMetadata
    edgeSignedTransaction.wallet = wallet

    playSendSound().catch(error => console.log(error)) // Fail quietly
    if (!guiMakeSpendInfo.dismissAlert) {
      Alert.alert(s.strings.transaction_success, s.strings.transaction_success_message, [
        {
          onPress () {},
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
        onPress () {},
        style: 'default',
        text: s.strings.string_ok
      }
    ])
  }
}

const errorNames = {
  IncorrectPinError: 'IncorrectPinError'
}
export function IncorrectPinError (message: ?string = s.strings.incorrect_pin) {
  const error = new Error(message)
  error.name = errorNames.IncorrectPinError
  return error
}

export const displayFeeAlert = async (feeAmountInFiatSyntax: string) => {
  const modal = createYesNoModal({
    title: s.strings.send_confirmation_fee_modal_alert_title,
    message: (
      <Text>
        {s.strings.send_confirmation_fee_modal_alert_message_fragment_1}
        <B>{feeAmountInFiatSyntax}</B>
        {s.strings.send_confirmation_fee_modal_alert_message_fragment_2}
      </Text>
    ),
    icon: <Icon type={MATERIAL_COMMUNITY} name={EXCLAMATION} size={38} />,
    noButtonText: s.strings.string_cancel_cap,
    yesButtonText: s.strings.title_send
  })
  const resolveValue = await launchModal(modal)
  console.log('resolveValue is: ', resolveValue)
  return resolveValue
}

export const getAuthRequiredDispatch = (spendInfo: EdgeSpendInfo) => (dispatch: Dispatch, getState: GetState) => {
  return getAuthRequired(getState(), spendInfo)
}
