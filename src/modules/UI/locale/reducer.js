import {combineReducers} from 'redux'
import * as ACTION from './action'

const localeInfo = (state = {}, action) => {
  switch (action.type) {
  case ACTION.SET_LOCALE_INFO:
    return action.data
  default:
    return state
  }
}

const locale = combineReducers({
  localeInfo
})

export default locale
