// @flow

import Contacts from 'react-native-contacts'

import type { GuiContact } from '../../../../types.js'

export const fetchContacts = (): Promise<Array<GuiContact>> => {
  return new Promise((resolve, reject) => {
    return Contacts.getAll((error, result) => {
      // The native code sometimes sends strings instead of errors:
      if (error) return reject(typeof error === 'string' ? new Error(error) : error)
      return resolve(result)
    })
  })
}
