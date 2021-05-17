// @flow

import { bns } from 'biggystring'
import {
  type EdgeCurrencyWallet,
  type EdgeMetadata,
  type EdgeParsedUri,
  type EdgeSpendInfo,
  type EdgeTransaction,
  asMaybeInsufficientFundsError
} from 'edge-core-js'
import * as React from 'react'
import { Alert } from 'react-native'
import { Actions } from 'react-native-router-flux'
import { sprintf } from 'sprintf-js'

import { selectWalletForExchange } from '../actions/CryptoExchangeActions.js'
import { ButtonsModal } from '../components/modals/ButtonsModal.js'
import { Airship, showError } from '../components/services/AirshipInstance.js'
import { EXCHANGE_SCENE, FEE_ALERT_THRESHOLD, FIO_STR, PLUGIN_BUY, SEND_CONFIRMATION, TRANSACTION_DETAILS } from '../constants/indexConstants'
import { getSymbolFromCurrency } from '../constants/WalletAndCurrencyConstants.js'
import s from '../locales/strings.js'
import { addToFioAddressCache, recordSend } from '../modules/FioAddress/util'
import { getExchangeDenomination as settingsGetExchangeDenomination } from '../modules/Settings/selectors.js'
import { getAuthRequired, getSpendInfo, getSpendInfoWithoutState, getTransaction } from '../modules/UI/scenes/SendConfirmation/selectors'
import { convertCurrencyFromExchangeRates, getExchangeRate } from '../modules/UI/selectors.js'
import { type GuiMakeSpendInfo } from '../reducers/scenes/SendConfirmationReducer.js'
import type { Dispatch, GetState } from '../types/reduxTypes.js'
import { convertNativeToExchange } from '../util/utils'
import { playSendSound } from './SoundActions.js'

const XRP_DESTINATION_TAG_ERRORS = {
  UNIQUE_IDENTIFIER_EXCEEDS_LENGTH: s.strings.send_make_spend_xrp_dest_tag_length_error,
  UNIQUE_IDENTIFIER_EXCEEDS_LIMIT: s.strings.send_make_spend_xrp_dest_tag_limit_error,
  UNIQUE_IDENTIFIER_FORMAT: s.strings.send_make_spend_xrp_dest_tag_format_error
}

export type FioSenderInfo = {
  fioAddress: string,
  fioWallet: EdgeCurrencyWallet | null,
  fioError: string,
  memo: string,
  memoError: string,
  skipRecord?: boolean
}

const updateAmount =
  (
    nativeAmount: string,
    exchangeAmount: string,
    fiatPerCrypto: string,
    forceUpdateGui?: boolean = false,
    selectedWalletId?: string,
    selectedCurrencyCode?: string
  ) =>
  (dispatch: Dispatch, getState: GetState) => {
    const amountFiatString: string = bns.mul(exchangeAmount, fiatPerCrypto)
    const amountFiat: number = parseFloat(amountFiatString)
    const metadata: EdgeMetadata = { amountFiat }
    dispatch(sendConfirmationUpdateTx({ nativeAmount, metadata }, forceUpdateGui, selectedWalletId, selectedCurrencyCode))
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

export const paymentProtocolUriReceived =
  ({ paymentProtocolURL }: EdgePaymentProtocolUri) =>
  (dispatch: Dispatch, getState: GetState) => {
    const state = getState()
    const { currencyWallets } = state.core.account

    const walletId = state.ui.wallets.selectedWalletId
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

export const sendConfirmationUpdateTx =
  (guiMakeSpendInfo: GuiMakeSpendInfo | EdgeParsedUri, forceUpdateGui?: boolean = true, selectedWalletId?: string, selectedCurrencyCode?: string) =>
  async (dispatch: Dispatch, getState: GetState) => {
    const state = getState()
    const { currencyWallets } = state.core.account

    const walletId = selectedWalletId || state.ui.wallets.selectedWalletId
    const edgeWallet = currencyWallets[walletId]
    const guiMakeSpendInfoClone = { ...guiMakeSpendInfo }
    const spendInfo = getSpendInfo(state, guiMakeSpendInfoClone, selectedCurrencyCode || state.ui.wallets.selectedCurrencyCode)

    const authRequired = getAuthRequired(state, spendInfo)
    dispatch({
      type: 'UI/SEND_CONFIMATION/NEW_SPEND_INFO',
      data: { spendInfo, authRequired }
    })

    await edgeWallet
      .makeSpend(spendInfo)
      .then(edgeTransaction => {
        return dispatch({
          type: 'UI/SEND_CONFIMATION/UPDATE_TRANSACTION',
          data: {
            error: null,
            forceUpdateGui,
            guiMakeSpendInfo: guiMakeSpendInfoClone,
            transaction: edgeTransaction
          }
        })
      })
      .catch(async (error: mixed) => {
        console.log(error)
        const insufficientFunds = asMaybeInsufficientFundsError(error)
        if (insufficientFunds != null && insufficientFunds.currencyCode != null && spendInfo.currencyCode !== insufficientFunds.currencyCode) {
          const { currencyCode } = insufficientFunds
          const result = await Airship.show(bridge => (
            <ButtonsModal
              bridge={bridge}
              title={s.strings.buy_crypto_modal_title}
              message={sprintf(s.strings.buy_parent_crypto_modal_message, currencyCode)}
              buttons={{
                buy: { label: sprintf(s.strings.buy_crypto_modal_buy_action, currencyCode) },
                exchange: { label: s.strings.buy_crypto_modal_exchange },
                cancel: { label: s.strings.buy_crypto_decline, type: 'secondary' }
              }}
            />
          ))
          switch (result) {
            case 'buy':
              Actions.jump(PLUGIN_BUY)
              return
            case 'exchange':
              dispatch(selectWalletForExchange(walletId, currencyCode, 'to'))
              Actions.jump(EXCHANGE_SCENE)
              break
          }
        }
        const typeHack: any = error
        return dispatch({
          type: 'UI/SEND_CONFIMATION/UPDATE_TRANSACTION',
          data: {
            error: typeHack,
            forceUpdateGui,
            guiMakeSpendInfo: guiMakeSpendInfoClone,
            transaction: null
          }
        })
      })
  }

export const updateMaxSpend = (selectedWalletId?: string, selectedCurrencyCode?: string) => (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const { currencyWallets } = state.core.account

  const walletId = selectedWalletId || state.ui.wallets.selectedWalletId
  const edgeWallet = currencyWallets[walletId]
  const spendInfo = getSpendInfo(state, undefined, selectedCurrencyCode)

  edgeWallet
    .getMaxSpendable(spendInfo)
    .then(nativeAmount => {
      const state = getState()
      const spendInfo = getSpendInfo(state, { nativeAmount }, selectedCurrencyCode)
      const authRequired = getAuthRequired(state, spendInfo)

      const wallets = state.ui.wallets.byId
      const guiWallet = wallets[walletId]
      const currencyCode = selectedCurrencyCode || state.ui.wallets.selectedCurrencyCode
      const isoFiatCurrencyCode = guiWallet.isoFiatCurrencyCode
      const exchangeDenomination = settingsGetExchangeDenomination(state, currencyCode)

      const exchangeAmount = convertNativeToExchange(exchangeDenomination.multiplier)(nativeAmount)
      const fiatPerCrypto = getExchangeRate(state, currencyCode, isoFiatCurrencyCode)

      dispatch({ type: 'UI/SEND_CONFIMATION/RESET' })
      dispatch({ type: 'UI/SEND_CONFIMATION/TOGGLE_CRYPTO_ON_TOP' })
      dispatch({
        type: 'UI/SEND_CONFIMATION/NEW_SPEND_INFO',
        data: { spendInfo, authRequired }
      })

      dispatch(updateAmount(nativeAmount, exchangeAmount, fiatPerCrypto.toString(), true, walletId, currencyCode))
    })
    .catch(showError)
}

export const signBroadcastAndSave =
  (fioSender?: FioSenderInfo, walletId?: string, selectedCurrencyCode?: string) => async (dispatch: Dispatch, getState: GetState) => {
    const state = getState()
    const { account } = state.core
    const { currencyWallets } = account

    const selectedWalletId = walletId || state.ui.wallets.selectedWalletId
    const wallet = currencyWallets[selectedWalletId]
    const edgeUnsignedTransaction: EdgeTransaction = getTransaction(state)

    const wallets = state.ui.wallets.byId
    const guiWallet = wallets[walletId || state.ui.wallets.selectedWalletId]
    const currencyCode = selectedCurrencyCode || state.ui.wallets.selectedCurrencyCode
    const isoFiatCurrencyCode = guiWallet.isoFiatCurrencyCode
    const exchangeDenomination = settingsGetExchangeDenomination(state, currencyCode)

    const exchangeAmount = convertNativeToExchange(exchangeDenomination.multiplier)(edgeUnsignedTransaction.nativeAmount)
    const fiatPerCrypto = getExchangeRate(state, currencyCode, isoFiatCurrencyCode).toString()
    const amountFiatString = bns.abs(bns.mul(exchangeAmount, fiatPerCrypto))
    const amountFiat = parseFloat(amountFiatString)

    const spendInfo = state.ui.scenes.sendConfirmation.spendInfo
    const guiMakeSpendInfo = state.ui.scenes.sendConfirmation.guiMakeSpendInfo

    if (guiMakeSpendInfo.beforeTransaction) {
      dispatch({
        type: 'UI/SEND_CONFIMATION/UPDATE_SPEND_PENDING',
        data: { pending: true }
      })
      try {
        guiMakeSpendInfo.beforeTransaction && (await guiMakeSpendInfo.beforeTransaction())
      } catch (e) {
        dispatch({
          type: 'UI/SEND_CONFIMATION/UPDATE_SPEND_PENDING',
          data: { pending: false }
        })
        return
      }
      dispatch({
        type: 'UI/SEND_CONFIMATION/UPDATE_SPEND_PENDING',
        data: { pending: false }
      })
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
        dispatch({
          type: 'UI/SEND_CONFIMATION/UPDATE_TRANSACTION',
          data: {
            error: new Error('transactionCancelled'),
            forceUpdateGui: true,
            guiMakeSpendInfo,
            transaction: edgeUnsignedTransaction
          }
        })
        return
      }
    }

    dispatch({
      type: 'UI/SEND_CONFIMATION/UPDATE_SPEND_PENDING',
      data: { pending: true }
    })
    let edgeSignedTransaction: EdgeTransaction = edgeUnsignedTransaction
    try {
      if (authRequired === 'pin') {
        const isAuthorized = await account.checkPin(pin)
        if (!isAuthorized) throw new Error(s.strings.incorrect_pin)
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
      dispatch({
        type: 'UI/SEND_CONFIMATION/UPDATE_SPEND_PENDING',
        data: { pending: false }
      })

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
      dispatch({
        type: 'UI/SEND_CONFIMATION/UPDATE_SPEND_PENDING',
        data: { pending: false }
      })
      let message = sprintf(s.strings.transaction_failure_message, e.message)
      if (e.name === 'ErrorEosInsufficientCpu') {
        message = s.strings.send_confirmation_eos_error_cpu
      } else if (e.name === 'ErrorEosInsufficientNet') {
        message = s.strings.send_confirmation_eos_error_net
      } else if (e.name === 'ErrorEosInsufficientRam') {
        message = s.strings.send_confirmation_eos_error_ram
      } else if (
        edgeSignedTransaction &&
        edgeSignedTransaction.otherParams &&
        edgeSignedTransaction.otherParams.transactionJson &&
        edgeSignedTransaction.otherParams.transactionJson.fioAction === 'transferFioAddress' &&
        e.json &&
        e.json.code === 500 &&
        e.json.error.code === 3050003
      ) {
        message = s.strings.transfer_fio_address_exception
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

// Should be removed when Send Confirmation Scene is removed
export const getAuthRequiredDispatch = (spendInfo: EdgeSpendInfo) => (dispatch: Dispatch, getState: GetState) => {
  return getAuthRequired(getState(), spendInfo)
}

export const updateTransactionAmount =
  (nativeAmount: string, exchangeAmount: string, walletId: string, currencyCode: string) => (dispatch: Dispatch, getState: GetState) => {
    const state = getState()
    const guiWallet = state.ui.wallets.byId[walletId]
    const sceneState = state.ui.scenes.sendConfirmation
    const { isoFiatCurrencyCode } = guiWallet
    const { currencyWallets } = state.core.account
    const coreWallet = currencyWallets[guiWallet.id]

    // Spend Info
    const fiatPerCrypto = getExchangeRate(state, currencyCode, isoFiatCurrencyCode)
    const amountFiatString: string = bns.mul(exchangeAmount, fiatPerCrypto.toString())
    const metadata: EdgeMetadata = { amountFiat: parseFloat(amountFiatString) }
    const guiMakeSpendInfo = { nativeAmount, metadata }
    const guiMakeSpendInfoClone = { ...guiMakeSpendInfo }
    const spendInfo = getSpendInfoWithoutState(guiMakeSpendInfoClone, sceneState, currencyCode)
    const authType = getAuthRequired(state, spendInfo)

    // Transaction Update
    dispatch({
      type: 'UI/SEND_CONFIMATION/NEW_SPEND_INFO',
      data: { spendInfo, authRequired: authType }
    })
    coreWallet
      .makeSpend(spendInfo)
      .then(edgeTransaction => {
        dispatch({
          type: 'UI/SEND_CONFIMATION/UPDATE_TRANSACTION',
          data: {
            error: null,
            forceUpdateGui: false,
            guiMakeSpendInfo: guiMakeSpendInfoClone,
            transaction: edgeTransaction
          }
        })
      })
      .catch(error => {
        let customError

        if (coreWallet.currencyInfo.defaultSettings.errorCodes[error.labelCode] != null) {
          customError = new Error(XRP_DESTINATION_TAG_ERRORS[error.labelCode])
        }

        console.log(error)
        dispatch({
          type: 'UI/SEND_CONFIMATION/UPDATE_TRANSACTION',
          data: {
            error: customError != null ? customError : error,
            forceUpdateGui: false,
            guiMakeSpendInfo: guiMakeSpendInfoClone,
            transaction: null
          }
        })
      })
  }
