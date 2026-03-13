import * as React from 'react'

import { MERCHANT_CONTACTS } from '../../constants/MerchantContacts'
import { useSelector } from '../../types/reactRedux'
import { normalizeForSearch } from '../../util/utils'

/**
 * Looks up a thumbnail image for a contact using existing contacts data.
 */
export const useContactThumbnail = (name?: string): string | undefined => {
  const contacts = useSelector(state => state.contacts)

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
