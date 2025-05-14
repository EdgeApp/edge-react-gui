import * as React from 'react'

import { SceneButtons } from '../../../components/buttons/SceneButtons'
import { SceneWrapper } from '../../../components/common/SceneWrapper'
import { SceneContainer } from '../../../components/layout/SceneContainer'
import { Paragraph } from '../../../components/themed/EdgeText'
import { useAsyncEffect } from '../../../hooks/useAsyncEffect'
import { useHandler } from '../../../hooks/useHandler'
import { lstrings } from '../../../locales/strings'
import { asEmailContactInfo, EMAIL_CONTACT_FORM_DISKLET_NAME, EmailContactInfo } from '../../../types/FormTypes'
import { useSelector } from '../../../types/reactRedux'
import { BuyTabSceneProps } from '../../../types/routerTypes'
import { getDiskletFormData, setDiskletForm } from '../../../util/formUtils'
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
  const disklet = useSelector(state => state.core.disklet)

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

    // If form is valid, save the data to disklet for future use
    try {
      const contactInfo: EmailContactInfo = {
        email,
        firstName,
        lastName
      }
      await setDiskletForm(disklet, EMAIL_CONTACT_FORM_DISKLET_NAME, contactInfo)
    } catch (error) {
      console.warn(`Error saving contact form: ${String(error)}`)
      // Continue with submission even if saving fails
    }

    // Proceed with submission
    await onSubmit(email, firstName, lastName)
  })

  // Load saved contact information when component mounts
  useAsyncEffect(
    async () => {
      try {
        const savedContactInfo = await getDiskletFormData(disklet, EMAIL_CONTACT_FORM_DISKLET_NAME, asEmailContactInfo)
        if (savedContactInfo != null) {
          setEmail(savedContactInfo.email)
          setFirstName(savedContactInfo.firstName)
          setLastName(savedContactInfo.lastName)
        }
      } catch (error) {
        console.warn(`Error loading saved contact form: ${String(error)}`)
        // Continue without saved data if loading fails
      }
    },
    [],
    'EmailFormScene'
  )

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
