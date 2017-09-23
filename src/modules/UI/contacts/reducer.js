import {combineReducers} from 'redux'
import * as ACTION from './action'

const contactList = (state = [], action) => {
  switch (action.type) {
  case ACTION.SET_CONTACT_LIST:
    return action.data
  default:
    return state
  }
}

const contacts = combineReducers({
  contactList
})

export default contacts
