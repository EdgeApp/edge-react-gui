import * as React from 'react'
import { Platform, View } from 'react-native'
import { AirshipBridge } from 'react-native-airship'

import { lstrings } from '../../locales/strings'
import { showError } from '../services/AirshipInstance'
import { Alert } from '../themed/Alert'
import { FilledTextInput } from '../themed/FilledTextInput'
import { MainButton } from '../themed/MainButton'
import { ModalMessage } from '../themed/ModalParts'
import { ModalUi4 } from '../ui4/ModalUi4'

interface Props {
  // Resolves to the entered string, or void if cancelled.
  bridge: AirshipBridge<string | undefined>

  // The modal will show a spinner as long as this promise is pending.
  // Returning true will dismiss the modal, but returning false or a string
  // will leave the modal up. The string will be shown as an error message.
  onSubmit?: (text: string) => Promise<boolean | string>

  // Text to show in the modal:
  title?: string
  message?: string | React.ReactNode
  initialValue?: string
  inputLabel?: string
  submitLabel?: string
  warningMessage?: string

  // Adds a border:
  warning?: boolean

  // Text input options:
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters'
  autoFocus?: boolean
  autoCorrect?: boolean
  keyboardType?: 'default' | 'number-pad' | 'decimal-pad' | 'numeric' | 'email-address' | 'phone-pad'
  multiline?: boolean
  maxLength?: number
  returnKeyType?: 'done' | 'go' | 'next' | 'search' | 'send'
  secureTextEntry?: boolean
}

export function TextInputModal(props: Props) {
  const {
    autoCapitalize,
    autoFocus = true,
    autoCorrect,
    bridge,
    initialValue = '',
    inputLabel,
    keyboardType,
    message,
    onSubmit,
    returnKeyType,
    secureTextEntry,
    multiline = false,
    submitLabel = lstrings.submit,
    title,
    maxLength,
    warning,
    warningMessage
  } = props

  const [errorMessage, setErrorMessage] = React.useState<string | undefined>()
  const [spinning, setSpinning] = React.useState(false)
  const [text, setText] = React.useState(initialValue)

  const handleChangeText = (text: string) => {
    setText(text)
    setErrorMessage(undefined)
  }

  const handleSubmit = () => {
    if (onSubmit == null) return bridge.resolve(text)
    setSpinning(true)
    onSubmit(text).then(
      result => {
        setSpinning(false)
        if (typeof result === 'string') {
          setErrorMessage(result)
        } else if (result) {
          bridge.resolve(text)
        }
      },
      error => {
        setSpinning(false)
        showError(error)
      }
    )
  }

  return (
    <ModalUi4 warning={warning} bridge={bridge} title={title} onCancel={() => bridge.resolve(undefined)}>
      {typeof message === 'string' ? <ModalMessage>{message}</ModalMessage> : <>{message}</>}
      {warningMessage != null ? <Alert type="warning" title={lstrings.string_warning} marginRem={0.5} message={warningMessage} numberOfLines={0} /> : null}
      <FilledTextInput
        top={1}
        horizontal={0.5}
        bottom={1.5}
        expand
        // Text input props:
        autoCapitalize={autoCapitalize}
        autoFocus={autoFocus}
        autoCorrect={autoCorrect}
        keyboardType={keyboardType}
        placeholder={inputLabel}
        returnKeyType={returnKeyType}
        secureTextEntry={secureTextEntry}
        multiline={multiline}
        // Our props:
        error={errorMessage}
        onChangeText={handleChangeText}
        onSubmitEditing={handleSubmit}
        value={text}
        maxLength={maxLength}
      />
      {
        // Hack around the android:windowSoftInputMode="adjustPan" glitch:
        Platform.OS === 'android' ? <View style={{ flex: 2 }} /> : null
      }
      {/* TODO: Style ButtonsViewUi4 for Modals */}
      {spinning ? (
        <MainButton alignSelf="center" disabled marginRem={0.5} type="primary" spinner />
      ) : (
        <MainButton alignSelf="center" label={submitLabel} marginRem={0.5} onPress={handleSubmit} type="primary" />
      )}
    </ModalUi4>
  )
}
