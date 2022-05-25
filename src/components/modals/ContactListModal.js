// @flow
import { useCavy, wrap } from 'cavy'
import * as React from 'react'
import { Image } from 'react-native'
import { type AirshipBridge } from 'react-native-airship'
import IonIcon from 'react-native-vector-icons/Ionicons'
import { sprintf } from 'sprintf-js'

import s from '../../locales/strings.js'
import { type GuiContact } from '../../types/types.js'
import { normalizeForSearch } from '../../util/utils.js'
import { type Theme, cacheStyles, useTheme } from '../services/ThemeContext.js'
import { SelectableRow } from '../themed/SelectableRow'
import { ListModal } from './ListModal.js'

type Props = {
  bridge: AirshipBridge<{ contactName: string, thumbnailPath?: string | null } | void>,
  contactType: string,
  contactName: string,
  contacts: GuiContact[]
}

export function TestableContactListModal({ bridge, contactType, contacts, contactName }: Props) {
  const theme = useTheme()
  const styles = getStyles(theme)
  const generateTestHook = useCavy()

  const rowComponent = ({ givenName, familyName, hasThumbnail, thumbnailPath }: GuiContact) => {
    const fullName = familyName ? `${givenName} ${familyName}` : givenName
    return (
      <SelectableRow
        icon={
          hasThumbnail && thumbnailPath != null ? (
            <Image style={styles.image} source={{ uri: thumbnailPath }} />
          ) : (
            <IonIcon style={styles.tileAvatarIcon} name="person" size={theme.rem(1.5)} />
          )
        }
        paddingRem={[0, 1]}
        title={fullName}
        onPress={() => bridge.resolve({ contactName: fullName, thumbnailPath })}
      />
    )
  }

  const rowDataFilter = (searchText, contact) => {
    const formattedSearchText = normalizeForSearch(searchText)
    const { givenName, familyName } = contact
    const fullName = normalizeForSearch(`${givenName ?? ''}${familyName ?? ''} `)
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
      ref={generateTestHook('ContactListModal.Close')}
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
export const ContactListModal = wrap(TestableContactListModal)
