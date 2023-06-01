import React from 'react'
import { Text, View } from 'react-native'
import { AirshipBridge } from 'react-native-airship'
import FastImage from 'react-native-fast-image'

import { lstrings } from '../../locales/strings'
import { config } from '../../theme/appConfig'
import { getLightAccountIconUri } from '../../util/CdnUris'
import { openBrowserUri } from '../../util/WebUtils'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'
import { ButtonsModal } from './ButtonsModal'

export type BackupModalResult = 'upgrade' | 'dismiss'

/**
 * Informational modal when the user receives funds or taps the persistent
 * floating backup notification card.
 */
export const BackupModal = (props: { bridge: AirshipBridge<BackupModalResult | undefined>; delete?: boolean }) => {
  const theme = useTheme()
  const styles = getStyles(theme)
  const { bridge, delete: isDelete } = props

  return (
    <ButtonsModal
      bridge={bridge}
      buttons={{
        upgrade: { label: lstrings.backup_modal_confirm_button },
        dismiss: { label: isDelete ? lstrings.backup_modal_delete_button : lstrings.backup_modal_cancel_button }
      }}
      fullScreen
    >
      <View style={styles.container}>
        <FastImage style={styles.image} source={{ uri: getLightAccountIconUri(theme, isDelete ? 'hero-backup-warning' : 'hero-backup-info') }} />
        <EdgeText style={styles.header} numberOfLines={2}>
          {lstrings.backup_title}
        </EdgeText>
        <EdgeText style={styles.secondaryText} numberOfLines={2}>
          {lstrings.backup_info_modal_message}
        </EdgeText>
        <EdgeText style={styles.warningText} numberOfLines={2}>
          {lstrings.backup_warning_message}
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
    marginTop: theme.rem(2),
    flex: 1
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
