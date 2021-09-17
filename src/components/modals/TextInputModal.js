// @flow

import * as React from 'react'
import { Platform, View } from 'react-native'
import { type AirshipBridge } from 'react-native-airship'

import s from '../../locales/strings.js'
import { useState } from '../../types/reactHooks.js'
import { showError } from '../services/AirshipInstance.js'
import { MainButton } from '../themed/MainButton.js'
import { ModalCloseArrow, ModalMessage, ModalTitle } from '../themed/ModalParts.js'
import { OutlinedTextInput } from '../themed/OutlinedTextInput.js'
import { ThemedModal } from '../themed/ThemedModal.js'

type Props = {|
  // Resolves to the entered string, or void if cancelled.
  bridge: AirshipBridge<string | void>,

  // The modal will show a spinner as long as this promise is pending.
  // Returning true will dismiss the modal, but returning false or a string
  // will leave the modal up. The string will be shown as an error message.
  onSubmit?: (text: string) => Promise<boolean | string>,

  // Text to show in the modal:
  title?: string,
  message?: string,
  initialValue?: string,
  inputLabel?: string,
  submitLabel?: string,

  // Text input options:
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters',
  autoCorrect?: boolean,
  keyboardType?: 'default' | 'number-pad' | 'decimal-pad' | 'numeric' | 'email-address' | 'phone-pad',
  returnKeyType?: 'done' | 'go' | 'next' | 'search' | 'send',
  secureTextEntry?: boolean
|}

export function TextInputModal(props: Props) {
  const {
    autoCapitalize,
    autoCorrect,
    bridge,
    initialValue = '',
    inputLabel,
    keyboardType,
    message,
    onSubmit,
    returnKeyType,
    secureTextEntry,
    submitLabel = s.strings.submit,
    title
  } = props

  const [errorMessage, setErrorMessage] = useState<string | void>()
  const [spinning, setSpinning] = useState(false)
  const [text, setText] = useState(initialValue)

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
    <ThemedModal bridge={bridge} onCancel={() => bridge.resolve(undefined)}>
      {title != null ? <ModalTitle>{title}</ModalTitle> : null}
      {message != null ? <ModalMessage>{message}</ModalMessage> : null}
      <OutlinedTextInput
        // Text input props:
        autoCapitalize={autoCapitalize}
        autoCorrect={autoCorrect}
        keyboardType={keyboardType}
        label={inputLabel}
        returnKeyType={returnKeyType}
        secureTextEntry={secureTextEntry}
        multiline
        // Our props:
        autoFocus
        error={errorMessage}
        clearIcon
        marginRem={[1, 0.5]}
        onChangeText={handleChangeText}
        onSubmitEditing={handleSubmit}
        value={text}
      />
      {
        // Hack around the android:windowSoftInputMode="adjustPan" glitch:
        Platform.OS === 'android' ? <View style={{ flex: 1 }} /> : null
      }
      {spinning ? (
        <MainButton alignSelf="center" disabled marginRem={0.5} spinner />
      ) : (
        <MainButton alignSelf="center" label={submitLabel} marginRem={0.5} onPress={handleSubmit} />
      )}
      <ModalCloseArrow onPress={() => bridge.resolve(undefined)} />
    </ThemedModal>
  )
}
