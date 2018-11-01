// @flow

import type { GuiContact } from '../types'

export const loadContactsStart = () => ({
  type: 'CONTACTS/LOAD_CONTACTS_START'
})

export const loadContactsSuccess = (contacts: Array<GuiContact>) => ({
  type: 'CONTACTS/LOAD_CONTACTS_SUCCESS',
  data: { contacts }
})
