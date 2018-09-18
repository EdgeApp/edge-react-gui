// @flow

import type { AbcSpendTarget, EdgeMetadata, EdgeSpendInfo, EdgeTransaction } from 'edge-core-js'

import { STANDARD_FEE } from '../../../../constants/indexConstants'
import { convertCurrency } from '../../../Core/Account/api.js'
import { getAccount } from '../../../Core/selectors.js'
import type { State } from '../../../ReduxTypes'
import { convertNativeToExchange } from '../../../utils.js'
import { getSceneState, getSelectedCurrencyCode } from '../../selectors.js'
import { getExchangeDenomination } from '../../Settings/selectors.js'

export type GuiMakeSpendInfo = {
  currencyCode?: string,
  customNetworkFee?: any,
  metadata?: any,
  nativeAmount?: string,
  networkFeeOption?: string,
  publicAddress?: string,
  spendTargets?: Array<AbcSpendTarget>,
  uniqueIdentifier?: string
}

export type SendConfirmationState = {
  forceUpdateGuiCounter: number,
  destination: string,
  address: string,

  nativeAmount: string,

  parsedUri: GuiMakeSpendInfo,
  spendInfo: EdgeSpendInfo | null,

  isEditable: boolean,

  pending: boolean,
  transaction: EdgeTransaction | null,
  error: Error | null,

  pin: string,
  authRequired: 'pin' | 'none'
}

export const initialState = {
  isKeyboardVisible: false,
  forceUpdateGuiCounter: 0,

  parsedUri: {
    networkFeeOption: (STANDARD_FEE: string),
    customNetworkFee: {},
    publicAddress: '',
    nativeAmount: '0',
    metadata: {
      name: '',
      category: '',
      notes: '',
      amountFiat: 0,
      bizId: 0,
      miscJson: ''
    }
  },
  spendInfo: null,
  destination: '',
  nativeAmount: '0',

  isEditable: true,

  transaction: {
    txid: '',
    date: 0,
    currencyCode: '',
    blockHeight: -1,
    nativeAmount: '0',
    networkFee: '',
    parentNetworkFee: '',
    ourReceiveAddresses: [],
    signedTx: '',
    metadata: {},
    otherParams: {}
  },
  pending: false,
  error: null,

  pin: '',
  authRequired: 'none',
  address: ''
}

export const getScene = (state: State): any => getSceneState(state, 'sendConfirmation')
export const getPending = (state: State): boolean => getScene(state).pending
export const getError = (state: State): Error => getScene(state).error
export const getKeyboardIsVisible = (state: State): boolean => getScene(state).keyboardIsVisible

export const getTransaction = (state: State): EdgeTransaction => getScene(state).transaction || initialState.transaction
export const getParsedUri = (state: State): GuiMakeSpendInfo => getScene(state).parsedUri || initialState.parsedUri
export const getForceUpdateGuiCounter = (state: State): number => getScene(state).forceUpdateGuiCounter

export const getNetworkFeeOption = (state: State): string => getParsedUri(state).networkFeeOption || initialState.parsedUri.networkFeeOption || ''
export const getCustomNetworkFee = (state: State): any => getParsedUri(state).customNetworkFee || initialState.parsedUri.customNetworkFee || {}
export const getMetadata = (state: State): EdgeMetadata => getParsedUri(state).metadata || initialState.parsedUri.metadata || {}
export const getPublicAddress = (state: State): string => {
  try {
    return (
      getParsedUri(state).publicAddress ||
      initialState.parsedUri.publicAddress ||
      // $FlowFixMe
      state.ui.scenes.sendConfirmation.spendInfo.spendTargets[0].publicAddress ||
      ''
    )
  } catch (e) {
    return ''
  }
}
export const getNativeAmount = (state: State): string | void => state.ui.scenes.sendConfirmation.nativeAmount

export const getUniqueIdentifier = (state: State): string => {
  const parsedUri = getParsedUri(state)
  const uniqueIdentifier = parsedUri.uniqueIdentifier
  return uniqueIdentifier || ''
}

export const getNetworkFee = (state: State): string => getTransaction(state).networkFee
export const getParentNetworkFee = (state: State): string | void => getTransaction(state).parentNetworkFee

export const getSpendInfo = (state: State, newSpendInfo?: GuiMakeSpendInfo = {}): EdgeSpendInfo => {
  const uniqueIdentifier = newSpendInfo.uniqueIdentifier || getUniqueIdentifier(state)

  return {
    currencyCode: newSpendInfo.currencyCode || getSelectedCurrencyCode(state),
    metadata: newSpendInfo.metadata ? { ...getMetadata(state), ...newSpendInfo.metadata } : getMetadata(state),
    spendTargets: [
      {
        nativeAmount: newSpendInfo.nativeAmount || getNativeAmount(state),
        publicAddress: newSpendInfo.publicAddress || getPublicAddress(state),
        otherParams: {
          uniqueIdentifier
        }
      }
    ],
    networkFeeOption: newSpendInfo.networkFeeOption || getNetworkFeeOption(state),
    customNetworkFee: newSpendInfo.customNetworkFee ? { ...getCustomNetworkFee(state), ...newSpendInfo.customNetworkFee } : getCustomNetworkFee(state)
  }
}

export type AuthType = 'pin' | 'none'
export const getAuthRequired = (state: State, spendInfo: EdgeSpendInfo): AuthType => {
  const isEnabled = state.ui.settings.spendingLimits.transaction.isEnabled
  if (!isEnabled) return 'none'

  const currencyCode = spendInfo.currencyCode || spendInfo.spendTargets[0].currencyCode
  const { nativeAmount } = spendInfo.spendTargets[0]
  if (!currencyCode || !nativeAmount) throw new Error('Invalid Spend Request')

  const { spendingLimits } = state.ui.settings
  const account = getAccount(state)
  const isoFiatCurrencyCode = state.ui.settings.defaultIsoFiat
  const nativeToExchangeRatio = getExchangeDenomination(state, currencyCode).multiplier
  const exchangeAmount = convertNativeToExchange(nativeToExchangeRatio)(nativeAmount)
  const fiatAmount = convertCurrency(account, currencyCode, isoFiatCurrencyCode, parseFloat(exchangeAmount))
  const exceedsLimit = fiatAmount >= spendingLimits.transaction.amount

  return exceedsLimit ? 'pin' : 'none'
}
