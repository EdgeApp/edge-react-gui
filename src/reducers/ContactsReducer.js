// @flow

import type { Action } from '../types/reduxTypes.js'
import type { GuiContact } from '../types/types.js'

export type ContactsState = Array<GuiContact>

export const initialState = []

export const contacts = (state: ContactsState = initialState, action: Action): ContactsState => {
  switch (action.type) {
    case 'CONTACTS/LOAD_CONTACTS_SUCCESS': {
      if (!action.data) throw new Error('Invalid action')
      return action.data.contacts
    }

    default:
      return state
  }
}
