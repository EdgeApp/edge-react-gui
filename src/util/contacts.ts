import { Fields, getContactsAsync } from 'expo-contacts'
import { Platform } from 'react-native'

import type { GuiContact } from '../types/types'

/**
 * Device contacts via expo-contacts.
 * react-native-contacts stays linked; ContactsLoader was the only GUI caller.
 * Web has no address-book API, so this returns [].
 */

const CONTACT_FIELDS = [
  Fields.Name,
  Fields.FirstName,
  Fields.LastName,
  Fields.Company,
  Fields.Image,
  Fields.ImageAvailable
]

const PAGE_SIZE = 1000

export const getAllContacts = async (): Promise<GuiContact[]> => {
  if (Platform.OS === 'web') {
    return []
  }

  const contacts: GuiContact[] = []
  let pageOffset = 0

  while (true) {
    const { data, hasNextPage } = await getContactsAsync({
      fields: CONTACT_FIELDS,
      pageSize: PAGE_SIZE,
      pageOffset
    })

    for (const contact of data) {
      contacts.push({
        givenName: contact.firstName ?? null,
        familyName: contact.lastName ?? null,
        displayName: contact.name ?? null,
        company: contact.company ?? null,
        hasThumbnail: contact.imageAvailable === true,
        thumbnailPath: contact.image?.uri ?? ''
      })
    }

    if (!hasNextPage || data.length === 0) {
      break
    }
    pageOffset += data.length
  }

  return contacts
}
