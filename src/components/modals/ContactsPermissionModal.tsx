import * as React from 'react'
import { View } from 'react-native'
import { AirshipBridge } from 'react-native-airship'
import { check } from 'react-native-permissions'
import { sprintf } from 'sprintf-js'

import { writeContactsPermissionShown } from '../../actions/LocalSettingsActions'
import { Fontello } from '../../assets/vector'
import { lstrings } from '../../locales/strings'
import { permissionNames } from '../../reducers/PermissionsReducer'
import { config } from '../../theme/appConfig'
import { ThunkAction } from '../../types/reduxTypes'
import { ButtonsModal } from '../modals/ButtonsModal'
import { Airship } from '../services/AirshipInstance'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'

export type ContactsPermissionResult = 'allow' | 'deny'

interface Props {
  bridge: AirshipBridge<ContactsPermissionResult | undefined>
}

let isModalShowing = false

/**
 * Shows one instance of this modal asking if the user wants to grant contacts
 * permissions, if the system contacts permission isn't granted.
 *
 * @returns Result of Contacts Access modal or undefined if no modal shown or
 * the modal was dismissed somehow.
 */
export function maybeShowContactsPermissionModal(): ThunkAction<Promise<ContactsPermissionResult | undefined>> {
  return async (dispatch, getState) => {
    const state = getState()
    const { account } = state.core

    // Bail if we are currently showing the modal:
    if (isModalShowing) return
    isModalShowing = true

    // Bail if we have ever show the modal:
    const { contactsPermissionShown } = state.ui.settings
    if (contactsPermissionShown) return

    // Bail if we already have permission:
    const contactsPermissionOn = (await check(permissionNames.contacts).catch(_error => 'denied')) === 'granted'
    if (contactsPermissionOn) return

    // Show the modal:
    const result = await Airship.show<ContactsPermissionResult | undefined>(bridge => <ContactsPermissionModal bridge={bridge} />)
    await writeContactsPermissionShown(account, true)

    return result
  }
}

/**
 * Shows the modal if it hasn't been shown before, and attempts to set the
 * system contacts permission setting
 */
function ContactsPermissionModal(props: Props) {
  const { bridge } = props
  const theme = useTheme()
  const styles = getStyles(theme)

  const message1 = sprintf(lstrings.contacts_permission_modal_body_1, config.appName)
  const message2 = sprintf(lstrings.contacts_permission_modal_body_2, config.appName)
  const message3 = sprintf(lstrings.contacts_permission_modal_body_3, config.appName)

  return (
    <ButtonsModal
      bridge={bridge}
      disableCancel
      buttons={{
        allow: { label: lstrings.string_allow },
        deny: { label: lstrings.string_deny }
      }}
      fullScreen
    >
      <View style={styles.headerContainer}>
        <View style={styles.iconCircle}>
          <Fontello name="address-book" size={theme.rem(1.5)} color={theme.icon} />
        </View>
        <EdgeText style={styles.header}>{lstrings.contacts_permission_modal_title}</EdgeText>
      </View>
      <EdgeText numberOfLines={0} style={styles.message}>
        {message1}
      </EdgeText>
      <EdgeText numberOfLines={0} style={styles.message}>
        {message2}
      </EdgeText>
      <EdgeText numberOfLines={0} style={styles.message}>
        {message3}
      </EdgeText>
    </ButtonsModal>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  headerContainer: {
    marginTop: theme.rem(1),
    justifyContent: 'center',
    alignItems: 'center'
  },
  iconCircle: {
    width: theme.rem(2.5),
    height: theme.rem(2.5),
    borderWidth: theme.thinLineWidth,
    borderRadius: theme.rem(1.25),
    borderColor: theme.icon,
    justifyContent: 'center',
    alignItems: 'center'
  },
  header: {
    marginVertical: theme.rem(1),
    fontFamily: theme.fontFaceMedium,
    fontSize: theme.rem(1.25),
    includeFontPadding: false
  },
  message: {
    marginBottom: theme.rem(1)
  }
}))
