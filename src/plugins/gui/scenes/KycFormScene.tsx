import * as React from 'react'

import { SceneButtons } from '../../../components/buttons/SceneButtons'
import { AlertCardUi4 } from '../../../components/cards/AlertCard'
import { SceneWrapper } from '../../../components/common/SceneWrapper'
import { SceneContainer } from '../../../components/layout/SceneContainer'
import type { FilledTextInputRef } from '../../../components/themed/FilledTextInput'
import { useHandler } from '../../../hooks/useHandler'
import { lstrings } from '../../../locales/strings'
import type { EmailContactInfo } from '../../../types/FormTypes'
import type { BuyTabSceneProps } from '../../../types/routerTypes'
import { GuiFormField } from '../components/GuiFormField'

export interface FiatPluginKycFormParams {
  headerTitle: string
  submitButtonText?: string
  initialFirstName?: string
  initialLastName?: string
  initialEmail?: string
  onSubmit: (contactInfo: EmailContactInfo) => Promise<void>
  onClose?: () => void
}

interface Props extends BuyTabSceneProps<'kycForm'> {}

/**
 * Validates email format using a regular expression
 */
const isValidEmail = (email: string): boolean => {
  if (email.trim() === '') return false
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export const KycFormScene = React.memo((props: Props) => {
  const { route, navigation } = props
  const params = route.params as unknown as FiatPluginKycFormParams
  const {
    headerTitle,
    submitButtonText = lstrings.string_next_capitalized,
    initialFirstName = '',
    initialLastName = '',
    initialEmail = '',
    onSubmit,
    onClose
  } = params

  const [firstName, setFirstName] = React.useState(initialFirstName)
  const [lastName, setLastName] = React.useState(initialLastName)
  const [email, setEmail] = React.useState(initialEmail)
  const [error, setError] = React.useState<string | undefined>()
  const [emailError, setEmailError] = React.useState<string | undefined>()
  const [submitting, setSubmitting] = React.useState(false)

  // Refs for input fields
  const lastNameRef = React.useRef<FilledTextInputRef>(null)
  const emailRef = React.useRef<FilledTextInputRef>(null)

  const handleFirstNameInput = useHandler((inputValue: string) => {
    setFirstName(inputValue)
    setError(undefined)
  })

  const handleLastNameInput = useHandler((inputValue: string) => {
    setLastName(inputValue)
    setError(undefined)
  })

  const handleEmailInput = useHandler((inputValue: string) => {
    setEmail(inputValue)
    setError(undefined)
    setEmailError(undefined)
  })

  const handleFirstNameSubmit = useHandler(() => {
    lastNameRef.current?.focus()
  })

  const handleLastNameSubmit = useHandler(() => {
    emailRef.current?.focus()
  })

  const handleSubmit = useHandler(async () => {
    // Validate email
    if (!isValidEmail(email)) {
      setEmailError(lstrings.invalid_email)
      return
    }

    setSubmitting(true)
    setError(undefined)

    try {
      await onSubmit({
        email: email.trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim()
      })
    } catch (err: any) {
      setError(err.message || 'An error occurred. Please try again.')
    } finally {
      setSubmitting(false)
    }
  })

  // Cleanup on unmount
  React.useEffect(() => {
    return navigation.addListener('beforeRemove', () => {
      if (onClose != null) onClose()
    })
  }, [navigation, onClose])

  const isFormValid =
    firstName.trim() !== '' && lastName.trim() !== '' && email.trim() !== ''

  return (
    <SceneWrapper scroll hasTabs hasNotifications avoidKeyboard>
      <SceneContainer headerTitle={headerTitle}>
        {error != null ? (
          <AlertCardUi4
            title={error}
            type="error"
            marginRem={[0, 0.5, 1, 0.5]}
          />
        ) : null}

        <GuiFormField
          fieldType="name"
          value={firstName}
          label={lstrings.form_field_title_first_name}
          onChangeText={handleFirstNameInput}
          onSubmitEditing={handleFirstNameSubmit}
          returnKeyType="next"
          autofocus
        />

        <GuiFormField
          fieldType="name"
          value={lastName}
          label={lstrings.form_field_title_last_name}
          onChangeText={handleLastNameInput}
          onSubmitEditing={handleLastNameSubmit}
          returnKeyType="next"
          fieldRef={lastNameRef}
        />

        <GuiFormField
          fieldType="text"
          value={email}
          label={lstrings.form_field_title_email_address}
          onChangeText={handleEmailInput}
          onSubmitEditing={handleSubmit}
          error={emailError}
          returnKeyType="done"
          fieldRef={emailRef}
        />

        <SceneButtons
          primary={{
            label: submitButtonText,
            disabled: !isFormValid || submitting,
            onPress: handleSubmit
          }}
        />
      </SceneContainer>
    </SceneWrapper>
  )
})
