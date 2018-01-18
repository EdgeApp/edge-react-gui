import { combineReducers } from 'redux'
import * as ACTION from './action'

const keyboardHeight = (state = 0, action) => {
  switch (action.type) {
    case ACTION.SET_KEYBOARD_HEIGHT:
      return action.data
    default:
      return state
  }
}

export const dimensions = combineReducers({
  keyboardHeight
})

export default dimensions
