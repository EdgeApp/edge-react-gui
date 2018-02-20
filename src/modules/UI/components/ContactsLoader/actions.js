// @flow

import Contacts from 'react-native-contacts'

import { loadContactsStart, loadContacts } from '../../../../reducers/contacts/indexContacts.js'

const Promisify = func => () => {
  return new Promise((resolve, reject) => {
    return func((error, contacts) => {
      if (error) return reject(error)
      return resolve(contacts)
    })
  })
}

const getAllContacts = Promisify(Contacts.getAll)

export const loadContactsRequest = () => (dispatch: Dispatch) => {
  dispatch(loadContactsStart())
  getAllContacts()
    .then(contacts => {
      const filteredContacts = contacts.filter(item => item.givenName)
      const sortedContacts = filteredContacts.sort((a, b) => a.givenName.toUpperCase().localeCompare(b.givenName.toUpperCase()))

      dispatch(loadContacts(sortedContacts))
    })
    .catch(e => console.log(e))
}
