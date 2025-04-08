import * as React from 'react'
import { Keyboard, Platform } from 'react-native'
import { AirshipBridge } from 'react-native-airship'
import RNFS from 'react-native-fs'
import Share, { ShareOptions } from 'react-native-share'
import { sprintf } from 'sprintf-js'

import { MultiLogOutput, sendLogs } from '../../actions/LogActions'
import { lstrings } from '../../locales/strings'
import { config } from '../../theme/appConfig'
import { ModalButtons } from '../buttons/ModalButtons'
import { AlertCardUi4 } from '../cards/AlertCard'
import { WarningCard } from '../cards/WarningCard'
import { showToast } from '../services/AirshipInstance'
import { Paragraph } from '../themed/EdgeText'
import { ModalFilledTextInput } from '../themed/FilledTextInput'
import { EdgeModal } from './EdgeModal'
interface Props {
  bridge: AirshipBridge<void>
  logs: MultiLogOutput
}

const SENSITIVE_KEY_REGEX = /"(?:allKeys|displayPrivateSeed|displayPublicSeed|otpKey|loginKey|recoveryKey|dataKey|syncKey)\\*"/

export const LogsModal = (props: Props) => {
  const { bridge, logs } = props
  const [userMessage, setUserMessage] = React.useState('')
  const [isKeyboardVisible, setKeyboardVisible] = React.useState(false)

  React.useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
      setKeyboardVisible(true)
    })
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardVisible(false)
    })

    return () => {
      keyboardDidShowListener.remove()
      keyboardDidHideListener.remove()
    }
  }, [])

  const isDangerous = React.useMemo(() => {
    return SENSITIVE_KEY_REGEX.test(logs.activity.data) || SENSITIVE_KEY_REGEX.test(logs.info.data)
  }, [logs])

  const handleSave = async () => {
    logs.info.userMessage = userMessage
    logs.activity.userMessage = userMessage

    const payload = JSON.stringify(logs, null, 2)
    const username = logs.info.loggedInUser?.userName ?? ''
    const dir = Platform.OS === 'android' ? RNFS.ExternalCachesDirectoryPath : RNFS.DocumentDirectoryPath
    const path = `${dir}/edge-log-${username}.json`.replace('-.json', '.json')

    const shareOptions: ShareOptions = {
      title: lstrings.settings_button_export_logs,
      subject: lstrings.settings_button_export_logs,
      message: lstrings.settings_button_export_logs,
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
        throw new Error(`${lstrings.settings_modal_send_logs_failure} activity logs code ${e?.message}`)
      }),
      sendLogs(logs.info).catch((e: any) => {
        throw new Error(`${lstrings.settings_modal_send_logs_failure} info logs code ${e?.message}`)
      })
    ])
    showToast(lstrings.settings_modal_send_logs_success)
    bridge.resolve()
  }

  const handleCancel = () => {
    bridge.resolve(undefined)
  }

  return (
    <EdgeModal bridge={bridge} onCancel={handleCancel} title={lstrings.settings_button_export_logs} scroll>
      {isDangerous ? (
        <WarningCard key="warning" title={lstrings.string_warning} footer={lstrings.settings_modal_send_unsafe} marginRem={0.5} />
      ) : isKeyboardVisible ? null : (
        <Paragraph>{lstrings.settings_modal_export_logs_directions}</Paragraph>
      )}
      <AlertCardUi4 title={lstrings.settings_modal_export_logs_warning} type="warning" />
      <ModalFilledTextInput
        autoCorrect
        autoFocus={false}
        placeholder={lstrings.settings_modal_send_logs_label}
        maxLength={1000}
        onChangeText={setUserMessage}
        returnKeyType="done"
        value={userMessage}
      />
      <ModalButtons
        primary={{ label: sprintf(lstrings.send_to_1s, config.appName), onPress: handleSend, disabled: isDangerous }}
        secondary={{ label: lstrings.save, onPress: handleSave }}
      />
    </EdgeModal>
  )
}
