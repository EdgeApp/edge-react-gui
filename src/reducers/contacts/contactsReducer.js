// @flow

import type { Action } from '../../modules/ReduxTypes.js'
import type { GuiContact } from '../../types.js'

export const initialState = []
export type ContactsState = Array<GuiContact>

export const contactsReducer = (state: ContactsState = initialState, action: Action) => {
  switch (action.type) {
    case 'CONTACTS/LOAD_CONTACTS_SUCCESS': {
      if (!action.data) throw new Error('Invalid action')
      return action.data.contacts
    }

    default:
      return state
  }
}

export default contactsReducer
