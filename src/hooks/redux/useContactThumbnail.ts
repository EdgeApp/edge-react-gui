import * as React from 'react'

import { useSelector } from '../../types/reactRedux'
import { normalizeForSearch } from '../../util/utils'

/**
 * Looks up a thumbnail image for a contact.
 */
export function useContactThumbnail(name?: string): string | undefined {
  const contacts = useSelector(state => state.contacts)

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
