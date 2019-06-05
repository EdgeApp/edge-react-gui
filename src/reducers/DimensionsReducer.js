// @flow

import { type Reducer } from 'redux'

import type { Action } from '../modules/ReduxTypes'
import type { DeviceDimensions } from '../types.js'

export type DimensionsState = DeviceDimensions

const initialState = {
  keyboardHeight: 0
}

export const dimensions: Reducer<DimensionsState, Action> = (state = initialState, action: Action) => {
  switch (action.type) {
    case 'SET_KEYBOARD_HEIGHT':
      return {
        ...state,
        keyboardHeight: action.data
      }

    default:
      return state
  }
}
