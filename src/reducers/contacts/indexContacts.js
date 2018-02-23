// @flow

import { contactsReducer, initialState, type ContactsState } from './contactsReducer.js'
import { loadContactsStart } from './actions.js'

export type { ContactsState }
export { loadContactsStart, initialState, contactsReducer }
