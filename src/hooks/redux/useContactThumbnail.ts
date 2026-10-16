import * as React from 'react'

import type { PluginIdIcon } from '../../actions/CategoriesActions'
import { useTheme } from '../../components/services/ThemeContext'
import { MERCHANT_CONTACTS } from '../../constants/MerchantContacts'
import { useSelector } from '../../types/reactRedux'
import type { Theme } from '../../types/Theme'
import {
  getSwapPluginIconUri,
  hasThemedSwapPluginIcon
} from '../../util/CdnUris'
import { normalizeForSearch } from '../../util/utils'

/**
 * Looks up a thumbnail image for a contact using existing contacts data.
 */
export const useContactThumbnail = (
  name?: string
): PluginIdIcon | undefined => {
  const contacts = useSelector(state => state.contacts)
  const theme = useTheme()

  return React.useMemo(() => {
    if (name == null) return

    const searchName = normalizeForSearch(name)

    // First: Try merchant "contacts" (priority).
    const merchantThumbnail = getMerchantThumbnail(name, theme)
    if (merchantThumbnail != null) return merchantThumbnail

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
    if (matchingThumbnails.length === 1) {
      return { uri: matchingThumbnails[0], fit: false }
    }
    return undefined
  }, [contacts, name, theme])
}

/**
 * The thumbnail for the first merchant whose name matches. A merchant backed
 * by a swap provider with a themed logo gets that logo, fitted, so it matches
 * the provider's other transaction thumbnails.
 */
export function getMerchantThumbnail(
  name: string,
  theme: Theme
): PluginIdIcon | undefined {
  const searchName = normalizeForSearch(name)
  const merchant = MERCHANT_CONTACTS.find(
    contact => normalizeForSearch(contact.displayName) === searchName
  )
  if (merchant == null) return
  const { pluginId, thumbnailPath } = merchant
  if (pluginId != null && hasThemedSwapPluginIcon(pluginId)) {
    return { uri: getSwapPluginIconUri(pluginId, theme), fit: true }
  }
  return { uri: thumbnailPath, fit: false }
}
