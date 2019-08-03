// @flow

import { type Reducer } from 'redux'

import type { Action } from '../../types/reduxTypes.js'
import type { GuiReceiveAddress } from '../../types/types.js'

export type RequestSceneState = {
  receiveAddress: GuiReceiveAddress
}

const receiveAddress: GuiReceiveAddress = {
  publicAddress: '',
  nativeAmount: '0',
  metadata: {}
}

const initialState: RequestSceneState = {
  receiveAddress
}

export const request: Reducer<RequestSceneState, Action> = (state = initialState, action: Action) => {
  switch (action.type) {
    case 'UPDATE_RECEIVE_ADDRESS_SUCCESS': {
      if (!action.data) {
        return state
      }
      return {
        ...state,
        receiveAddress: action.data.receiveAddress
      }
    }

    default:
      return state
  }
}
