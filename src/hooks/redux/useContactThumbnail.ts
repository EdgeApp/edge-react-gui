import * as React from 'react'
import { check } from 'react-native-permissions'

import { maybeShowContactsPermissionModal } from '../../components/modals/ContactsPermissionModal'
import { requestContactsPermission } from '../../components/services/PermissionsManager'
import { MERCHANT_CONTACTS } from '../../constants/MerchantContacts'
import { permissionNames } from '../../reducers/PermissionsReducer'
import { useDispatch, useSelector } from '../../types/reactRedux'
import { normalizeForSearch } from '../../util/utils'
import { useAsyncEffect } from '../useAsyncEffect'

/**
 * Looks up a thumbnail image for a contact. Will show a contacts permission
 * request modal if we haven't shown it before and the system contacts
 * permission is not granted.
 */
export const useContactThumbnail = (name?: string): string | undefined => {
  const contacts = useSelector(state => state.contacts)
  const dispatch = useDispatch()

  useAsyncEffect(
    async () => {
      const contactsPermission = await check(permissionNames.contacts).catch(
        (_error: unknown) => 'denied'
      )

      if (
        contactsPermission !== 'granted' &&
        contactsPermission !== 'limited'
      ) {
        const result = await dispatch(maybeShowContactsPermissionModal())
        if (result === 'allow') {
          await requestContactsPermission(true)
        }
      }
    },
    [],
    'useContactThumbnail'
  )

  return React.useMemo(() => {
    if (name == null) return

    const searchName = normalizeForSearch(name)

    // First: Try merchant "contacts" (priority). Return on first match.
    for (const merchant of MERCHANT_CONTACTS) {
      if (normalizeForSearch(merchant.displayName) === searchName) {
        return merchant.thumbnailPath
      }
    }

    // Second: Try device contacts, returning only if no ambiguity.
    const matchingThumbnails: string[] = []
    for (const contact of contacts) {
      const { givenName, familyName, company, displayName, thumbnailPath } =
        contact
      if (thumbnailPath == null || thumbnailPath === '') continue

      const fullName = [givenName, familyName]
        .filter(s => s != null && s !== '')
        .join(' ')
      const candidates = [
        displayName,
        fullName !== '' ? fullName : null,
        company
      ].filter((s): s is string => s != null && s !== '')

      let isMatch = false
      for (const value of candidates) {
        if (normalizeForSearch(value) === searchName) {
          isMatch = true
          break
        }
      }
      if (isMatch) matchingThumbnails.push(thumbnailPath)
    }

    // Ambiguity rule: If multiple contacts match, do not show an icon.
    if (matchingThumbnails.length === 1) return matchingThumbnails[0]
    return undefined
  }, [contacts, name])
}
