import * as React from 'react'
import { Platform, View, ViewStyle } from 'react-native'
import { AirshipBridge } from 'react-native-airship'
import RNFS from 'react-native-fs'
import Share, { ShareOptions } from 'react-native-share'

import { MultiLogOutput } from '../../actions/LogActions'
import s from '../../locales/strings'
import { sendLogs } from '../../modules/Logs/api'
import { WarningCard } from '../cards/WarningCard'
import { CrossFade } from '../common/CrossFade'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { MainButton } from '../themed/MainButton'
import { ModalCloseArrow, ModalMessage, ModalTitle } from '../themed/ModalParts'
import { OutlinedTextInput } from '../themed/OutlinedTextInput'
import { ThemedModal } from '../themed/ThemedModal'
interface Props {
  bridge: AirshipBridge<void>
  logs: MultiLogOutput
}

const SENSITIVE_KEY_REGEX = /(allKeys|displayPrivateSeed|displayPublicSeed|otpKey|loginKey|recoveryKey|dataKey|syncKey)/g

export const LogsModal = (props: Props) => {
  const { bridge, logs } = props
  const theme = useTheme()
  const styles = getStyles(theme)
  const [userMessage, setUserMessage] = React.useState('')

  const isDangerous = React.useMemo(() => {
    return SENSITIVE_KEY_REGEX.test(logs.activity.data) || SENSITIVE_KEY_REGEX.test(logs.info.data)
  }, [logs])

  const handleShare = async () => {
    logs.info.userMessage = userMessage
    logs.activity.userMessage = userMessage

    const payload = JSON.stringify(logs, null, 2)
    const username = logs.info.loggedInUser?.userName ?? ''
    const dir = Platform.OS === 'android' ? RNFS.ExternalCachesDirectoryPath : RNFS.DocumentDirectoryPath
    const path = `${dir}/edge-log-${username}.json`.replace('-.json', '.json')

    const shareOptions: ShareOptions = {
      title: s.strings.settings_button_export_logs,
      subject: s.strings.settings_button_export_logs,
      message: s.strings.settings_button_export_logs,
      urls: [`file://${path}`],
      type: 'application/json',
      failOnCancel: false
    }

    await RNFS.writeFile(path, payload, 'utf8')
    await Share.open(shareOptions)
    bridge.resolve()
  }

  const handleSend = async () => {
    logs.info.userMessage = userMessage
    logs.activity.userMessage = userMessage

    await Promise.all([
      sendLogs(logs.activity).catch((e: any) => {
        throw new Error(`${s.strings.settings_modal_send_logs_failure} activity logs code ${e?.message}`)
      }),
      sendLogs(logs.info).catch((e: any) => {
        throw new Error(`${s.strings.settings_modal_send_logs_failure} info logs code ${e?.message}`)
      })
    ])
    bridge.resolve()
  }

  const handleCancel = () => {
    bridge.resolve(undefined)
  }
  const minHeight: ViewStyle = { minHeight: isDangerous ? theme.rem(9) : theme.rem(7) }
  return (
    <ThemedModal bridge={bridge} onCancel={handleCancel}>
      <View style={styles.containerStyle}>
        <ModalTitle>{s.strings.settings_button_export_logs}</ModalTitle>
        <View style={minHeight}>
          <CrossFade activeKey={isDangerous ? 'warning' : 'message'}>
            <View key="warning">
              <WarningCard key="warning" title={s.strings.string_warning} footer={s.strings.settings_modal_send_unsafe} marginRem={0.5} />
            </View>
            <View key="message">
              <ModalMessage>{s.strings.settings_modal_export_logs_message + '\n'}</ModalMessage>
            </View>
          </CrossFade>
        </View>
        <OutlinedTextInput
          autoFocus
          autoCorrect
          label={s.strings.settings_modal_send_logs_label}
          returnKeyType="done"
          multiline
          marginRem={[0, 0.5, 1.5, 0.5]}
          onChangeText={setUserMessage}
          value={userMessage}
          maxLength={1000}
        />
        {
          // Hack around the android:windowSoftInputMode="adjustPan" glitch:
          Platform.OS === 'android' ? <View style={{ flex: 2 }} /> : null
        }
      </View>

      <View style={styles.buttonsStyle}>
        <MainButton label={s.strings.settings_button_send_logs} marginRem={0.5} type="primary" onPress={handleSend} disabled={isDangerous} />
        <MainButton label={s.strings.settings_button_export_logs} marginRem={0.5} type="secondary" onPress={handleShare} />
      </View>
      <ModalCloseArrow onPress={handleCancel} />
    </ThemedModal>
  )
}
const getStyles = cacheStyles((theme: Theme) => ({
  containerStyle: {
    flex: 1
  },
  buttonsStyle: {
    justifyContent: 'flex-end'
  },
  messageContainer: {
    justifyContent: 'center'
  }
}))
