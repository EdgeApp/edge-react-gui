import * as React from 'react'

import { useBackEvent } from '../../hooks/useBackEvent'
import { useHandler } from '../../hooks/useHandler'
import { lstrings } from '../../locales/strings'
import { GuiFormField } from '../../plugins/gui/components/GuiFormField'
import { GuiFormRow } from '../../plugins/gui/components/GuiFormRow'
import type { BuySellTabSceneProps } from '../../types/routerTypes'
import { KavButtons } from '../buttons/KavButtons'
import { ErrorCard } from '../cards/ErrorCard'
import { SceneWrapper } from '../common/SceneWrapper'
import { SceneContainer } from '../layout/SceneContainer'
import { showError } from '../services/AirshipInstance'
import type { FilledTextInputRef } from '../themed/FilledTextInput'

export interface RampKycFormParams {
  headerTitle: string
  submitButtonText?: string
  initialFirstName?: string
  initialLastName?: string
  initialEmail?: string
  initialAddress1?: string
  initialAddress2?: string
  initialCity?: string
  initialState?: string
  initialPostalCode?: string
  onSubmit: (contactInfo: KycFormData) => Promise<void>
  /**
   * Callback invoked when the user navigates away from the scene.
   */
  onCancel: () => void
}

export interface KycFormData {
  email: string
  firstName: string
  lastName: string
  address1: string
  address2?: string
  city: string
  state: string
  postalCode: string
}

interface Props extends BuySellTabSceneProps<'kycForm'> {}

export const RampKycFormScene = React.memo((props: Props) => {
  const { route, navigation } = props
  const params = route.params as unknown as RampKycFormParams
  const {
    headerTitle,
    submitButtonText = lstrings.string_next_capitalized,
    initialFirstName = '',
    initialLastName = '',
    initialEmail = '',
    initialAddress1 = '',
    initialAddress2 = '',
    initialCity = '',
    initialState = '',
    initialPostalCode = '',
    onSubmit,
    onCancel
  } = params

  const [firstName, setFirstName] = React.useState(initialFirstName)
  const [lastName, setLastName] = React.useState(initialLastName)
  const [email, setEmail] = React.useState(initialEmail)
  const [address1, setAddress1] = React.useState(initialAddress1)
  const [address2, setAddress2] = React.useState(initialAddress2)
  const [city, setCity] = React.useState(initialCity)
  const [state, setState] = React.useState(initialState)
  const [postalCode, setPostalCode] = React.useState(initialPostalCode)
  const [error, setError] = React.useState<unknown>(null)
  const [emailError, setEmailError] = React.useState<string | undefined>()
  const [submitting, setSubmitting] = React.useState(false)

  // Refs for input fields
  const firstNameRef = React.useRef<FilledTextInputRef>(null)
  const lastNameRef = React.useRef<FilledTextInputRef>(null)
  const emailRef = React.useRef<FilledTextInputRef>(null)
  const address1Ref = React.useRef<FilledTextInputRef>(null)
  const address2Ref = React.useRef<FilledTextInputRef>(null)
  const cityRef = React.useRef<FilledTextInputRef>(null)
  const stateRef = React.useRef<FilledTextInputRef>(null)
  const postalCodeRef = React.useRef<FilledTextInputRef>(null)

  const handleFirstNameInput = useHandler((inputValue: string) => {
    setFirstName(inputValue)
  })

  const handleLastNameInput = useHandler((inputValue: string) => {
    setLastName(inputValue)
  })

  const handleEmailInput = useHandler((inputValue: string) => {
    setEmail(inputValue)
    setEmailError(undefined)
  })

  const handleAddress1Input = useHandler((inputValue: string) => {
    setAddress1(inputValue)
  })

  const handleAddress2Input = useHandler((inputValue: string) => {
    setAddress2(inputValue)
  })

  const handleCityInput = useHandler((inputValue: string) => {
    setCity(inputValue)
  })

  const handleStateInput = useHandler((inputValue: string) => {
    setState(inputValue)
  })

  const handlePostalCodeInput = useHandler((inputValue: string) => {
    setPostalCode(inputValue)
  })

  const handleFirstNameSubmit = useHandler(() => {
    lastNameRef.current?.focus()
  })

  const handleLastNameSubmit = useHandler(() => {
    emailRef.current?.focus()
  })

  const handleEmailSubmit = useHandler(() => {
    address1Ref.current?.focus()
  })

  const handleAddress1Submit = useHandler(() => {
    address2Ref.current?.focus()
  })

  const handleAddress2Submit = useHandler(() => {
    cityRef.current?.focus()
  })

  const handleCitySubmit = useHandler(() => {
    stateRef.current?.focus()
  })

  const handleStateSubmit = useHandler(() => {
    postalCodeRef.current?.focus()
  })

  const handleSubmit = useHandler(async () => {
    // Validate email
    if (!isValidEmail(email)) {
      setEmailError(lstrings.invalid_email)
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      // Treat whitespace-only address2 as undefined
      const sanitizedAddress2 =
        address2 != null && address2.trim() !== '' ? address2.trim() : undefined
      await onSubmit({
        email: email.trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        address1: address1.trim(),
        address2: sanitizedAddress2,
        city: city.trim(),
        state: state.trim(),
        postalCode: postalCode.trim()
      })
    } catch (err: unknown) {
      setError(err)
    } finally {
      setSubmitting(false)
    }
  })

  // Handle back navigation
  useBackEvent(navigation, onCancel)

  const isFormValid =
    firstName.trim() !== '' &&
    lastName.trim() !== '' &&
    email.trim() !== '' &&
    address1.trim() !== '' &&
    city.trim() !== '' &&
    state.trim() !== '' &&
    postalCode.trim() !== ''

  return (
    <SceneWrapper
      scroll
      hasTabs
      avoidKeyboard
      dockProps={{
        keyboardVisibleOnly: false,
        children: (
          <KavButtons
            primary={{
              label: submitButtonText,
              onPress: handleSubmit,
              disabled: !isFormValid || submitting
            }}
          />
        )
      }}
    >
      <SceneContainer headerTitle={headerTitle}>
        <GuiFormRow>
          <GuiFormField
            fieldType="name"
            value={firstName}
            label={lstrings.form_field_title_first_name}
            onChangeText={handleFirstNameInput}
            onSubmitEditing={handleFirstNameSubmit}
            returnKeyType="next"
            fieldRef={firstNameRef}
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
        </GuiFormRow>

        <GuiFormField
          fieldType="text"
          value={email}
          label={lstrings.form_field_title_email_address}
          onChangeText={handleEmailInput}
          onSubmitEditing={handleEmailSubmit}
          error={emailError}
          returnKeyType="next"
          fieldRef={emailRef}
        />

        <GuiFormField
          fieldType="address"
          value={address1}
          label={lstrings.form_field_title_address_line_1}
          onChangeText={handleAddress1Input}
          onSubmitEditing={handleAddress1Submit}
          returnKeyType="next"
          fieldRef={address1Ref}
        />
        <GuiFormField
          fieldType="address2"
          value={address2}
          label={lstrings.form_field_title_address_line_2}
          onChangeText={handleAddress2Input}
          onSubmitEditing={handleAddress2Submit}
          returnKeyType="next"
          fieldRef={address2Ref}
        />

        <GuiFormField
          fieldType="city"
          value={city}
          label={lstrings.form_field_title_address_city}
          onChangeText={handleCityInput}
          onSubmitEditing={handleCitySubmit}
          returnKeyType="next"
          fieldRef={cityRef}
        />

        <GuiFormField
          fieldType="state"
          value={state}
          label={lstrings.form_field_title_address_state_province_region}
          onChangeText={handleStateInput}
          onSubmitEditing={handleStateSubmit}
          returnKeyType="next"
          fieldRef={stateRef}
        />

        <GuiFormField
          fieldType="postalcode"
          value={postalCode}
          label={lstrings.form_field_title_address_zip_postal_code}
          onChangeText={handlePostalCodeInput}
          onSubmitEditing={() => {
            handleSubmit().catch(showError)
          }}
          returnKeyType="done"
          fieldRef={postalCodeRef}
        />

        {error == null ? null : <ErrorCard error={error} />}
      </SceneContainer>
    </SceneWrapper>
  )
})

/**
 * Validates email format using a regular expression
 */
const isValidEmail = (email: string): boolean => {
  if (email.trim() === '') return false
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}
