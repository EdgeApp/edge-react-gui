import * as React from 'react'

import { showError } from '../../components/services/AirshipInstance'
import { edgeRequestPermission } from '../../components/services/PermissionsManager'
import { useSelector } from '../../types/reactRedux'
import { normalizeForSearch } from '../../util/utils'

let isModalShowing = false

/**
 * Looks up a thumbnail image for a contact.
 */
export function useContactThumbnail(name?: string): string | undefined {
  const contacts = useSelector(state => state.contacts)

  React.useEffect(() => {
    if (name == null) return
    if (isModalShowing) return
    isModalShowing = true
    edgeRequestPermission('contacts')
      .catch(err => {
        showError(err)
      })
      .finally(() => (isModalShowing = false))
  }, [name])

  return React.useMemo(() => {
    if (name == null) return

    const searchName = normalizeForSearch(name)
    for (const contact of contacts) {
      const { givenName, familyName } = contact
      const contactName = normalizeForSearch(`${givenName}${familyName ?? ''}`)
      if (contact.thumbnailPath != null && contactName === searchName) {
        return contact.thumbnailPath
      }
    }
  }, [contacts, name])
}
