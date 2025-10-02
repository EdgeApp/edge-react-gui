import * as React from 'react'
import { Image } from 'react-native'
import type { AirshipBridge } from 'react-native-airship'
import IonIcon from 'react-native-vector-icons/Ionicons'
import { sprintf } from 'sprintf-js'

import { useAsyncEffect } from '../../hooks/useAsyncEffect'
import { lstrings } from '../../locales/strings'
import { useDispatch, useSelector } from '../../types/reactRedux'
import type { GuiContact } from '../../types/types'
import { normalizeForSearch } from '../../util/utils'
import { requestContactsPermission } from '../services/PermissionsManager'
import { cacheStyles, type Theme, useTheme } from '../services/ThemeContext'
import { SelectableRow } from '../themed/SelectableRow'
import { maybeShowContactsPermissionModal } from './ContactsPermissionModal'
import { ListModal } from './ListModal'

export interface ContactModalResult {
  contactName: string
  thumbnailPath?: string | null
}

interface Props {
  bridge: AirshipBridge<ContactModalResult | undefined>
  contactType: string
  contactName: string
}

export function ContactListModal({
  bridge,
  contactType,
  contactName
}: Props): React.ReactElement {
  const theme = useTheme()
  const styles = getStyles(theme)
  const contacts = useSelector(state => state.contacts)
  const dispatch = useDispatch()

  const rowComponent = ({
    givenName,
    familyName,
    hasThumbnail,
    thumbnailPath,
    company,
    displayName
  }: GuiContact): React.ReactElement => {
    // Build display label with precedence: displayName -> given+family -> company
    const nameParts = [givenName, familyName].filter(s => s != null && s !== '')
    const fullName = nameParts.length > 0 ? nameParts.join(' ') : null
    const primaryLabel =
      (displayName != null && displayName !== '' ? displayName : null) ??
      fullName ??
      (company != null && company !== '' ? company : '')

    const label = primaryLabel ?? ''

    return (
      <SelectableRow
        icon={
          hasThumbnail && thumbnailPath != null ? (
            <Image style={styles.image} source={{ uri: thumbnailPath }} />
          ) : (
            <IonIcon
              style={styles.tileAvatarIcon}
              name="person"
              size={theme.rem(1.5)}
            />
          )
        }
        title={label}
        onPress={() => {
          bridge.resolve({ contactName: label, thumbnailPath })
        }}
      />
    )
  }

  const rowDataFilter = (searchText: string, contact: GuiContact): boolean => {
    const target = normalizeForSearch(searchText)
    const { givenName, familyName, company, displayName } = contact
    const nameParts = [givenName, familyName].filter(s => s != null && s !== '')
    const fullName = nameParts.length > 0 ? nameParts.join(' ') : null
    const candidates = [displayName, fullName, company].filter(
      (s): s is string => s != null && s !== ''
    )

    for (const value of candidates) {
      if (normalizeForSearch(value).includes(target)) return true
    }
    return false
  }

  const handleSubmitEditing = (contactName: string): void => {
    bridge.resolve({ contactName, thumbnailPath: null })
  }

  useAsyncEffect(
    async () => {
      const result = await dispatch(maybeShowContactsPermissionModal())
      if (result === 'allow') {
        await requestContactsPermission(true)
      }
    },
    [],
    'ContactListModal'
  )

  return (
    <ListModal
      bridge={bridge}
      title={sprintf(lstrings.transaction_details_person_input, contactType)}
      label={contactType}
      searchIcon={false}
      onSubmitEditing={handleSubmitEditing}
      initialValue={contactName}
      rowsData={contacts}
      rowComponent={rowComponent}
      rowDataFilter={rowDataFilter}
      autoFocus
      autoSelect
    />
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  image: {
    height: theme.rem(2),
    width: theme.rem(2)
  },
  tileAvatarIcon: {
    color: theme.primaryText,
    marginRight: theme.rem(0.5)
  }
}))
