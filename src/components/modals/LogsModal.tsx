import * as React from 'react'
import { Platform } from 'react-native'
import { AirshipBridge } from 'react-native-airship'
import RNFS from 'react-native-fs'
import Share, { ShareOptions } from 'react-native-share'

import { MultiLogOutput, sendLogs } from '../../actions/LogActions'
import { lstrings } from '../../locales/strings'
import { WarningCard } from '../cards/WarningCard'
import { showToast } from '../services/AirshipInstance'
import { MainButton } from '../themed/MainButton'
import { ModalMessage, ModalTitle } from '../themed/ModalParts'
import { OutlinedTextInput } from '../themed/OutlinedTextInput'
import { ThemedModal } from '../themed/ThemedModal'
interface Props {
  bridge: AirshipBridge<void>
  logs: MultiLogOutput
}

const SENSITIVE_KEY_REGEX = /"(?:allKeys|displayPrivateSeed|displayPublicSeed|otpKey|loginKey|recoveryKey|dataKey|syncKey)\\*"/

export const LogsModal = (props: Props) => {
  const { bridge, logs } = props
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
    <ThemedModal bridge={bridge} onCancel={handleCancel} scroll>
      <ModalTitle>{lstrings.settings_button_export_logs}</ModalTitle>
      {!isDangerous ? null : <WarningCard key="warning" title={lstrings.string_warning} footer={lstrings.settings_modal_send_unsafe} marginRem={0.5} />}
      {isDangerous ? null : <ModalMessage>{lstrings.settings_modal_export_logs_message}</ModalMessage>}
      <OutlinedTextInput
        autoCorrect
        autoFocus={false}
        label={lstrings.settings_modal_send_logs_label}
        marginRem={1}
        maxLength={1000}
        onChangeText={setUserMessage}
        returnKeyType="done"
        value={userMessage}
      />
      {isDangerous ? null : (
        <MainButton label={lstrings.settings_button_send_logs} marginRem={0.5} type="primary" onPress={handleSend} disabled={isDangerous} />
      )}
      <MainButton label={lstrings.settings_button_export_logs} marginRem={0.5} type="secondary" onPress={handleShare} />
    </ThemedModal>
  )
}
