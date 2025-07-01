import * as React from 'react'
import { check } from 'react-native-permissions'

import { requestContactsPermission } from '../../components/services/PermissionsManager'
import { permissionNames } from '../../reducers/PermissionsReducer'
import { useSelector } from '../../types/reactRedux'
import { normalizeForSearch } from '../../util/utils'
import { useAsyncEffect } from '../useAsyncEffect'

/**
 * Looks up a thumbnail image for a contact. Will check contacts permission
 * but will NOT show the contacts permission modal.
 */
export const useContactThumbnail = (name?: string): string | undefined => {
  const contacts = useSelector(state => state.contacts)
  const [currentContactsPermissionOn, setCurrentContactsPermissionOn] =
    React.useState(false)

  useAsyncEffect(
    async () => {
      const currentContactsPermissionOn =
        (await check(permissionNames.contacts).catch(_error => 'denied')) ===
        'granted'
      setCurrentContactsPermissionOn(currentContactsPermissionOn)
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [],
    'useContactThumbnail'
  )

  return React.useMemo(() => {
    if (name == null || !currentContactsPermissionOn) return

    const searchName = normalizeForSearch(name)
    for (const contact of contacts) {
      const { givenName, familyName } = contact
      const contactName = normalizeForSearch(`${givenName}${familyName ?? ''}`)
      if (
        contactName === searchName &&
        contact.thumbnailPath != null &&
        contact.thumbnailPath !== ''
      ) {
        return contact.thumbnailPath
      }
    }
  }, [contacts, currentContactsPermissionOn, name])
}
