// @flow

import { loadContactsStart } from './actions.js'
import { contactsReducer, initialState } from './contactsReducer.js'
import type { ContactsState } from './contactsReducer.js'

export type { ContactsState }
export { loadContactsStart, initialState, contactsReducer }
