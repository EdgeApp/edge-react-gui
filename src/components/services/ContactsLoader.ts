import * as React from 'react'
import Contacts from 'react-native-contacts'
import { sprintf } from 'sprintf-js'

import { MERCHANT_CONTACTS } from '../../constants/MerchantContacts'
import { lstrings } from '../../locales/strings'
import { useDispatch, useSelector } from '../../types/reactRedux'
import type { GuiContact } from '../../types/types'
import { showError } from '../services/AirshipInstance'

interface Props {}

export function ContactsLoader(props: Props): React.ReactElement | null {
  const contactsPermission = useSelector(state => state.permissions.contacts)
  const dispatch = useDispatch()

  React.useEffect(() => {
    const loadContacts = async (): Promise<void> => {
      const allContacts: GuiContact[] = MERCHANT_CONTACTS.map(contact => ({
        displayName: contact.displayName,
        givenName: contact.displayName,
        familyName: null,
        hasThumbnail: true,
        thumbnailPath: contact.thumbnailPath,
        company: contact.displayName
      }))

      // Load phone contacts and add to GUI contacts:
      if (
        contactsPermission === 'granted' ||
        contactsPermission === 'limited'
      ) {
        const contacts = await Contacts.getAll()
        for (const contact of contacts) {
          const { company, displayName, familyName, givenName } = contact
          // Add only contacts we can display. Must contain at least one name
          // field for display:
          if (
            (displayName != null && displayName.trim() !== '') ||
            (givenName != null && givenName.trim() !== '') ||
            (familyName != null && familyName.trim() !== '') ||
            (company != null && company.trim() !== '')
          ) {
            allContacts.push(contact)
          }
        }
      }

      // Save to redux:
      allContacts.sort(
        (a, b) =>
          (
            a.displayName?.toUpperCase() ??
            a.givenName?.toUpperCase() ??
            a.familyName?.toUpperCase() ??
            a.company?.toUpperCase() ??
            ''
          ).localeCompare(
            b.displayName?.toUpperCase() ??
              b.givenName?.toUpperCase() ??
              b.familyName?.toUpperCase() ??
              b.company?.toUpperCase() ??
              ''
          ) ?? 0
      )
      dispatch({
        type: 'CONTACTS/LOAD_CONTACTS_SUCCESS',
        data: { contacts: allContacts }
      })
    }

    loadContacts().catch((error: unknown) => {
      showError(sprintf(lstrings.contacts_load_failed_message_s, String(error)))
    })
  }, [contactsPermission, dispatch])

  return null
}
