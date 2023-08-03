import * as React from 'react'
import { Image } from 'react-native'
import { AirshipBridge } from 'react-native-airship'
import IonIcon from 'react-native-vector-icons/Ionicons'
import { sprintf } from 'sprintf-js'

import { maybeShowContactsPermissionModal } from '../../hooks/redux/useContactThumbnail'
import { lstrings } from '../../locales/strings'
import { useDispatch, useSelector } from '../../types/reactRedux'
import { GuiContact } from '../../types/types'
import { normalizeForSearch } from '../../util/utils'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { SelectableRow } from '../themed/SelectableRow'
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
  const dispatch = useDispatch()
  const contactsPermissionOn = useSelector(state => state.ui.settings.contactsPermissionOn)

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

  const rowDataFilter = (searchText: string, contact: GuiContact) => {
    const formattedSearchText = normalizeForSearch(searchText)
    const { givenName, familyName } = contact
    const fullName = normalizeForSearch(`${givenName ?? ''}${familyName ?? ''} `)
    return fullName.includes(formattedSearchText)
  }

  const handleSubmitEditing = (contactName: string) => bridge.resolve({ contactName, thumbnailPath: null })

  React.useEffect(() => {
    maybeShowContactsPermissionModal(dispatch, contactsPermissionOn)

    // Avoid popping up the modal when component is mounted and the user changes
    // contactsPermissionOn.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch])

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
