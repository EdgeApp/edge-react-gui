// @flow

import { LOAD_CONTACTS_SUCCESS } from './actions.js'

import type { GuiContact } from '../../types.js'
import type { Action } from '../../modules/ReduxTypes.js'

export const initialState = []
export type ContactsState = Array<GuiContact>

export const contactsReducer = (state: ContactsState = initialState, action: Action) => {
  switch (action.type) {
    case LOAD_CONTACTS_SUCCESS:
      // $FlowFixMe
      return action.data.contacts
    default:
      return state
  }
}

export default contactsReducer
