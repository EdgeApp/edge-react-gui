import React from 'react'
import { Alert, Text, View } from 'react-native'
import { AirshipBridge } from 'react-native-airship'
import FastImage from 'react-native-fast-image'

import { useHandler } from '../../hooks/useHandler'
import { lstrings } from '../../locales/strings'
import { config } from '../../theme/appConfig'
import { useSelector } from '../../types/reactRedux'
import { getThemedIconUri } from '../../util/CdnUris'
import { openBrowserUri } from '../../util/WebUtils'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'
import { ButtonsModal } from './ButtonsModal'

export type BackupModalResult = 'upgrade' | 'dismiss'

/**
 * Informational modal prompting the user to back up their account for settings,
 * deleting light accounts, and receiving fio requests
 *
 * TODO: Merge our various backup modal flavors with a common design that
 * satisfies all requirements (design TBD).
 */
export const BackupModal = (props: { bridge: AirshipBridge<BackupModalResult | undefined>; forgetLoginId?: string }) => {
  const { bridge, forgetLoginId } = props
  const showForgetAccountVariant = forgetLoginId != null

  const theme = useTheme()
  const styles = getStyles(theme)
  const context = useSelector(state => state.core.context)
  const fioHandles = useSelector(state => state.ui.fioAddress.fioAddresses)
  const backupText = fioHandles.length > 0 ? lstrings.backup_web3_handle_warning_message : lstrings.backup_warning_message

  const handleDeletePress = useHandler(async () => {
    // Warn the user that this is permanent:
    Alert.alert(lstrings.alert_dropdown_warning, lstrings.backup_delete_confirm_message, [
      { text: 'Cancel', onPress: () => {} },
      {
        text: lstrings.delete_account_title,
        onPress: async () => {
          if (forgetLoginId != null) await context.forgetAccount(forgetLoginId)
          return true
        }
      }
    ])

    return true
  })

  return (
    <ButtonsModal
      bridge={bridge}
      buttons={{
        upgrade: { label: lstrings.backup_account },
        dismiss: {
          label: showForgetAccountVariant ? lstrings.delete_account_title : lstrings.backup_dismiss_button,
          onPress: showForgetAccountVariant ? handleDeletePress : undefined,
          spinner: false
        }
      }}
      fullScreen
    >
      <View style={styles.container}>
        <FastImage
          style={styles.image}
          source={{ uri: getThemedIconUri(theme, `lightAccount/${showForgetAccountVariant ? 'hero-backup-warning' : 'hero-backup-info'}`) }}
        />
        <EdgeText style={styles.header} numberOfLines={2}>
          {lstrings.backup_title}
        </EdgeText>
        <EdgeText style={styles.secondaryText} numberOfLines={2}>
          {lstrings.backup_info_message}
        </EdgeText>
        <EdgeText style={styles.warningText} numberOfLines={2}>
          {backupText}
        </EdgeText>
        <Text style={styles.linkText} onPress={() => openBrowserUri(config.backupAccountSite)}>
          {lstrings.tap_to_learn_more}
        </Text>
      </View>
    </ButtonsModal>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  container: {
    alignItems: 'center',
    flexDirection: 'column',
    justifyContent: 'space-between',
    height: '100%'
  },
  image: {
    flex: 0.6,
    width: '100%',
    aspectRatio: 1,
    resizeMode: 'contain'
  },
  header: {
    textAlign: 'center',
    fontSize: theme.rem(1.5)
  },
  secondaryText: {
    textAlign: 'center',
    fontSize: theme.rem(1)
  },
  warningText: {
    textAlign: 'center',
    fontSize: theme.rem(1),
    color: theme.warningIcon
  },
  linkText: {
    color: theme.iconTappable,
    flexShrink: 1,
    fontFamily: theme.fontFaceDefault,
    fontSize: theme.rem(0.84),
    marginBottom: theme.rem(2)
  }
}))
