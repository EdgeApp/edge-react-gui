// @flow

import { combineReducers } from 'redux'

import type { GuiContact } from '../../../types'
import type { Action } from '../../ReduxTypes'
import * as ACTION from './action'

type ContactListState = Array<GuiContact>
export const contactList = (state: ContactListState = [], action: Action) => {
  switch (action.type) {
    case ACTION.SET_CONTACT_LIST:
      return action.data
    default:
      return state
  }
}

export const contacts = combineReducers({
  contactList
})

export default contacts
