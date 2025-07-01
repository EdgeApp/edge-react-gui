import * as React from 'react'
import { Image } from 'react-native'
import { AirshipBridge } from 'react-native-airship'
import { check } from 'react-native-permissions'
import IonIcon from 'react-native-vector-icons/Ionicons'
import { sprintf } from 'sprintf-js'

import { useAsyncEffect } from '../../hooks/useAsyncEffect'
import { lstrings } from '../../locales/strings'
import { permissionNames } from '../../reducers/PermissionsReducer'
import { useSelector } from '../../types/reactRedux'
import { GuiContact } from '../../types/types'
import { normalizeForSearch } from '../../util/utils'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { SelectableRow } from '../themed/SelectableRow'
import { ContactPermissionsSection } from './ContactPermissionsSection'
import { EdgeModal } from './EdgeModal'
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

export function ContactListModal({ bridge, contactType, contactName }: Props) {
  const theme = useTheme()
  const styles = getStyles(theme)
  const contacts = useSelector(state => state.contacts)
  const [hasContactsPermission, setHasContactsPermission] = React.useState<boolean | null>(null)

  const rowComponent = ({
    givenName,
    familyName,
    hasThumbnail,
    thumbnailPath
  }: GuiContact) => {
    const fullName = familyName ? `${givenName} ${familyName}` : givenName
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
        title={fullName}
        onPress={() => bridge.resolve({ contactName: fullName, thumbnailPath })}
      />
    )
  }

  const rowDataFilter = (searchText: string, contact: GuiContact) => {
    const formattedSearchText = normalizeForSearch(searchText)
    const { givenName, familyName } = contact
    const fullName = normalizeForSearch(
      `${givenName ?? ''}${familyName ?? ''} `
    )
    return fullName.includes(formattedSearchText)
  }

  const handleSubmitEditing = (contactName: string) =>
    bridge.resolve({ contactName, thumbnailPath: null })

  const checkPermissions = async () => {
    const permission = await check(permissionNames.contacts).catch(() => 'denied')
    setHasContactsPermission(permission === 'granted')
  }

  const handlePermissionGranted = () => {
    setHasContactsPermission(true)
  }

  const handleCancel = () => bridge.resolve(undefined)

  useAsyncEffect(
    async () => {
      await checkPermissions()
    },
    [],
    'ContactListModal'
  )

  // If we don't have permissions, show the embedded permissions section
  if (hasContactsPermission === false) {
    return (
      <EdgeModal 
        title={sprintf(lstrings.transaction_details_person_input, contactType)}
        bridge={bridge} 
        onCancel={handleCancel}
      >
        <ContactPermissionsSection onPermissionGranted={handlePermissionGranted} />
      </EdgeModal>
    )
  }

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
