import { abs, div, gte, mul, toFixed } from 'biggystring'
import { asMaybeInsufficientFundsError, EdgeCurrencyWallet, EdgeMetadata, EdgeParsedUri, EdgeSpendInfo, EdgeTransaction } from 'edge-core-js'
import * as React from 'react'
import { Alert } from 'react-native'
import { sprintf } from 'sprintf-js'

import { ButtonsModal } from '../components/modals/ButtonsModal'
import { InsufficientFeesModal } from '../components/modals/InsufficientFeesModal'
import { Airship, showError } from '../components/services/AirshipInstance'
import { FEE_ALERT_THRESHOLD, FIO_STR } from '../constants/WalletAndCurrencyConstants'
import { lstrings } from '../locales/strings'
import { initialState, initialTransaction } from '../reducers/scenes/SendConfirmationReducer'
import { getExchangeDenomination } from '../selectors/DenominationSelectors'
import { convertCurrency, convertCurrencyFromExchangeRates, getExchangeRate } from '../selectors/WalletSelectors'
import { RootState, ThunkAction } from '../types/reduxTypes'
import { NavigationBase } from '../types/routerTypes'
import { GuiMakeSpendInfo, SpendAuthType } from '../types/types'
import { addToFioAddressCache, FIO_FEE_EXCEEDS_SUPPLIED_MAXIMUM, recordSend } from '../util/FioAddressUtils'
import { logActivity } from '../util/logger'
import { convertNativeToExchange, DECIMAL_PRECISION, getDenomFromIsoCode } from '../util/utils'
import { playSendSound } from './SoundActions'

const XRP_DESTINATION_TAG_ERRORS = {
  UNIQUE_IDENTIFIER_EXCEEDS_LENGTH: lstrings.send_make_spend_xrp_dest_tag_length_error,
  UNIQUE_IDENTIFIER_EXCEEDS_LIMIT: lstrings.send_make_spend_xrp_dest_tag_limit_error,
  UNIQUE_IDENTIFIER_FORMAT: lstrings.send_make_spend_xrp_dest_tag_format_error
}

export interface FioSenderInfo {
  fioAddress: string
  fioWallet: EdgeCurrencyWallet | null
  fioError: string
  memo: string
  memoError: string
  skipRecord?: boolean
}

function updateAmount(
  navigation: NavigationBase,
  nativeAmount: string,
  exchangeAmount: string,
  fiatPerCrypto: string,
  forceUpdateGui: boolean = false,
  selectedWalletId?: string,
  selectedCurrencyCode?: string
): ThunkAction<void> {
  return async (dispatch, getState) => {
    const amountFiatString: string = mul(exchangeAmount, fiatPerCrypto)
    const amountFiat: number = parseFloat(amountFiatString)
    const metadata: EdgeMetadata = { amountFiat }
    await dispatch(sendConfirmationUpdateTx(navigation, { nativeAmount, metadata }, forceUpdateGui, selectedWalletId, selectedCurrencyCode))
  }
}

export function sendConfirmationUpdateTx(
  navigation: NavigationBase,
  guiMakeSpendInfo: GuiMakeSpendInfo | EdgeParsedUri,
  forceUpdateGui: boolean = true,
  selectedWalletId?: string,
  selectedCurrencyCode?: string,
  isFeeChanged: boolean = false
): ThunkAction<Promise<unknown>> {
  return async (dispatch, getState) => {
    const state = getState()
    const { currencyWallets } = state.core.account

    const walletId = selectedWalletId || state.ui.wallets.selectedWalletId
    const edgeWallet = currencyWallets[walletId]
    const maxSpendSet = state.ui.sendConfirmation.maxSpendSet
    const guiMakeSpendInfoClone = { ...guiMakeSpendInfo }
    if (maxSpendSet && isFeeChanged) guiMakeSpendInfoClone.nativeAmount = '0'
    const spendInfo = getSpendInfo(state, guiMakeSpendInfoClone, selectedCurrencyCode || state.ui.wallets.selectedCurrencyCode)

    if (isFeeChanged) {
      spendInfo.spendTargets = spendInfo.spendTargets.map(spendTarget => ({
        ...spendTarget,
        nativeAmount: spendTarget.nativeAmount === '' ? '0' : spendTarget.nativeAmount
      }))
    }
    const authRequired = getAuthRequired(state, spendInfo, walletId)
    dispatch({
      type: 'UI/SEND_CONFIRMATION/NEW_SPEND_INFO',
      data: { spendInfo, authRequired }
    })

    const amountRequired = getAmountRequired(spendInfo)
    if (amountRequired && guiMakeSpendInfo.nativeAmount === '')
      return dispatch({
        type: 'UI/SEND_CONFIRMATION/UPDATE_TRANSACTION',
        data: {
          error: null,
          forceUpdateGui,
          guiMakeSpendInfo: guiMakeSpendInfoClone,
          transaction: null
        }
      })

    if (maxSpendSet && isFeeChanged) {
      return await dispatch(updateMaxSpend(navigation, walletId, selectedCurrencyCode || state.ui.wallets.selectedCurrencyCode, guiMakeSpendInfoClone))
    }
    await edgeWallet
      .makeSpend(spendInfo)
      .then(edgeTransaction => {
        return dispatch({
          type: 'UI/SEND_CONFIRMATION/UPDATE_TRANSACTION',
          data: {
            error: null,
            forceUpdateGui,
            guiMakeSpendInfo: guiMakeSpendInfoClone,
            transaction: edgeTransaction
          }
        })
      })
      .catch(async (error: unknown) => {
        console.log(error)
        const insufficientFunds = asMaybeInsufficientFundsError(error)
        if (insufficientFunds != null && insufficientFunds.currencyCode != null && spendInfo.currencyCode !== insufficientFunds.currencyCode) {
          await Airship.show(bridge => <InsufficientFeesModal bridge={bridge} coreError={insufficientFunds} navigation={navigation} wallet={edgeWallet} />)
        }
        const typeHack: any = error
        return dispatch({
          type: 'UI/SEND_CONFIRMATION/UPDATE_TRANSACTION',
          data: {
            error: typeHack,
            forceUpdateGui,
            guiMakeSpendInfo: guiMakeSpendInfoClone,
            transaction: null
          }
        })
      })
  }
}

export function updateMaxSpend(
  navigation: NavigationBase,
  selectedWalletId?: string,
  selectedCurrencyCode?: string,
  guiMakeSpendInfo?: GuiMakeSpendInfo
): ThunkAction<Promise<void>> {
  return async (dispatch, getState) => {
    const state = getState()
    const { currencyWallets } = state.core.account

    const walletId = selectedWalletId || state.ui.wallets.selectedWalletId
    const edgeWallet = currencyWallets[walletId]
    const spendInfo = getSpendInfo(state, guiMakeSpendInfo, selectedCurrencyCode)

    await edgeWallet.getMaxSpendable(spendInfo).then(nativeAmount => {
      const state = getState()
      const spendInfo = getSpendInfo(state, { nativeAmount }, selectedCurrencyCode)
      const authRequired = getAuthRequired(state, spendInfo, walletId)

      const currencyCode = selectedCurrencyCode || state.ui.wallets.selectedCurrencyCode
      const isoFiatCurrencyCode = state.core.account.currencyWallets[walletId].fiatCurrencyCode
      const exchangeDenomination = getExchangeDenomination(state, edgeWallet.currencyInfo.pluginId, currencyCode)

      const exchangeAmount = convertNativeToExchange(exchangeDenomination.multiplier)(nativeAmount)
      const fiatPerCrypto = getExchangeRate(state, currencyCode, isoFiatCurrencyCode)

      dispatch({ type: 'UI/SEND_CONFIRMATION/RESET' })
      dispatch({ type: 'UI/SEND_CONFIRMATION/TOGGLE_CRYPTO_ON_TOP' })
      dispatch({
        type: 'UI/SEND_CONFIRMATION/NEW_SPEND_INFO',
        data: { spendInfo, authRequired }
      })
      dispatch({
        type: 'UI/SEND_CONFIRMATION/SET_MAX_SPEND',
        data: true
      })

      return dispatch(updateAmount(navigation, nativeAmount, exchangeAmount, fiatPerCrypto.toString(), true, walletId, currencyCode))
    })
  }
}

export function signBroadcastAndSave(
  navigation: NavigationBase,
  fioSender: FioSenderInfo | undefined,
  walletId: string | undefined,
  selectedCurrencyCode: string | undefined,
  resetSlider: () => void
): ThunkAction<Promise<void>> {
  return async (dispatch, getState) => {
    const state = getState()
    const { account } = state.core
    const { currencyWallets } = account

    const selectedWalletId = walletId || state.ui.wallets.selectedWalletId
    const wallet = currencyWallets[selectedWalletId]
    const edgeUnsignedTransaction: EdgeTransaction = getTransaction(state)

    const useWalletId = walletId ?? state.ui.wallets.selectedWalletId
    const edgeWallet = state.core.account.currencyWallets[useWalletId]
    const currencyCode = selectedCurrencyCode || state.ui.wallets.selectedCurrencyCode
    const isoFiatCurrencyCode = edgeWallet.fiatCurrencyCode
    const exchangeDenomination = getExchangeDenomination(state, wallet.currencyInfo.pluginId, currencyCode)

    const exchangeAmount = convertNativeToExchange(exchangeDenomination.multiplier)(edgeUnsignedTransaction.nativeAmount)
    const fiatPerCrypto = getExchangeRate(state, currencyCode, isoFiatCurrencyCode).toString()
    const amountFiatString = abs(mul(exchangeAmount, fiatPerCrypto))
    const amountFiat = parseFloat(amountFiatString)

    const spendInfo = state.ui.sendConfirmation.spendInfo
    const guiMakeSpendInfo = state.ui.sendConfirmation.guiMakeSpendInfo

    if (guiMakeSpendInfo.beforeTransaction) {
      try {
        guiMakeSpendInfo.beforeTransaction && (await guiMakeSpendInfo.beforeTransaction())
      } catch (e: any) {
        return
      }
    }

    if (!spendInfo) throw new Error(lstrings.invalid_spend_request)
    const authRequired = getAuthRequired(state, spendInfo, selectedWalletId)
    const pin = state.ui.sendConfirmation.pin

    // check hwo high fee is and decide whether to display warninig
    const exchangeConverter = convertNativeToExchange(exchangeDenomination.multiplier)
    const cryptoFeeExchangeAmount = exchangeConverter(edgeUnsignedTransaction.networkFee)
    const feeAmountInUSD = convertCurrencyFromExchangeRates(state.exchangeRates, currencyCode, 'iso:USD', cryptoFeeExchangeAmount)
    if (parseFloat(feeAmountInUSD) > FEE_ALERT_THRESHOLD) {
      const feeAmountInWalletFiat = convertCurrencyFromExchangeRates(state.exchangeRates, currencyCode, isoFiatCurrencyCode, cryptoFeeExchangeAmount)
      const fiatDenomination = getDenomFromIsoCode(edgeWallet.fiatCurrencyCode.replace('iso:', ''))
      const fiatSymbol = fiatDenomination.symbol ? `${fiatDenomination.symbol} ` : ''
      const feeString = `${fiatSymbol}${toFixed(feeAmountInWalletFiat.toString(), 2, 2)}`
      const feeAlertResponse = await displayFeeAlert(edgeWallet.currencyInfo.currencyCode, feeString)
      if (!feeAlertResponse) {
        dispatch({
          type: 'UI/SEND_CONFIRMATION/UPDATE_TRANSACTION',
          data: {
            error: null,
            forceUpdateGui: true,
            guiMakeSpendInfo,
            transaction: edgeUnsignedTransaction
          }
        })
        return
      }
    }

    let edgeSignedTransaction: EdgeTransaction = edgeUnsignedTransaction
    try {
      if (authRequired === 'pin') {
        const isAuthorized = await account.checkPin(pin)
        if (!isAuthorized) throw new Error(lstrings.incorrect_pin)
      }
      edgeSignedTransaction = await wallet.signTx(edgeUnsignedTransaction)
      if (guiMakeSpendInfo.alternateBroadcast != null) {
        edgeSignedTransaction = await guiMakeSpendInfo.alternateBroadcast(edgeSignedTransaction)
      } else {
        edgeSignedTransaction = await wallet.broadcastTx(edgeSignedTransaction)
        const { name, type, id } = wallet
        const {
          currencyCode,
          nativeAmount,
          networkFee,
          parentNetworkFee,
          txid,
          ourReceiveAddresses,
          deviceDescription,
          networkFeeOption,
          requestedCustomFee,
          feeRateUsed
        } = edgeSignedTransaction

        logActivity(`broadcastTx: ${account.username} -- ${name ?? 'noname'} ${type} ${id}`)
        logActivity(`
  currencyCode: ${currencyCode}
  nativeAmount: ${nativeAmount}
  txid: ${txid}
  networkFee: ${networkFee}
  parentNetworkFee: ${parentNetworkFee ?? ''}
  deviceDescription: ${deviceDescription ?? ''}
  networkFeeOption: ${networkFeeOption ?? ''}
  ourReceiveAddresses: ${JSON.stringify(ourReceiveAddresses)}
  requestedCustomFee: ${JSON.stringify(requestedCustomFee)}
  feeRateUsed ${JSON.stringify(feeRateUsed)}
      `)
      }
      await wallet.saveTx(edgeSignedTransaction)
      let edgeMetadata = { ...spendInfo.metadata }
      let payeeFioAddress: string | null = null
      if (spendInfo.spendTargets[0].otherParams != null) {
        payeeFioAddress = spendInfo.spendTargets[0].otherParams.fioAddress
      }
      if (state.ui.sendConfirmation.transactionMetadata) {
        edgeMetadata = { ...edgeMetadata, ...state.ui.sendConfirmation.transactionMetadata }
      }
      if (payeeFioAddress != null) {
        edgeMetadata.name = payeeFioAddress
      }
      const publicAddress = spendInfo ? spendInfo.spendTargets[0].publicAddress : ''
      if (!edgeMetadata.amountFiat) {
        edgeMetadata.amountFiat = amountFiat
      }
      if (payeeFioAddress != null && fioSender != null) {
        let fioNotes = `${lstrings.fragment_transaction_list_sent_prefix}${lstrings.fragment_send_from_label.toLowerCase()} ${fioSender.fioAddress}`
        fioNotes += fioSender.memo ? `\n${lstrings.fio_sender_memo_label}: ${fioSender.memo}` : ''
        edgeMetadata.notes = `${fioNotes}\n${edgeMetadata.notes || ''}`
      }
      await wallet.saveTxMetadata(edgeSignedTransaction.txid, edgeSignedTransaction.currencyCode, edgeMetadata)

      edgeSignedTransaction.metadata = edgeMetadata

      if (payeeFioAddress != null) {
        await addToFioAddressCache(account, [payeeFioAddress])
      }

      // fio
      if (fioSender != null) {
        const { fioAddress, fioWallet, memo, skipRecord = false } = fioSender
        if (payeeFioAddress != null && fioAddress != null && fioWallet != null) {
          if (guiMakeSpendInfo.fioPendingRequest != null) {
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
            } catch (e: any) {
              const message = e?.message ?? ''
              message.includes(FIO_FEE_EXCEEDS_SUPPLIED_MAXIMUM) ? showError(lstrings.fio_fee_exceeds_supplied_maximum_record_obt_data) : showError(e)
            }
          } else if ((guiMakeSpendInfo.publicAddress != null || publicAddress != null) && (!skipRecord || edgeSignedTransaction.currencyCode === FIO_STR)) {
            const payerPublicAddress = wallet.publicWalletInfo.keys.publicKey
            const amount = guiMakeSpendInfo.nativeAmount ?? '0'
            const chainCode = wallet.currencyInfo.currencyCode

            try {
              await recordSend(fioWallet, fioAddress, {
                payeeFioAddress,
                payerPublicAddress,
                payeePublicAddress: guiMakeSpendInfo.publicAddress ?? publicAddress ?? '',
                amount: amount && div(amount, exchangeDenomination.multiplier, DECIMAL_PRECISION),
                currencyCode: edgeSignedTransaction.currencyCode,
                chainCode: chainCode || edgeWallet.currencyInfo.currencyCode,
                txid: edgeSignedTransaction.txid,
                memo
              })
            } catch (e: any) {
              showError(e)
            }
          }
        }
      }

      playSendSound().catch(error => console.log(error)) // Fail quietly
      if (!guiMakeSpendInfo.dismissAlert) {
        Alert.alert(lstrings.transaction_success, lstrings.transaction_success_message, [
          {
            onPress() {},
            style: 'default',
            text: lstrings.string_ok
          }
        ])
      }

      if (guiMakeSpendInfo.onDone) {
        guiMakeSpendInfo.onDone(null, edgeSignedTransaction)
      } else {
        navigation.replace('transactionDetails', {
          edgeTransaction: edgeSignedTransaction,
          walletId: wallet.id
        })
      }
    } catch (e: any) {
      resetSlider()
      console.log(e)
      let message = sprintf(lstrings.transaction_failure_message, e.message)
      e.message = 'broadcastError'
      dispatch({
        type: 'UI/SEND_CONFIRMATION/UPDATE_TRANSACTION',
        data: {
          error: e,
          forceUpdateGui: false,
          guiMakeSpendInfo,
          transaction: edgeUnsignedTransaction
        }
      })
      if (e.name === 'ErrorEosInsufficientCpu') {
        message = lstrings.send_confirmation_eos_error_cpu
      } else if (e.name === 'ErrorEosInsufficientNet') {
        message = lstrings.send_confirmation_eos_error_net
      } else if (e.name === 'ErrorEosInsufficientRam') {
        message = lstrings.send_confirmation_eos_error_ram
      } else if (
        edgeSignedTransaction &&
        edgeSignedTransaction.otherParams &&
        edgeSignedTransaction.otherParams.action &&
        edgeSignedTransaction.otherParams.action.name === 'transferFioAddress' &&
        e.json &&
        e.json.code === 500 &&
        e.json.error.code === 3050003
      ) {
        message = lstrings.transfer_fio_address_exception
      }

      Alert.alert(lstrings.transaction_failure, message, [
        {
          onPress() {},
          style: 'default',
          text: lstrings.string_ok
        }
      ])
    }
  }
}

export const displayFeeAlert = async (currency: string, fee: string) => {
  let additionalMessage = ''
  if (currency === 'ETH') additionalMessage = lstrings.send_confirmation_fee_modal_alert_message_fragment_eth
  const message = `${sprintf(lstrings.send_confirmation_fee_modal_alert_message_fragment, fee)} ${additionalMessage}`
  const resolveValue = await Airship.show<'send' | undefined>(bridge => (
    <ButtonsModal
      bridge={bridge}
      title={lstrings.send_confirmation_fee_modal_alert_title}
      message={message}
      closeArrow
      buttons={{
        send: { label: lstrings.high_fee_warning_confirm_send }
      }}
    />
  ))

  return resolveValue === 'send'
}

let lastUpdateTransactionAmountNonce = 0

export function updateTransactionAmount(nativeAmount: string, exchangeAmount: string, walletId: string, currencyCode: string): ThunkAction<void> {
  return (dispatch, getState) => {
    const state = getState()
    const edgeWallet = state.core.account.currencyWallets[walletId]
    const sceneState = state.ui.sendConfirmation
    const isoFiatCurrencyCode = edgeWallet.fiatCurrencyCode

    // Spend Info
    const fiatPerCrypto = getExchangeRate(state, currencyCode, isoFiatCurrencyCode)
    const amountFiatString: string = mul(exchangeAmount, fiatPerCrypto.toString())
    const metadata: EdgeMetadata = { amountFiat: parseFloat(amountFiatString) }
    const guiMakeSpendInfo = { nativeAmount, metadata }
    const guiMakeSpendInfoClone = { ...guiMakeSpendInfo }
    const spendInfo = getSpendInfoWithoutState(guiMakeSpendInfoClone, sceneState, currencyCode)
    const authType = getAuthRequired(state, spendInfo, walletId)

    // Transaction Update
    dispatch({
      type: 'UI/SEND_CONFIRMATION/NEW_SPEND_INFO',
      data: { spendInfo, authRequired: authType }
    })
    dispatch({
      type: 'UI/SEND_CONFIRMATION/SET_MAX_SPEND',
      data: false
    })

    if (guiMakeSpendInfo.nativeAmount === '') {
      return
    }

    // Fixes race-condition caused by concurrent makeSpend calls from each
    // key stroke from user input
    const nonce = ++lastUpdateTransactionAmountNonce

    edgeWallet
      .makeSpend(spendInfo)
      .then(edgeTransaction => {
        if (nonce < lastUpdateTransactionAmountNonce) return
        dispatch({
          type: 'UI/SEND_CONFIRMATION/UPDATE_TRANSACTION',
          data: {
            error: null,
            forceUpdateGui: false,
            guiMakeSpendInfo: guiMakeSpendInfoClone,
            transaction: edgeTransaction
          }
        })
      })
      .catch(error => {
        if (nonce < lastUpdateTransactionAmountNonce) return
        let customError

        if (error.labelCode && edgeWallet.currencyInfo?.defaultSettings?.errorCodes[error.labelCode] != null) {
          // @ts-expect-error
          customError = new Error(XRP_DESTINATION_TAG_ERRORS[error.labelCode])
        }

        console.log(error)
        dispatch({
          type: 'UI/SEND_CONFIRMATION/UPDATE_TRANSACTION',
          data: {
            error: customError != null ? customError : error,
            forceUpdateGui: false,
            guiMakeSpendInfo: guiMakeSpendInfoClone,
            transaction: null
          }
        })
      })
  }
}

const getTransaction = (state: RootState): EdgeTransaction => state.ui.sendConfirmation.transaction ?? initialTransaction
const getGuiMakeSpendInfo = (state: RootState): GuiMakeSpendInfo => state.ui.sendConfirmation.guiMakeSpendInfo || initialState.guiMakeSpendInfo

const getNetworkFeeOption = (state: RootState): 'high' | 'standard' | 'low' | 'custom' =>
  // @ts-expect-error
  getGuiMakeSpendInfo(state).networkFeeOption || initialState.guiMakeSpendInfo.networkFeeOption

const getCustomNetworkFee = (state: RootState): any => getGuiMakeSpendInfo(state).customNetworkFee || initialState.guiMakeSpendInfo.customNetworkFee || {}
const getMetadata = (state: RootState): EdgeMetadata => getGuiMakeSpendInfo(state).metadata || initialState.guiMakeSpendInfo.metadata || {}
const getPublicAddress = (state: RootState): string => {
  try {
    return (
      getGuiMakeSpendInfo(state).publicAddress ||
      initialState.guiMakeSpendInfo.publicAddress ||
      // @ts-expect-error
      state.ui.sendConfirmation.spendInfo.spendTargets[0].publicAddress ||
      ''
    )
  } catch (e: any) {
    return ''
  }
}
const getNativeAmount = (state: RootState): string | undefined => state.ui.sendConfirmation.nativeAmount

const getUniqueIdentifier = (state: RootState): string => {
  const guiMakeSpendInfo = state.ui.sendConfirmation.guiMakeSpendInfo || initialState.guiMakeSpendInfo
  const uniqueIdentifier = guiMakeSpendInfo.uniqueIdentifier || ''
  return uniqueIdentifier || ''
}
const getSpendTargetOtherParams = (state: RootState): any => {
  try {
    const { spendInfo } = state.ui.sendConfirmation
    if (spendInfo == null) return {}
    return spendInfo.spendTargets[0].otherParams || {}
  } catch (e: any) {
    return {}
  }
}

const getSpendInfo = (state: RootState, newSpendInfo: GuiMakeSpendInfo = {}, selectedCurrencyCode?: string): EdgeSpendInfo => {
  const uniqueIdentifier = newSpendInfo.uniqueIdentifier != null ? newSpendInfo.uniqueIdentifier : getUniqueIdentifier(state)
  let spendTargets = []
  if (newSpendInfo.spendTargets) {
    spendTargets = newSpendInfo.spendTargets
  } else {
    spendTargets = [
      {
        nativeAmount: newSpendInfo.nativeAmount || getNativeAmount(state),
        publicAddress: newSpendInfo.publicAddress || getPublicAddress(state),
        otherParams: {
          ...getSpendTargetOtherParams(state),
          uniqueIdentifier
        }
      }
    ]
  }

  return {
    currencyCode: newSpendInfo.currencyCode || selectedCurrencyCode,
    metadata: newSpendInfo.metadata ? { ...getMetadata(state), ...newSpendInfo.metadata } : getMetadata(state),
    spendTargets,
    networkFeeOption: newSpendInfo.networkFeeOption || getNetworkFeeOption(state),
    customNetworkFee: newSpendInfo.customNetworkFee ? { ...getCustomNetworkFee(state), ...newSpendInfo.customNetworkFee } : getCustomNetworkFee(state),
    otherParams: newSpendInfo.otherParams || {}
  }
}

const getSpendInfoWithoutState = (newSpendInfo: GuiMakeSpendInfo = {}, sceneState: any, selectedCurrencyCode: string): EdgeSpendInfo => {
  const uniqueIdentifier = newSpendInfo.uniqueIdentifier || sceneState.guiMakeSpendInfo.uniqueIdentifier || ''
  let spendTargets = []
  if (newSpendInfo.spendTargets) {
    spendTargets = newSpendInfo.spendTargets
  } else {
    spendTargets = [
      {
        nativeAmount: newSpendInfo.nativeAmount || sceneState.nativeAmount,
        publicAddress: newSpendInfo.publicAddress || initialState.guiMakeSpendInfo.publicAddress || sceneState.spendInfo.spendTargets[0].publicAddress,
        otherParams: {
          uniqueIdentifier,
          ...sceneState.spendInfo.spendTargets[0].otherParams
        }
      }
    ]
  }
  const metaData = sceneState.guiMakeSpendInfo.metadata || initialState.guiMakeSpendInfo.metadata
  const customNetworkFee = sceneState.guiMakeSpendInfo.customNetworkFee || initialState.guiMakeSpendInfo.customNetworkFee
  return {
    currencyCode: newSpendInfo.currencyCode || selectedCurrencyCode,
    metadata: newSpendInfo.metadata ? { ...metaData, ...newSpendInfo.metadata } : metaData,
    spendTargets,
    networkFeeOption: newSpendInfo.networkFeeOption || sceneState.guiMakeSpendInfo.networkFeeOption || initialState.guiMakeSpendInfo.networkFeeOption,
    customNetworkFee: newSpendInfo.customNetworkFee ? { ...customNetworkFee, ...newSpendInfo.customNetworkFee } : customNetworkFee,
    otherParams: newSpendInfo.otherParams || {}
  }
}

const getAuthRequired = (state: RootState, spendInfo: EdgeSpendInfo, walletId: string): SpendAuthType => {
  const isEnabled = state.ui.settings.spendingLimits.transaction.isEnabled
  if (!isEnabled) return 'none'

  const currencyCode = spendInfo.currencyCode
  const { nativeAmount } = spendInfo.spendTargets[0]
  if (nativeAmount === '') return 'none' // TODO: Future change will make this null instead of ''
  if (!currencyCode || !nativeAmount) throw new Error('Invalid Spend Request')

  const { spendingLimits } = state.ui.settings
  const isoFiatCurrencyCode = state.ui.settings.defaultIsoFiat
  const wallet = state.core.account.currencyWallets[walletId]
  const nativeToExchangeRatio = getExchangeDenomination(state, wallet.currencyInfo.pluginId, currencyCode).multiplier
  const exchangeAmount = convertNativeToExchange(nativeToExchangeRatio)(nativeAmount)
  const fiatAmount = convertCurrency(state, currencyCode, isoFiatCurrencyCode, exchangeAmount)
  const exceedsLimit = gte(fiatAmount, spendingLimits.transaction.amount.toFixed(DECIMAL_PRECISION))

  return exceedsLimit ? 'pin' : 'none'
}

const getAmountRequired = (guiMakeSpendInfo: EdgeSpendInfo): boolean => {
  return guiMakeSpendInfo.otherParams == null || guiMakeSpendInfo.otherParams.action == null || guiMakeSpendInfo.otherParams.action.name == null
}
