// @flow

import Contacts from 'react-native-contacts'

import type { GuiContact } from '../../../../types.js'

export const fetchContacts = (): Promise<Array<GuiContact>> => {
  return new Promise((resolve, reject) => {
    return Contacts.getAll((error, result) => {
      if (error) return reject(error)
      return resolve(result)
    })
  })
}
