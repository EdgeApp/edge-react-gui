import * as React from 'react'
import { check } from 'react-native-permissions'

import { maybeShowContactsPermissionModal } from '../../components/modals/ContactsPermissionModal'
import { requestContactsPermission } from '../../components/services/PermissionsManager'
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
  const [currentContactsPermissionOn, setCurrentContactsPermissionOn] = React.useState(false)

  useAsyncEffect(
    async () => {
      const currentContactsPermissionOn = (await check(permissionNames.contacts).catch(_error => 'denied')) === 'granted'
      setCurrentContactsPermissionOn(currentContactsPermissionOn)

      if (!currentContactsPermissionOn) {
        const result = await dispatch(maybeShowContactsPermissionModal())
        if (result === 'allow') {
          await requestContactsPermission(true)
        }
      }
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
      if (contactName === searchName && contact.thumbnailPath != null && contact.thumbnailPath !== '') {
        return contact.thumbnailPath
      }
    }
  }, [contacts, currentContactsPermissionOn, name])
}
