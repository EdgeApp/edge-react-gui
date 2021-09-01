// @flow

import { add } from 'biggystring'
import { type EdgeMetadata, type EdgeSpendInfo, type EdgeTransaction } from 'edge-core-js'
import { isEqual } from 'lodash'
import { type Reducer } from 'redux'

import { initialState } from '../../modules/UI/scenes/SendConfirmation/selectors.js'
import { type Action } from '../../types/reduxTypes.js'
import { type GuiMakeSpendInfo } from '../../types/types.js'

export type SendConfirmationState = {
  forceUpdateGuiCounter: number,
  transactionMetadata: EdgeMetadata | null,
  address: string,

  nativeAmount: string,

  guiMakeSpendInfo: GuiMakeSpendInfo,
  spendInfo: EdgeSpendInfo | null,

  pending: boolean,
  transaction: EdgeTransaction | null,
  error: Error | null,

  pin: string,
  authRequired: 'pin' | 'none',

  toggleCryptoOnTop: number,

  maxSpendSet: boolean,

  isSendUsingFioAddress: boolean
}

const sendConfirmationLegacy = (state: SendConfirmationState = initialState, action: Action) => {
  switch (action.type) {
    case 'UI/SEND_CONFIRMATION/UPDATE_TRANSACTION': {
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

    case 'UI/SEND_CONFIRMATION/NEW_SPEND_INFO': {
      const { spendInfo } = action.data
      const firstSpendTarget = spendInfo.spendTargets[0]
      const guiMakeSpendInfo = {
        ...state.guiMakeSpendInfo,
        networkFeeOption: spendInfo.networkFeeOption || state.guiMakeSpendInfo.networkFeeOption,
        customNetworkFee: spendInfo.customNetworkFee || state.guiMakeSpendInfo.customNetworkFee,
        spendTargets: spendInfo.spendTargets || state.guiMakeSpendInfo.spendTargets,
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

const nativeAmount: Reducer<string, Action> = (state = '', action): string => {
  switch (action.type) {
    case 'UI/SEND_CONFIRMATION/NEW_SPEND_INFO': {
      if (action.data.spendInfo.spendTargets[0].nativeAmount != null && action.data.spendInfo.spendTargets[0].nativeAmount !== '') {
        return action.data.spendInfo.spendTargets.reduce((sum, target) => add(sum, target.nativeAmount ?? '0'), '0')
      }
      return state
    }

    case 'UI/SEND_CONFIRMATION/UPDATE_TRANSACTION': {
      return action.data.guiMakeSpendInfo.nativeAmount || state || ''
    }

    default:
      return state
  }
}

const spendInfo = (state: EdgeSpendInfo | null = null, action: Action): EdgeSpendInfo | null => {
  switch (action.type) {
    case 'UI/SEND_CONFIRMATION/NEW_SPEND_INFO': {
      return action.data.spendInfo
    }

    default:
      return state
  }
}

const address = (state: string = '', action: Action): string => {
  switch (action.type) {
    case 'UI/SEND_CONFIRMATION/NEW_SPEND_INFO': {
      return action.data.spendInfo.spendTargets[0].publicAddress ?? ''
    }

    default:
      return state
  }
}

const authRequired = (state: 'none' | 'pin' = 'none', action: Action): 'none' | 'pin' => {
  switch (action.type) {
    case 'UI/SEND_CONFIRMATION/NEW_SPEND_INFO': {
      return action.data.authRequired || 'none'
    }

    default:
      return state
  }
}

const transactionMetadata = (state: EdgeMetadata | null = null, action: Action): EdgeMetadata | null => {
  switch (action.type) {
    case 'UI/SEND_CONFIRMATION/UPDATE_TRANSACTION': {
      if (!action.data.guiMakeSpendInfo || !action.data.guiMakeSpendInfo.metadata || !action.data.guiMakeSpendInfo.metadata.name) return state

      return action.data.guiMakeSpendInfo.metadata || null
    }

    case 'UI/SEND_CONFIRMATION/NEW_SPEND_INFO': {
      return action.data.spendInfo.metadata || null
    }

    default:
      return state
  }
}

const error = (state: Error | null = null, action: Action): Error | null => {
  switch (action.type) {
    case 'UI/SEND_CONFIRMATION/UPDATE_TRANSACTION': {
      return action.data.error
    }

    case 'UI/SEND_CONFIRMATION/NEW_SPEND_INFO': {
      return null
    }

    default:
      return state
  }
}

const pin = (state: string = '', action: Action): string => {
  switch (action.type) {
    case 'UI/SEND_CONFIRMATION/NEW_PIN': {
      return action.data.pin
    }

    default:
      return state
  }
}

const pending = (state: boolean = false, action: Action): boolean => {
  switch (action.type) {
    case 'UI/SEND_CONFIRMATION/UPDATE_SPEND_PENDING': {
      return action.data.pending
    }

    default:
      return state
  }
}

const transaction = (state: EdgeTransaction | null = null, action: Action): EdgeTransaction | null => {
  switch (action.type) {
    case 'UI/SEND_CONFIRMATION/UPDATE_TRANSACTION': {
      return action.data.transaction
    }

    case 'UI/SEND_CONFIRMATION/NEW_SPEND_INFO': {
      return null
    }

    default:
      return state
  }
}

const toggleCryptoOnTop = (state: number = 0, action: Action): number => {
  switch (action.type) {
    case 'UI/SEND_CONFIRMATION/TOGGLE_CRYPTO_ON_TOP': {
      return state + 1
    }

    default:
      return state
  }
}

const maxSpendSet = (state: boolean = false, action: Action): boolean => {
  switch (action.type) {
    case 'UI/SEND_CONFIRMATION/SET_MAX_SPEND': {
      return action.data
    }

    default:
      return state
  }
}

const isSendUsingFioAddress = (state: boolean = false, action: Action): boolean => {
  switch (action.type) {
    case 'UI/SEND_CONFIRMATION/NEW_SPEND_INFO': {
      const { spendInfo } = action.data
      let isSendUsingFioAddress = false
      for (const spendTarget of spendInfo.spendTargets) {
        if (spendTarget.otherParams && spendTarget.otherParams.isSendUsingFioAddress != null) {
          isSendUsingFioAddress = spendTarget.otherParams.isSendUsingFioAddress
        }
      }
      return isSendUsingFioAddress
    }

    default:
      return state
  }
}

export const sendConfirmation: Reducer<SendConfirmationState, Action> = (state = initialState, action) => {
  if (action.type === 'UI/SEND_CONFIRMATION/RESET') return initialState

  // make easier to debug legacySendConfirmation return value with breakpoint
  const legacySendConfirmation = sendConfirmationLegacy(state, action)

  return {
    ...legacySendConfirmation,
    error: error(state.error, action),
    pin: pin(state.pin, action),
    pending: pending(state.pending, action),
    transaction: transaction(state.transaction, action),
    transactionMetadata: transactionMetadata(state.transactionMetadata, action),
    spendInfo: spendInfo(state.spendInfo, action),
    nativeAmount: nativeAmount(state.nativeAmount, action),
    address: address(state.address, action),
    authRequired: authRequired(state.authRequired, action),
    toggleCryptoOnTop: toggleCryptoOnTop(state.toggleCryptoOnTop, action),
    maxSpendSet: maxSpendSet(state.maxSpendSet, action),
    isSendUsingFioAddress: isSendUsingFioAddress(state.isSendUsingFioAddress, action)
  }
}
