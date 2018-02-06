// @flow

import type {State} from '../../modules/ReduxTypes'

export const getContacts = (state: State) => {
  return state.contacts
}
