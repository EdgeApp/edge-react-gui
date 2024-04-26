import React from 'react'
import { Alert, View } from 'react-native'
import { AirshipBridge } from 'react-native-airship'
import FastImage from 'react-native-fast-image'

import backupHero from '../../assets/images/backup-hero.png'
import { useHandler } from '../../hooks/useHandler'
import { lstrings } from '../../locales/strings'
import { config } from '../../theme/appConfig'
import { useSelector } from '../../types/reactRedux'
import { openBrowserUri } from '../../util/WebUtils'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { HeaderText, Paragraph, SmallText, WarningText } from '../themed/EdgeText'
import { ButtonsModal2 } from './ButtonsModal'

export type BackupModalResult = 'upgrade' | 'learnMore' | 'dismiss'

/**
 * Informational modal prompting the user to back up their account before accessing settings,
 * deleting light accounts, and receiving fio requests
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
    <ButtonsModal2
      bridge={bridge}
      buttons={{
        upgrade: { label: lstrings.backup_account },
        learnMore: {
          label: lstrings.learn_more,
          onPress: async () => {
            openBrowserUri(config.backupAccountSite)
            return await Promise.resolve(true)
          }
        },
        dismiss: {
          label: showForgetAccountVariant ? lstrings.delete_account_title : lstrings.backup_dismiss_button,
          onPress: showForgetAccountVariant ? handleDeletePress : undefined,
          spinner: false
        }
      }}
    >
      <View style={styles.container}>
        <FastImage style={styles.image} source={backupHero} />
        <Paragraph center>
          <HeaderText>{lstrings.backup_title}</HeaderText>
        </Paragraph>
        <Paragraph center>{lstrings.backup_info_message}</Paragraph>
        <Paragraph center>
          <SmallText>
            <WarningText>{backupText}</WarningText>
          </SmallText>
        </Paragraph>
      </View>
    </ButtonsModal2>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  container: {
    alignItems: 'center'
  },
  image: {
    width: '60%',
    aspectRatio: 1,
    resizeMode: 'contain',
    marginBottom: theme.rem(0.5)
  }
}))
