// @flow

import * as UI_SELECTORS from '../../selectors.js'
import type { State } from '../../../ReduxTypes'

export const getScene = (state: State) => UI_SELECTORS.getSceneState(state, 'sendConfirmation')

export const getNetworkFeeOption = (state: State) => getScene(state).networkFeeOption
export const getCustomNetworkFee = (state: State) => getScene(state).customNetworkFee
export const getTransaction = (state: State) => getScene(state).transaction
export const getPending = (state: State) => getScene(state).pending
export const getParsedUri = (state: State) => getScene(state).parsedUri
export const getKeyboardIsVisible = (state: State) => getScene(state).keyboardIsVisible
export const getError = (state: State) => getScene(state).error
export const getLabel = (state: State) => getScene(state).label
export const getPublicAddress = (state: State) => getScene(state).publicAddress
