// @flow

import { add } from 'biggystring'
import type { EdgeMetadata, EdgeSpendInfo, EdgeSpendTarget, EdgeTransaction } from 'edge-core-js'
import { isEqual } from 'lodash'
import { type Reducer } from 'redux'

import { initialState } from '../../modules/UI/scenes/SendConfirmation/selectors'
import type { Action } from '../../types/reduxTypes.js'

export type FeeOption = 'custom' | 'high' | 'low' | 'standard'

export type GuiMakeSpendInfo = {
  currencyCode?: string,
  metadata?: any,
  nativeAmount?: string,
  networkFeeOption?: FeeOption,
  customNetworkFee?: Object,
  publicAddress?: string,
  spendTargets?: Array<EdgeSpendTarget>,
  lockInputs?: boolean,
  uniqueIdentifier?: string,
  otherParams?: Object,
  dismissAlert?: boolean,
  fioAddress?: string,
  memo?: string,
  onBack?: () => void,
  onDone?: (error: Error | null, edgeTransaction?: EdgeTransaction) => void,
  beforeTransaction?: () => Promise<void>
}

export type SendConfirmationState = {
  forceUpdateGuiCounter: number,
  transactionMetadata: EdgeMetadata | null,
  address: string,

  nativeAmount: string,

  guiMakeSpendInfo: GuiMakeSpendInfo,
  spendInfo: EdgeSpendInfo | null,

  isEditable: boolean,

  pending: boolean,
  transaction: EdgeTransaction | null,
  error: Error | null,

  pin: string,
  authRequired: 'pin' | 'none',

  toggleCryptoOnTop: number
}

export const sendConfirmationLegacy = (state: SendConfirmationState = initialState, action: Action) => {
  switch (action.type) {
    case 'UI/SEND_CONFIMATION/UPDATE_TRANSACTION': {
      if (!action.data) throw new Error('Invalid Action')
      const { guiMakeSpendInfo, forceUpdateGui } = action.data
      let forceUpdateGuiCounter = state.forceUpdateGuiCounter
      if (forceUpdateGui) {
        forceUpdateGuiCounter++
      }
      if (!guiMakeSpendInfo) return { ...state, forceUpdateGuiCounter }

      const { metadata = {}, customNetworkFee, ...others } = guiMakeSpendInfo
      if (!isEqual(state.guiMakeSpendInfo.metadata, metadata)) {
        state.guiMakeSpendInfo.metadata = { ...state.guiMakeSpendInfo.metadata, ...metadata }
      }

      if (customNetworkFee && !isEqual(state.guiMakeSpendInfo.customNetworkFee, customNetworkFee)) {
        state.guiMakeSpendInfo.customNetworkFee = customNetworkFee
      }

      return {
        ...state,
        forceUpdateGuiCounter,
        guiMakeSpendInfo: {
          ...state.guiMakeSpendInfo,
          ...others
        }
      }
    }

    case 'UI/SEND_CONFIMATION/NEW_SPEND_INFO': {
      if (!action.data) throw new Error('Invalid Action')
      const { spendInfo } = action.data
      const firstSpendTarget = spendInfo.spendTargets[0]
      const guiMakeSpendInfo = {
        ...state.guiMakeSpendInfo,
        networkFeeOption: spendInfo.networkFeeOption || state.guiMakeSpendInfo.networkFeeOption,
        customNetworkFee: spendInfo.customNetworkFee || state.guiMakeSpendInfo.customNetworkFee,
        publicAddress: firstSpendTarget.publicAddress || state.guiMakeSpendInfo.publicAddress,
        nativeAmount: firstSpendTarget.nativeAmount || state.guiMakeSpendInfo.nativeAmount,
        uniqueIdentifier: (firstSpendTarget.otherParams && firstSpendTarget.otherParams.uniqueIdentifier) || state.guiMakeSpendInfo.uniqueIdentifier,
        metadata: { ...state.guiMakeSpendInfo.metadata, ...spendInfo.metadata }
      }

      return {
        ...state,
        guiMakeSpendInfo
      }
    }

    default:
      return state
  }
}

export const nativeAmount: Reducer<string, Action> = (state = '0', action) => {
  switch (action.type) {
    case 'UI/SEND_CONFIMATION/NEW_SPEND_INFO': {
      if (!action.data) throw new Error('Invalid Action')
      const nativeAmount = action.data.spendInfo.nativeAmount || action.data.spendInfo.spendTargets.reduce((sum, target) => add(sum, target.nativeAmount), '0')
      return nativeAmount
    }

    case 'UI/SEND_CONFIMATION/UPDATE_TRANSACTION': {
      if (!action.data) throw new Error('Invalid Action')
      if (!action.data.guiMakeSpendInfo) return state
      return action.data.guiMakeSpendInfo.nativeAmount || state || '0'
    }

    default:
      return state
  }
}

export const spendInfo = (state: EdgeSpendInfo | null = null, action: Action) => {
  switch (action.type) {
    case 'UI/SEND_CONFIMATION/NEW_SPEND_INFO': {
      if (!action.data) throw new Error('Invalid Action')
      return action.data.spendInfo
    }

    default:
      return state
  }
}

export const address = (state: string = '', action: Action) => {
  switch (action.type) {
    case 'UI/SEND_CONFIMATION/NEW_SPEND_INFO': {
      if (!action.data) throw new Error('Invalid Action')
      return action.data.spendInfo.spendTargets[0].publicAddress
    }

    default:
      return state
  }
}

export const authRequired = (state: 'none' | 'pin' = 'none', action: Action) => {
  switch (action.type) {
    case 'UI/SEND_CONFIMATION/NEW_SPEND_INFO': {
      if (!action.data) throw new Error('Invalid Action')
      return action.data.authRequired || 'none'
    }

    default:
      return state
  }
}

export const transactionMetadata = (state: EdgeMetadata | null = null, action: Action) => {
  switch (action.type) {
    case 'UI/SEND_CONFIMATION/UPDATE_TRANSACTION': {
      if (!action.data) throw new Error('Invalid Action')
      if (!action.data.guiMakeSpendInfo || !action.data.guiMakeSpendInfo.metadata || !action.data.guiMakeSpendInfo.metadata.name) return state

      return action.data.guiMakeSpendInfo.metadata || null
    }

    case 'UI/SEND_CONFIMATION/NEW_SPEND_INFO': {
      if (!action.data) throw new Error('Invalid Action')
      return action.data.spendInfo.metadata || null
    }

    default:
      return state
  }
}

export const error = (state: Error | null = null, action: Action) => {
  switch (action.type) {
    case 'UI/SEND_CONFIMATION/UPDATE_TRANSACTION': {
      if (!action.data) throw new Error('Invalid Action')
      return action.data.error
    }

    case 'UI/SEND_CONFIMATION/NEW_SPEND_INFO': {
      return null
    }

    default:
      return state
  }
}

export const isEditable = (state: boolean = true, action: Action) => {
  switch (action.type) {
    case 'UI/SEND_CONFIMATION/UPDATE_TRANSACTION':
      if (!action.data) throw new Error('Invalid Action')
      const { guiMakeSpendInfo } = action.data
      if (!guiMakeSpendInfo || guiMakeSpendInfo.lockInputs) {
        return false
      }
      return state
    default:
      return state
  }
}

export const pin = (state: string = '', action: Action) => {
  switch (action.type) {
    case 'UI/SEND_CONFIMATION/NEW_PIN': {
      if (!action.data) throw new Error('Invalid Action')
      return action.data.pin
    }

    default:
      return state
  }
}

export const pending = (state: boolean = false, action: Action) => {
  switch (action.type) {
    case 'UI/SEND_CONFIMATION/UPDATE_SPEND_PENDING': {
      if (!action.data) throw new Error('Invalid Action')
      return action.data.pending
    }

    default:
      return state
  }
}

export const transaction = (state: EdgeTransaction | null = null, action: Action) => {
  switch (action.type) {
    case 'UI/SEND_CONFIMATION/UPDATE_TRANSACTION': {
      if (!action.data) throw new Error('Invalid Action')
      return action.data.transaction
    }

    case 'UI/SEND_CONFIMATION/NEW_SPEND_INFO': {
      return null
    }

    default:
      return state
  }
}

export const toggleCryptoOnTop = (state: number = 0, action: Action) => {
  switch (action.type) {
    case 'UI/SEND_CONFIMATION/TOGGLE_CRYPTO_ON_TOP': {
      return state + 1
    }

    default:
      return state
  }
}

export const sendConfirmation: Reducer<SendConfirmationState, Action> = (state = initialState, action) => {
  if (action.type === 'UI/SEND_CONFIMATION/RESET') return initialState

  // make easier to debug legacySendConfirmation return value with breakpoint
  const legacySendConfirmation = sendConfirmationLegacy(state, action)
  return {
    ...legacySendConfirmation,
    isEditable: isEditable(state.isEditable, action),
    error: error(state.error, action),
    pin: pin(state.pin, action),
    pending: pending(state.pending, action),
    transaction: transaction(state.transaction, action),
    transactionMetadata: transactionMetadata(state.transactionMetadata, action),
    spendInfo: spendInfo(state.spendInfo, action),
    nativeAmount: nativeAmount(state.nativeAmount, action),
    address: address(state.address, action),
    authRequired: authRequired(state.authRequired, action),
    toggleCryptoOnTop: toggleCryptoOnTop(state.toggleCryptoOnTop, action)
  }
}
export default sendConfirmation
