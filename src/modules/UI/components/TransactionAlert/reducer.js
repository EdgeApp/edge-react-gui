import * as ACTION from './action'
import { combineReducers } from 'redux'

const view = (state = '', action) => {
  switch (action.type) {
  case ACTION.OPEN_TRANSACTION_ALERT :
    return true
  case ACTION.CLOSE_TRANSACTION_ALERT :
    return false
  default:
    return state
  }
}

const message = (state = '', action) => {
  switch (action.type) {
  case ACTION.OPEN_TRANSACTION_ALERT :
    return action.data.message
  case ACTION.CLOSE_TRANSACTION_ALERT :
    return ''
  default:
    return state
  }
}

// const route = (state = {}, action) => {
//   switch (action.type) {
//     case ACTION.OPEN_TRANSACTION_ALERT :
//       return action.data.route
//     case ACTION.CLOSE_TRANSACTION_ALERT :
//       return null
//     default:
//       return state
//   }
// }

export default combineReducers({
  view,
  message
  // route
})
