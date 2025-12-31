import * as React from 'react'
import { View } from 'react-native'
import type { AirshipBridge } from 'react-native-airship'

import { useHandler } from '../../hooks/useHandler'
import { lstrings } from '../../locales/strings'
import { translateError } from '../../util/translateError'
import { ModalButtons } from '../buttons/ModalButtons'
import { AlertCardUi4 } from '../cards/AlertCard'
import { Airship } from '../services/AirshipInstance'
import { cacheStyles, type Theme, useTheme } from '../services/ThemeContext'
import { Paragraph } from '../themed/EdgeText'
import { ModalFilledTextInput } from '../themed/FilledTextInput'
import { EdgeModal } from './EdgeModal'

export interface OtpVerificationModalParams<T> {
  title?: string
  message: string
  inputLabel?: string
  submitLabel?: string
  onVerify: (code: string) => Promise<T>
}

interface Props {
  bridge: AirshipBridge<unknown | undefined>
  title?: string
  message: string
  inputLabel?: string
  submitLabel?: string
  onVerify: (code: string) => Promise<unknown>
}

export const OtpVerificationModal: React.FC<Props> = props => {
  const { bridge, inputLabel, message, onVerify, submitLabel, title } = props

  const theme = useTheme()
  const styles = getStyles(theme)

  const [code, setCode] = React.useState('')
  const [errorMessage, setErrorMessage] = React.useState<string | undefined>()
  const [verifying, setVerifying] = React.useState(false)

  const handleCancel = useHandler(() => {
    bridge.resolve(undefined)
  })

  const handleChangeText = useHandler((nextCode: string) => {
    setCode(nextCode)
    setErrorMessage(undefined)
  })

  const handleSubmit = useHandler(() => {
    const trimmedCode = code.trim()
    setVerifying(true)
    setErrorMessage(undefined)

    onVerify(trimmedCode).then(
      (result: unknown) => {
        bridge.resolve(result)
      },
      (err: unknown) => {
        setErrorMessage(translateError(err))
        setVerifying(false)
      }
    )
  })

  const isValid = code.trim().length > 0

  return (
    <EdgeModal
      bridge={bridge}
      title={title}
      onCancel={handleCancel}
      scroll={false}
    >
      <View style={styles.container}>
        <Paragraph>{message}</Paragraph>
        {errorMessage == null ? null : (
          <AlertCardUi4
            title={lstrings.ramp_kyc_error_title}
            type="error"
            body={errorMessage}
            marginRem={0.5}
          />
        )}
        <ModalFilledTextInput
          autoCapitalize="none"
          autoCorrect={false}
          autoFocus
          keyboardType="number-pad"
          maxLength={6}
          placeholder={inputLabel}
          returnKeyType="done"
          value={code}
          onChangeText={handleChangeText}
          onSubmitEditing={handleSubmit}
        />
        <ModalButtons
          primary={{
            label: submitLabel ?? lstrings.string_submit,
            onPress: handleSubmit,
            disabled: !isValid || verifying,
            spinner: verifying
          }}
        />
      </View>
    </EdgeModal>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  container: {
    paddingTop: theme.rem(0.25)
  }
}))

export const showOtpVerificationModal = async <T,>(
  params: OtpVerificationModalParams<T>
): Promise<T | undefined> => {
  const { inputLabel, message, onVerify, submitLabel, title } = params
  return await Airship.show<T | undefined>(bridge => (
    <OtpVerificationModal
      bridge={bridge as AirshipBridge<unknown | undefined>}
      title={title}
      message={message}
      inputLabel={inputLabel}
      submitLabel={submitLabel}
      onVerify={onVerify as (code: string) => Promise<unknown>}
    />
  ))
}
