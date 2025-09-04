import * as React from 'react'

import { SceneButtons } from '../../../components/buttons/SceneButtons'
import { AlertCardUi4 } from '../../../components/cards/AlertCard'
import { SceneWrapper } from '../../../components/common/SceneWrapper'
import { SceneContainer } from '../../../components/layout/SceneContainer'
import type { FilledTextInputRef } from '../../../components/themed/FilledTextInput'
import { useHandler } from '../../../hooks/useHandler'
import { lstrings } from '../../../locales/strings'
import type { KycContactInfo } from '../../../types/FormTypes'
import type { BuyTabSceneProps } from '../../../types/routerTypes'
import { GuiFormField } from '../components/GuiFormField'

export interface FiatPluginKycFormParams {
  headerTitle: string
  submitButtonText?: string
  initialFirstName?: string
  initialLastName?: string
  initialEmail?: string
  initialAddress?: string
  initialCity?: string
  initialState?: string
  initialPostalCode?: string
  onSubmit: (contactInfo: KycContactInfo) => Promise<void>
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
    initialAddress = '',
    initialCity = '',
    initialState = '',
    initialPostalCode = '',
    onSubmit,
    onClose
  } = params

  const [firstName, setFirstName] = React.useState(initialFirstName)
  const [lastName, setLastName] = React.useState(initialLastName)
  const [email, setEmail] = React.useState(initialEmail)
  const [address, setAddress] = React.useState(initialAddress)
  const [city, setCity] = React.useState(initialCity)
  const [state, setState] = React.useState(initialState)
  const [postalCode, setPostalCode] = React.useState(initialPostalCode)
  const [error, setError] = React.useState<string | undefined>()
  const [emailError, setEmailError] = React.useState<string | undefined>()
  const [submitting, setSubmitting] = React.useState(false)

  // Refs for input fields
  const lastNameRef = React.useRef<FilledTextInputRef>(null)
  const emailRef = React.useRef<FilledTextInputRef>(null)
  const addressRef = React.useRef<FilledTextInputRef>(null)
  const cityRef = React.useRef<FilledTextInputRef>(null)
  const stateRef = React.useRef<FilledTextInputRef>(null)
  const postalCodeRef = React.useRef<FilledTextInputRef>(null)

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

  const handleAddressInput = useHandler((inputValue: string) => {
    setAddress(inputValue)
    setError(undefined)
  })

  const handleCityInput = useHandler((inputValue: string) => {
    setCity(inputValue)
    setError(undefined)
  })

  const handleStateInput = useHandler((inputValue: string) => {
    setState(inputValue)
    setError(undefined)
  })

  const handlePostalCodeInput = useHandler((inputValue: string) => {
    setPostalCode(inputValue)
    setError(undefined)
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
    setError(undefined)

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
    firstName.trim() !== '' &&
    lastName.trim() !== '' &&
    email.trim() !== '' &&
    address.trim() !== '' &&
    city.trim() !== '' &&
    state.trim() !== '' &&
    postalCode.trim() !== ''

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
          onSubmitEditing={handleSubmit}
          returnKeyType="done"
          fieldRef={postalCodeRef}
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
