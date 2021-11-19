// @flow

import * as React from 'react'
import { Image } from 'react-native'
import { type AirshipBridge } from 'react-native-airship'
import IonIcon from 'react-native-vector-icons/Ionicons'
import { sprintf } from 'sprintf-js'

import s from '../../locales/strings.js'
import { type GuiContact } from '../../types/types.js'
import { type Theme, cacheStyles, useTheme } from '../services/ThemeContext.js'
import { SelectableRow } from '../themed/SelectableRow'
import { ListModal } from './ListModal.js'

type Props = {
  bridge: AirshipBridge<{ contactName: string, thumbnailPath?: string | null } | void>,
  contactType: string,
  contactName: string,
  contacts: GuiContact[]
}

export function ContactListModal({ bridge, contactType, contacts, contactName }: Props) {
  const theme = useTheme()
  const styles = getStyles(theme)

  const rowComponent = ({ givenName, familyName, hasThumbnail, thumbnailPath }: GuiContact) => {
    const fullName = familyName ? `${givenName} ${familyName}` : givenName
    return (
      <SelectableRow
        onPress={() => bridge.resolve({ contactName: fullName, thumbnailPath })}
        icon={
          hasThumbnail && thumbnailPath != null ? (
            <Image style={styles.image} source={{ uri: thumbnailPath }} />
          ) : (
            <IonIcon style={styles.tileAvatarIcon} name="person" size={theme.rem(1.5)} />
          )
        }
        title={fullName}
      />
    )
  }

  const rowDataFilter = (searchText, contact) => {
    const formattedSearchText = searchText.toLowerCase().replace(/\s+/g, '') // Remove all whitepsaces
    const { givenName, familyName } = contact
    const givenNameLowerCase = givenName ? givenName.toLowerCase().replace(/\s+/g, '') : ''
    const familyNameLowerCase = familyName ? familyName.toLowerCase().replace(/\s+/g, '') : ''
    const fullName = givenNameLowerCase + familyNameLowerCase
    return fullName.includes(formattedSearchText)
  }

  const handleSubmitEditing = contactName => bridge.resolve({ contactName, thumbnailPath: null })

  return (
    <ListModal
      bridge={bridge}
      title={sprintf(s.strings.transaction_details_person_input, contactType)}
      label={contactType}
      searchIcon={false}
      onSubmitEditing={handleSubmitEditing}
      initialValue={contactName}
      rowsData={contacts}
      rowComponent={rowComponent}
      rowDataFilter={rowDataFilter}
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
