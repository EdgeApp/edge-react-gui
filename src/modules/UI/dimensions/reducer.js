// @flow

import * as ACTION from './action'
import type { Action } from '../../ReduxTypes'

type DimensionsState = {
  keyboardHeight: number
}

const initialState = {
  keyboardHeight: 0
}

export const dimensions = (state: DimensionsState = initialState, action: Action) => {
  switch (action.type) {
    case ACTION.SET_KEYBOARD_HEIGHT:
      return {
        ...state,
        keyboardHeight: action.data
      }
    default:
      return state
  }
}

export default dimensions
