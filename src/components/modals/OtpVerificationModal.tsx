import * as React from 'react'
import type { AirshipBridge } from 'react-native-airship'

import { useHandler } from '../../hooks/useHandler'
import { lstrings } from '../../locales/strings'
import { ModalButtons } from '../buttons/ModalButtons'
import { ErrorCard } from '../cards/ErrorCard'
import { Airship } from '../services/AirshipInstance'
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

  const [code, setCode] = React.useState('')
  const [error, setError] = React.useState<unknown>()
  const [verifying, setVerifying] = React.useState(false)

  const handleCancel = useHandler(() => {
    bridge.resolve(undefined)
  })

  const handleChangeText = useHandler((nextCode: string) => {
    setCode(nextCode)
    setError(undefined)
  })

  const isValid = code.trim().length === 6

  const handleSubmit = useHandler(() => {
    if (verifying || !isValid) return

    const trimmedCode = code.trim()
    setVerifying(true)
    setError(undefined)

    onVerify(trimmedCode).then(
      (result: unknown) => {
        bridge.resolve(result)
      },
      (err: unknown) => {
        setError(err)
        setVerifying(false)
      }
    )
  })

  return (
    <EdgeModal
      bridge={bridge}
      title={title}
      onCancel={handleCancel}
      scroll={false}
    >
      <Paragraph>{message}</Paragraph>
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
      {error == null ? null : <ErrorCard error={error} />}
      <ModalButtons
        primary={{
          label: submitLabel ?? lstrings.string_submit,
          onPress: handleSubmit,
          disabled: !isValid || verifying,
          spinner: verifying
        }}
      />
    </EdgeModal>
  )
}

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
