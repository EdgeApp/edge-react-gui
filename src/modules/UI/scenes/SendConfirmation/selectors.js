// @flow

import type { EdgeMetadata, EdgeSpendInfo, EdgeTransaction } from 'edge-core-js'

import { STANDARD_FEE } from '../../../../constants/indexConstants'
import { type GuiMakeSpendInfo } from '../../../../reducers/scenes/SendConfirmationReducer.js'
import { convertNativeToExchange } from '../../../../util/utils.js'
import type { State } from '../../../ReduxTypes'
import { getExchangeDenomination } from '../../../Settings/selectors.js'
import { convertCurrency, getSceneState, getSelectedCurrencyCode } from '../../selectors.js'

export const initialState = {
  isKeyboardVisible: false,
  forceUpdateGuiCounter: 0,

  guiMakeSpendInfo: {
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
  transactionMetadata: null,
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
export const getGuiMakeSpendInfo = (state: State): GuiMakeSpendInfo => state.ui.scenes.sendConfirmation.guiMakeSpendInfo || initialState.guiMakeSpendInfo
export const getForceUpdateGuiCounter = (state: State): number => state.ui.scenes.sendConfirmation.forceUpdateGuiCounter

export const getNetworkFeeOption = (state: State): string => getGuiMakeSpendInfo(state).networkFeeOption || initialState.guiMakeSpendInfo.networkFeeOption || ''
export const getCustomNetworkFee = (state: State): any => getGuiMakeSpendInfo(state).customNetworkFee || initialState.guiMakeSpendInfo.customNetworkFee || {}
export const getMetadata = (state: State): EdgeMetadata => getGuiMakeSpendInfo(state).metadata || initialState.guiMakeSpendInfo.metadata || {}
export const getPublicAddress = (state: State): string => {
  try {
    return (
      getGuiMakeSpendInfo(state).publicAddress ||
      initialState.guiMakeSpendInfo.publicAddress ||
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
  const guiMakeSpendInfo = state.ui.scenes.sendConfirmation.guiMakeSpendInfo || initialState.guiMakeSpendInfo
  const uniqueIdentifier = guiMakeSpendInfo.uniqueIdentifier || ''
  return uniqueIdentifier || ''
}

export const getNetworkFee = (state: State): string => getTransaction(state).networkFee
export const getParentNetworkFee = (state: State): string | void => getTransaction(state).parentNetworkFee

export const getSpendInfo = (state: State, newSpendInfo?: GuiMakeSpendInfo = {}): EdgeSpendInfo => {
  const uniqueIdentifier = newSpendInfo.uniqueIdentifier || getUniqueIdentifier(state)
  let spendTargets = []
  if (newSpendInfo.spendTargets) {
    spendTargets = newSpendInfo.spendTargets
  } else {
    spendTargets = [
      {
        nativeAmount: newSpendInfo.nativeAmount || getNativeAmount(state),
        publicAddress: newSpendInfo.publicAddress || getPublicAddress(state),
        otherParams: {
          uniqueIdentifier
        }
      }
    ]
  }

  return {
    currencyCode: newSpendInfo.currencyCode || getSelectedCurrencyCode(state),
    metadata: newSpendInfo.metadata ? { ...getMetadata(state), ...newSpendInfo.metadata } : getMetadata(state),
    spendTargets,
    networkFeeOption: newSpendInfo.networkFeeOption || getNetworkFeeOption(state),
    customNetworkFee: newSpendInfo.customNetworkFee ? { ...getCustomNetworkFee(state), ...newSpendInfo.customNetworkFee } : getCustomNetworkFee(state),
    otherParams: newSpendInfo.otherParams || {}
  }
}

export const getSpendInfoWithoutState = (newSpendInfo?: GuiMakeSpendInfo = {}, sceneState: Object, selectedCurrencyCode: string): EdgeSpendInfo => {
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
          uniqueIdentifier
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

export type AuthType = 'pin' | 'none'
export const getAuthRequired = (state: State, spendInfo: EdgeSpendInfo): AuthType => {
  const isEnabled = state.ui.settings.spendingLimits.transaction.isEnabled
  if (!isEnabled) return 'none'

  const currencyCode = spendInfo.currencyCode || spendInfo.spendTargets[0].currencyCode
  const { nativeAmount } = spendInfo.spendTargets[0]
  if (!currencyCode || !nativeAmount) throw new Error('Invalid Spend Request')

  const { spendingLimits } = state.ui.settings
  const isoFiatCurrencyCode = state.ui.settings.defaultIsoFiat
  const nativeToExchangeRatio = getExchangeDenomination(state, currencyCode).multiplier
  const exchangeAmount = convertNativeToExchange(nativeToExchangeRatio)(nativeAmount)
  const fiatAmount = convertCurrency(state, currencyCode, isoFiatCurrencyCode, parseFloat(exchangeAmount))
  const exceedsLimit = fiatAmount >= spendingLimits.transaction.amount

  return exceedsLimit ? 'pin' : 'none'
}
