// @flow

import { initialState } from './reducer'
import { STANDARD_FEE } from '../../../../constants/FeeConstants'
import { getSceneState, getSelectedCurrencyCode } from '../../selectors.js'
import type { State } from '../../../ReduxTypes'
import type {
  AbcSpendTarget,
  AbcSpendInfo,
  AbcTransaction,
  AbcMetadata
} from 'airbitz-core-types'

export type AbcMakeSpendInfo = {
  currencyCode?: string,
  networkFeeOption?: string,
  publicAddress?: string,
  metadata?: any,
  customNetworkFee?: any,
  nativeAmount?: string,
  spendTargets?: Array<AbcSpendTarget>
}

export const getScene = (state: State): any => getSceneState(state, 'sendConfirmation')

export const getTransaction = (state: State): AbcTransaction => getScene(state).transaction
export const getPending = (state: State): boolean => getScene(state).pending
export const getError = (state: State): Error => getScene(state).error
export const getParsedUri = (state: State): AbcMakeSpendInfo => getScene(state).parsedUri
export const getKeyboardIsVisible = (state: State): boolean => getScene(state).keyboardIsVisible
export const getLabel = (state: State): string => getScene(state).label

export const getNetworkFeeOption = (state: State): string =>
  getParsedUri(state).networkFeeOption || initialState.parsedUri.networkFeeOption || STANDARD_FEE
export const getCustomNetworkFee = (state: State): any =>
  getParsedUri(state).customNetworkFee || initialState.parsedUri.customNetworkFee || {}
export const getNativeAmount = (state: State): string =>
  getParsedUri(state).nativeAmount || initialState.parsedUri.nativeAmount || ''
export const getMetadata = (state: State): AbcMetadata =>
  getParsedUri(state).metadata || initialState.parsedUri.metadata || {}
export const getPublicAddress = (state: State): string =>
  getParsedUri(state).publicAddress || initialState.parsedUri.publicAddress || ''
export const getNetworkFee = (state: State): string => {
  const transaction = getTransaction(state)
  if (transaction && transaction.networkFee) return transaction.networkFee
  return initialState.parsedUri.nativeAmount || ''
}
export const getSpendInfo = (state: State, newSpendInfo?: AbcMakeSpendInfo = {}): AbcSpendInfo => ({
  currencyCode: newSpendInfo.currencyCode || getSelectedCurrencyCode(state),
  metadata: newSpendInfo.metadata
    ? { ...getMetadata(state), ...newSpendInfo.metadata }
    : getMetadata(state),
  spendTargets: [{
    nativeAmount: newSpendInfo.nativeAmount || getNativeAmount(state),
    publicAddress: newSpendInfo.publicAddress || getPublicAddress(state)
  }],
  networkFeeOption: newSpendInfo.networkFeeOption || getNetworkFeeOption(state),
  customNetworkFee: newSpendInfo.customNetworkFee
    ? { ...getCustomNetworkFee(state), ...newSpendInfo.customNetworkFee }
    : getCustomNetworkFee(state)
})
