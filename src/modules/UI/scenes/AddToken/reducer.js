import {combineReducers} from 'redux'
import * as ACTION from './action'

const addTokenPending = (state = false, action) => {
  const type = action.type
  switch (type) {
  case ACTION.ADD_TOKEN_START :
    return true
  case ACTION.ADD_TOKEN_SUCCESS :
    return false
  default:
    return state
  }
}

const addToken = combineReducers({
  addTokenPending
})

export default addToken
