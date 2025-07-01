import * as React from 'react'
import { View } from 'react-native'
import { openSettings } from 'react-native-permissions'
import { sprintf } from 'sprintf-js'

import { Fontello } from '../../assets/vector'
import { lstrings } from '../../locales/strings'
import { config } from '../../theme/appConfig'
import { requestContactsPermission } from '../services/PermissionsManager'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'
import { MainButton } from '../themed/MainButton'

interface Props {
  onPermissionGranted?: () => void
}

export function ContactPermissionsSection({ onPermissionGranted }: Props) {
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

  const handleAllowPermissions = async () => {
    const granted = await requestContactsPermission(true)
    if (granted && onPermissionGranted) {
      onPermissionGranted()
    }
  }

  const handleOpenSettings = () => {
    openSettings()
  }

  return (
    <View style={styles.container}>
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

      <View style={styles.buttonContainer}>
        <MainButton
          label={lstrings.string_allow}
          marginRem={[0.5, 0, 0.5, 0]}
          type="primary"
          onPress={handleAllowPermissions}
        />
        <MainButton
          label={lstrings.string_settings}
          marginRem={[0.5, 0]}
          type="secondary"
          onPress={handleOpenSettings}
        />
      </View>
    </View>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  container: {
    padding: theme.rem(1)
  },
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
  },
  buttonContainer: {
    marginTop: theme.rem(1)
  }
}))