import * as React from 'react'

import { useBackEvent } from '../../hooks/useBackEvent'
import { useHandler } from '../../hooks/useHandler'
import { lstrings } from '../../locales/strings'
import { GuiFormField } from '../../plugins/gui/components/GuiFormField'
import { GuiFormRow } from '../../plugins/gui/components/GuiFormRow'
import type { BuySellTabSceneProps } from '../../types/routerTypes'
import { ErrorCard } from '../cards/ErrorCard'
import { SceneWrapper } from '../common/SceneWrapper'
import { KavButton } from '../keyboard/KavButton'
import { SceneContainer } from '../layout/SceneContainer'
import { showError } from '../services/AirshipInstance'
import type { FilledTextInputRef } from '../themed/FilledTextInput'

export interface RampKycFormParams {
  headerTitle: string
  submitButtonText?: string
  initialFirstName?: string
  initialLastName?: string
  initialEmail?: string
  initialAddress?: string
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
  address: string
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
    initialAddress = '',
    initialCity = '',
    initialState = '',
    initialPostalCode = '',
    onSubmit,
    onCancel
  } = params

  const [firstName, setFirstName] = React.useState(initialFirstName)
  const [lastName, setLastName] = React.useState(initialLastName)
  const [email, setEmail] = React.useState(initialEmail)
  const [address, setAddress] = React.useState(initialAddress)
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
  const addressRef = React.useRef<FilledTextInputRef>(null)
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

  const handleAddressInput = useHandler((inputValue: string) => {
    setAddress(inputValue)
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
    addressRef.current?.focus()
  })

  const handleAddressSubmit = useHandler(() => {
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
      await onSubmit({
        email: email.trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        address: address.trim(),
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
    address.trim() !== '' &&
    city.trim() !== '' &&
    state.trim() !== '' &&
    postalCode.trim() !== ''

  return (
    <>
      <SceneWrapper scroll hasTabs hasNotifications avoidKeyboard>
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
            value={address}
            label={lstrings.form_field_title_street_name}
            onChangeText={handleAddressInput}
            onSubmitEditing={handleAddressSubmit}
            returnKeyType="next"
            fieldRef={addressRef}
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

          {/* <SceneButtons
          primary={{
            label: submitButtonText,
            disabled: !isFormValid || submitting,
            onPress: handleSubmit
          }}
        /> */}
        </SceneContainer>
      </SceneWrapper>
      <KavButton
        label={submitButtonText}
        onPress={handleSubmit}
        hasTabs
        disabled={!isFormValid || submitting}
      />
    </>
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
