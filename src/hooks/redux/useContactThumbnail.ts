import * as React from 'react'

import { setContactsPermissionOn } from '../../actions/LocalSettingsActions'
import { showError } from '../../components/services/AirshipInstance'
import { showContactsPermissionModal } from '../../components/services/PermissionsManager'
import { useDispatch, useSelector } from '../../types/reactRedux'
import { Dispatch } from '../../types/reduxTypes'
import { normalizeForSearch } from '../../util/utils'

export const maybeShowContactsPermissionModal = (dispatch: Dispatch, contactsPermissionOn: boolean) => {
  // Ignored if 'Contacts Access' setting is disabled
  if (!contactsPermissionOn) return

  // Contacts permission request:
  showContactsPermissionModal(contactsPermissionOn)
    .then(modalResult => {
      if (modalResult !== undefined) {
        // Update the Edge setting and system permission setting
        dispatch(setContactsPermissionOn(modalResult === 'allow')).catch(showError)
      }
    })
    .catch(showError)
}

/**
 * Looks up a thumbnail image for a contact.
 */
export const useContactThumbnail = (name?: string): string | undefined => {
  const dispatch = useDispatch()
  const contacts = useSelector(state => state.contacts)
  const contactsPermissionOn = useSelector(state => state.ui.settings.contactsPermissionOn)

  React.useEffect(() => {
    maybeShowContactsPermissionModal(dispatch, contactsPermissionOn)

    // Avoid popping up the modal when the scene calling the hook is mounted and
    // the user changes contactsPermissionOn.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch])

  return React.useMemo(() => {
    if (name == null || !contactsPermissionOn) return

    const searchName = normalizeForSearch(name)
    for (const contact of contacts) {
      const { givenName, familyName } = contact
      const contactName = normalizeForSearch(`${givenName}${familyName ?? ''}`)
      if (contact.thumbnailPath != null && contactName === searchName) {
        return contact.thumbnailPath
      }
    }
  }, [contacts, contactsPermissionOn, name])
}
