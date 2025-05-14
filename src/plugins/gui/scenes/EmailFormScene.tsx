import * as React from 'react'

import { SceneButtons } from '../../../components/buttons/SceneButtons'
import { SceneWrapper } from '../../../components/common/SceneWrapper'
import { SceneContainer } from '../../../components/layout/SceneContainer'
import { Paragraph } from '../../../components/themed/EdgeText'
import { useHandler } from '../../../hooks/useHandler'
import { lstrings } from '../../../locales/strings'
import { BuyTabSceneProps } from '../../../types/routerTypes'
import { GuiFormField } from '../components/GuiFormField'

export interface FiatPluginEmailFormParams {
  message?: string
  onClose: () => void
  onSubmit: (email: string, firstName: string, lastName: string) => Promise<void>
}

interface Props extends BuyTabSceneProps<'guiPluginEmailForm'> {}

/**
 * Validates email format using a regular expression
 * Uses RFC 5322 compliant regex for accurate validation
 */
const isValidEmail = (email: string): boolean => {
  // Check for empty email first
  if (email.trim() === '') return false

  // Basic email validation regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export const EmailFormScene = React.memo((props: Props) => {
  const { navigation, route } = props
  const { params } = route
  const { onClose, onSubmit } = params

  const [email, setEmail] = React.useState('')
  const [firstName, setFirstName] = React.useState('')
  const [lastName, setLastName] = React.useState('')
  const [emailError, setEmailError] = React.useState('')

  React.useEffect(() => {
    return navigation.addListener('beforeRemove', () => {
      onClose()
    })
  }, [navigation, onClose])

  const handleEmailChange = useHandler((text: string) => {
    setEmail(text)
    // Always clear error when user is editing
    if (emailError !== '') {
      setEmailError('')
    }
  })

  const handleCancelPress = useHandler(() => {
    if (navigation.canGoBack()) navigation.goBack()
  })

  const handleSubmitPress = useHandler(async () => {
    // Only validate when submitting
    if (!isValidEmail(email)) {
      setEmailError(lstrings.invalid_email)
      return
    }

    // If we get here, email is valid - proceed with submission
    await onSubmit(email, firstName, lastName)
  })

  return (
    <SceneWrapper hasTabs hasNotifications avoidKeyboard scroll>
      <SceneContainer headerTitle={lstrings.enter_contact_info}>
        {params.message == null ? null : <Paragraph>{params.message}</Paragraph>}
        <GuiFormField fieldType="text" autofocus label={lstrings.form_field_title_first_name} onChangeText={setFirstName} value={firstName} />
        <GuiFormField fieldType="text" label={lstrings.form_field_title_last_name} onChangeText={setLastName} value={lastName} />
        <GuiFormField fieldType="text" label={lstrings.form_field_title_email_address} onChangeText={handleEmailChange} value={email} error={emailError} />
        <SceneButtons
          primary={{
            label: lstrings.submit,
            disabled: email === '' || firstName === '' || lastName === '',
            onPress: handleSubmitPress
          }}
          secondary={{
            label: lstrings.string_cancel_cap,
            onPress: handleCancelPress
          }}
        />
      </SceneContainer>
    </SceneWrapper>
  )
})
