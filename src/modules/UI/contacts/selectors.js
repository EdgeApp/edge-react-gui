// @flow

import type {State} from '../../ReduxTypes'

export const getContactList = (state: State) => {
  return state.ui.contacts.contactList
}
