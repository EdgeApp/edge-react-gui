// @flow

import { contactsReducer, initialState, type ContactsState } from './contactsReducer.js'
import { loadContacts, loadContactsStart } from './actions.js'

export type { ContactsState }
export { loadContacts, loadContactsStart, initialState, contactsReducer }
