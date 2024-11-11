import React from 'react'
import { View } from 'react-native'
import { AirshipBridge } from 'react-native-airship'
import FastImage from 'react-native-fast-image'
import { sprintf } from 'sprintf-js'

import backupHero from '../../assets/images/backup-hero.png'
import { useHandler } from '../../hooks/useHandler'
import { lstrings } from '../../locales/strings'
import { config } from '../../theme/appConfig'
import { useSelector } from '../../types/reactRedux'
import { openBrowserUri } from '../../util/WebUtils'
import { Airship } from '../services/AirshipInstance'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { HeaderText, Paragraph, SmallText, WarningText } from '../themed/EdgeText'
import { ButtonsModal } from './ButtonsModal'

export type BackupModalResult = 'upgrade' | 'learnMore' | 'dismiss'
export type BackupForTransferModalResult = 'upgrade' | 'learnMore'

/** Common backup modal content format */
const BackupModalContent = (props: { title: string; body: string; bodyCont?: string; subText?: string }) => {
  const { title, body, bodyCont, subText } = props
  const theme = useTheme()
  const styles = getStyles(theme)

  return (
    <View style={styles.container}>
      <FastImage style={styles.image} source={backupHero} />
      <Paragraph center>
        <HeaderText>{title}</HeaderText>
      </Paragraph>
      <Paragraph center>{body}</Paragraph>
      {bodyCont == null ? null : <Paragraph center>{bodyCont}</Paragraph>}
      {subText == null ? null : (
        <Paragraph center>
          <WarningText>
            <SmallText>{subText}</SmallText>
          </WarningText>
        </Paragraph>
      )}
    </View>
  )
}

/**
 * Informational modal prompting the user to back up their account
 */
export const BackupForTransferModal = (props: { bridge: AirshipBridge<BackupForTransferModalResult | undefined> }) => {
  const { bridge } = props

  const handleLearnMorePress = useHandler(async () => {
    openBrowserUri(config.backupAccountSite)
    return false
  })

  return (
    <ButtonsModal
      bridge={bridge}
      buttons={{
        upgrade: { label: lstrings.get_started_button },
        learnMore: {
          label: lstrings.learn_more,
          onPress: handleLearnMorePress,
          spinner: false
        }
      }}
    >
      <BackupModalContent
        title={lstrings.backup_title}
        body={lstrings.backup_message}
        bodyCont={sprintf(lstrings.no_access_disclaimer_1s, config.appName)}
        subText={lstrings.backup_message_subtext}
      />
    </ButtonsModal>
  )
}

/**
 * Informational modal prompting the user to back up their account before accessing settings,
 * deleting light accounts, and receiving fio requests
 */
export const BackupForAccountModal = (props: { bridge: AirshipBridge<BackupModalResult | undefined>; forgetLoginId?: string }) => {
  const { bridge, forgetLoginId } = props
  const showForgetAccount = forgetLoginId != null

  const context = useSelector(state => state.core.context)
  const fioHandles = useSelector(state => state.ui.fioAddress.fioAddresses)
  const backupText = fioHandles.length > 0 ? lstrings.backup_web3_handle_warning_message : lstrings.backup_warning_message

  const handleDeletePress = useHandler(async () => {
    // Warn the user that this is permanent:
    Airship.show<'cancel' | 'delete' | undefined>(bridge => (
      <ButtonsModal
        bridge={bridge}
        title={lstrings.alert_dropdown_warning}
        message={lstrings.backup_delete_confirm_message}
        buttons={{
          cancel: { label: lstrings.string_cancel },
          delete: {
            label: lstrings.delete_account_title,
            onPress: async () => {
              if (forgetLoginId != null) await context.forgetAccount(forgetLoginId)
              return true
            }
          }
        }}
      />
    )).catch(() => {})
    return true
  })

  return (
    <ButtonsModal
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
          label: showForgetAccount ? lstrings.delete_account_title : lstrings.backup_dismiss_button,
          onPress: showForgetAccount ? handleDeletePress : undefined,
          spinner: false
        }
      }}
    >
      <BackupModalContent title={lstrings.backup_title} body={lstrings.backup_info_message} subText={backupText} />
    </ButtonsModal>
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
