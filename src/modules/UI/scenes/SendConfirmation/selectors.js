// @flow

import { getSceneState } from '../../selectors.js'
import type { State } from '../../../ReduxTypes'
import type {AbcTransaction, AbcParsedUri, AbcMetadata} from 'airbitz-core-types'
import { initialState } from './reducer'

export const getScene = (state: State): any => getSceneState(state, 'sendConfirmation')

export const getNetworkFeeOption = (state: State): string => getScene(state).networkFeeOption
export const getCustomNetworkFee = (state: State): any => getScene(state).customNetworkFee
export const getTransaction = (state: State): AbcTransaction => getScene(state).transaction
export const getPending = (state: State): boolean => getScene(state).pending
export const getParsedUri = (state: State): AbcParsedUri => getScene(state).parsedUri
export const getKeyboardIsVisible = (state: State): boolean => getScene(state).keyboardIsVisible
export const getError = (state: State): Error => getScene(state).error
export const getLabel = (state: State): string => getScene(state).label
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
