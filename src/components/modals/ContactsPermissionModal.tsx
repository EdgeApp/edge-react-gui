import * as React from 'react'
import { View } from 'react-native'
import type { AirshipBridge } from 'react-native-airship'
import { check } from 'react-native-permissions'
import { sprintf } from 'sprintf-js'

import { writeContactsPermissionShown } from '../../actions/LocalSettingsActions'
import { Fontello } from '../../assets/vector'
import { lstrings } from '../../locales/strings'
import { permissionNames } from '../../reducers/PermissionsReducer'
import { config } from '../../theme/appConfig'
import type { ThunkAction } from '../../types/reduxTypes'
import { ButtonsModal } from '../modals/ButtonsModal'
import { requestContactsPermission } from '../services/PermissionsManager'
import { cacheStyles, type Theme, useTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'

export type ContactsPermissionResult = 'allow' | 'deny'

interface Props {
  bridge: AirshipBridge<ContactsPermissionResult | undefined>
}

/**
 * Records that the user has answered the contacts permission request,
 * so the payee modal shows the compact access row from then on.
 */
export function markContactsPermissionShown(): ThunkAction<Promise<void>> {
  return async (dispatch, getState) => {
    const { account } = getState().core
    await writeContactsPermissionShown(account, true)
    dispatch({
      type: 'UI/SETTINGS/SET_CONTACTS_PERMISSION_SHOWN',
      data: { contactsPermissionShown: true }
    })
  }
}

/**
 * Asks the OS for contacts access (opening system settings if the
 * permission is blocked), then syncs the result into redux so the
 * contacts loader picks it up.
 */
export function requestContactsAccess(): ThunkAction<Promise<void>> {
  return async dispatch => {
    await dispatch(markContactsPermissionShown())
    await requestContactsPermission(true)
    const contacts = await check(permissionNames.contacts)
    dispatch({ type: 'PERMISSIONS/UPDATE', data: { contacts } })
  }
}

/**
 * Full-screen explanation of why the app wants contacts access,
 * with Allow and Deny buttons.
 */
export const ContactsPermissionModal: React.FC<Props> = props => {
  const { bridge } = props

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
      <ContactsPermissionContent />
    </ButtonsModal>
  )
}

/**
 * The icon, title, and explanation for the contacts permission request.
 * The caller provides the buttons.
 */
export const ContactsPermissionContent: React.FC = () => {
  const theme = useTheme()
  const styles = getStyles(theme)

  const message1 = sprintf(
    lstrings.contacts_permission_modal_body_1,
    config.appName
  )
  const message2 = sprintf(
    lstrings.contacts_permission_modal_body_2,
    config.appName
  )
  const message3 = sprintf(
    lstrings.contacts_permission_modal_body_3,
    config.appName
  )

  return (
    <>
      <View style={styles.headerContainer}>
        <View style={styles.iconCircle}>
          <Fontello
            name="address-book"
            size={theme.rem(1.5)}
            color={theme.icon}
          />
        </View>
        <EdgeText style={styles.header}>
          {lstrings.contacts_permission_modal_title}
        </EdgeText>
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
    </>
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
