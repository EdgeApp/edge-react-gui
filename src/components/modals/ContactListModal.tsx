import * as React from 'react'
import { Image } from 'react-native'
import type { AirshipBridge } from 'react-native-airship'
import { sprintf } from 'sprintf-js'

import { Fontello } from '../../assets/vector'
import { getMerchantThumbnail } from '../../hooks/redux/useContactThumbnail'
import { useHandler } from '../../hooks/useHandler'
import { lstrings } from '../../locales/strings'
import { useDispatch, useSelector } from '../../types/reactRedux'
import type { GuiContact } from '../../types/types'
import { normalizeForSearch } from '../../util/utils'
import { ButtonsView } from '../buttons/ButtonsView'
import { EdgeCard } from '../cards/EdgeCard'
import { PersonIcon } from '../icons/ThemedIcons'
import { Airship } from '../services/AirshipInstance'
import { cacheStyles, type Theme, useTheme } from '../services/ThemeContext'
import type { FilledTextInputRef } from '../themed/FilledTextInput'
import { SelectableRow } from '../themed/SelectableRow'
import {
  ContactsPermissionContent,
  ContactsPermissionModal,
  type ContactsPermissionResult,
  markContactsPermissionShown,
  requestContactsAccess
} from './ContactsPermissionModal'
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

export const ContactListModal: React.FC<Props> = ({
  bridge,
  contactType,
  contactName
}) => {
  const theme = useTheme()
  const styles = getStyles(theme)
  const dispatch = useDispatch()

  const textInputRef = React.useRef<FilledTextInputRef>(null)

  const contacts = useSelector(state => state.contacts)
  const contactsPermission = useSelector(state => state.permissions.contacts)
  const contactsPermissionShown = useSelector(
    state => state.ui.settings.contactsPermissionShown
  )
  const hasContactsAccess =
    contactsPermission === 'granted' || contactsPermission === 'limited'

  // The full permission card only appears until the user answers it once.
  // While it shows, the text field stays unfocused so the keyboard does
  // not cover it:
  const [showPermissionCard, setShowPermissionCard] = React.useState(
    !hasContactsAccess && !contactsPermissionShown
  )
  const [autoFocus] = React.useState(!showPermissionCard)

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
    const thumbnail =
      getMerchantThumbnail(label, theme) ??
      (hasThumbnail && thumbnailPath != null
        ? { uri: thumbnailPath, fit: false }
        : undefined)

    return (
      <SelectableRow
        icon={
          thumbnail != null ? (
            <Image
              style={styles.image}
              source={{ uri: thumbnail.uri }}
              resizeMode={thumbnail.fit ? 'contain' : 'cover'}
            />
          ) : (
            <PersonIcon
              color={theme.primaryText}
              size={theme.rem(1.5)}
              style={styles.tileAvatarIcon}
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

  const handleAllow = useHandler(async () => {
    setShowPermissionCard(false)
    await dispatch(requestContactsAccess())
    textInputRef.current?.focus()
  })

  const handleDeny = useHandler(async () => {
    setShowPermissionCard(false)
    textInputRef.current?.focus()
    await dispatch(markContactsPermissionShown())
  })

  const handleGrantAccess = useHandler(async () => {
    // The keyboard would otherwise cover the full-screen modal:
    textInputRef.current?.blur()
    const result = await Airship.show<ContactsPermissionResult | undefined>(
      bridge => <ContactsPermissionModal bridge={bridge} />
    )
    if (result === 'allow') await dispatch(requestContactsAccess())
    textInputRef.current?.focus()
  })

  const listHeader = hasContactsAccess ? undefined : showPermissionCard ? (
    <EdgeCard>
      <ContactsPermissionContent />
      <ButtonsView
        primary={{ label: lstrings.string_allow, onPress: handleAllow }}
        secondary={{ label: lstrings.string_deny, onPress: handleDeny }}
        layout="row"
      />
    </EdgeCard>
  ) : (
    <SelectableRow
      icon={
        <Fontello
          name="address-book"
          color={theme.primaryText}
          size={theme.rem(1.5)}
          style={styles.tileAvatarIcon}
        />
      }
      title={lstrings.contacts_permission_grant_access}
      onPress={handleGrantAccess}
    />
  )

  return (
    <ListModal
      bridge={bridge}
      title={sprintf(
        lstrings.transaction_details_person_input_title_1s,
        contactType
      )}
      label={contactType}
      searchIcon={false}
      onSubmitEditing={handleSubmitEditing}
      initialValue={contactName}
      rowsData={contacts}
      rowComponent={rowComponent}
      rowDataFilter={rowDataFilter}
      listHeader={listHeader}
      textInputRef={textInputRef}
      autoCapitalize="words"
      autoFocus={autoFocus}
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
    marginRight: theme.rem(0.5)
  }
}))
