import * as React from 'react'
import { View } from 'react-native'
import IonIcon from 'react-native-vector-icons/Ionicons'

import { useBackEvent } from '../../hooks/useBackEvent'
import { useHandler } from '../../hooks/useHandler'
import { lstrings } from '../../locales/strings'
import { GuiFormField } from '../../plugins/gui/components/GuiFormField'
import type { BuySellTabSceneProps } from '../../types/routerTypes'
import { SceneButtons } from '../buttons/SceneButtons'
import { ErrorCard } from '../cards/ErrorCard'
import { EdgeTouchableOpacity } from '../common/EdgeTouchableOpacity'
import { SceneWrapper } from '../common/SceneWrapper'
import { SectionHeader } from '../common/SectionHeader'
import { SceneContainer } from '../layout/SceneContainer'
import { DateModal } from '../modals/DateModal'
import { Airship, showError } from '../services/AirshipInstance'
import { cacheStyles, type Theme, useTheme } from '../services/ThemeContext'
import type { FilledTextInputRef } from '../themed/FilledTextInput'

export interface RampKycFormParams {
  headerTitle: string
  submitButtonText?: string
  initialFirstName?: string
  initialLastName?: string
  initialEmail?: string
  initialPhone?: string
  initialDateOfBirth?: string
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
  phone: string // E.164 format: +14155551234
  dateOfBirth: string // YYYY-MM-DD format
  ssn: string // XXX-XX-XXXX format
  address1: string
  address2?: string
  city: string
  state: string
  postalCode: string
}

interface Props extends BuySellTabSceneProps<'kycForm'> {}

export const RampKycFormScene = React.memo((props: Props) => {
  const { route, navigation } = props
  const theme = useTheme()
  const styles = getStyles(theme)
  const params = route.params as unknown as RampKycFormParams
  const {
    headerTitle,
    submitButtonText = lstrings.string_next_capitalized,
    initialFirstName = '',
    initialLastName = '',
    initialEmail = '',
    initialPhone = '',
    initialDateOfBirth = '',
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
  const [phone, setPhone] = React.useState(initialPhone)
  const [dateOfBirth, setDateOfBirth] = React.useState(initialDateOfBirth)
  const [ssn, setSsn] = React.useState('')
  const [address1, setAddress1] = React.useState(initialAddress1)
  const [address2, setAddress2] = React.useState(initialAddress2)
  const [city, setCity] = React.useState(initialCity)
  const [state, setState] = React.useState(initialState)
  const [postalCode, setPostalCode] = React.useState(initialPostalCode)
  const [error, setError] = React.useState<unknown>(null)
  const [emailError, setEmailError] = React.useState<string | undefined>()
  const [phoneError, setPhoneError] = React.useState<string | undefined>()
  const [dobError, setDobError] = React.useState<string | undefined>()
  const [ssnError, setSsnError] = React.useState<string | undefined>()
  const [submitting, setSubmitting] = React.useState(false)

  // Refs for input fields
  const firstNameRef = React.useRef<FilledTextInputRef>(null)
  const lastNameRef = React.useRef<FilledTextInputRef>(null)
  const emailRef = React.useRef<FilledTextInputRef>(null)
  const phoneRef = React.useRef<FilledTextInputRef>(null)
  const dobRef = React.useRef<FilledTextInputRef>(null)
  const ssnRef = React.useRef<FilledTextInputRef>(null)
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

  const handleEmailBlur = useHandler(() => {
    if (email.trim() !== '' && !isValidEmail(email)) {
      setEmailError(lstrings.invalid_email)
    }
  })

  // Format phone as user types: +1 (XXX) XXX-XXXX
  // TODO: Add international phone number support with country code picker
  const handlePhoneInput = useHandler((inputValue: string) => {
    const formatted = formatPhoneNumber(inputValue)
    setPhone(formatted)
    setPhoneError(undefined)
  })

  const handlePhoneBlur = useHandler(() => {
    if (phone.trim() !== '' && !isValidPhone(phone)) {
      setPhoneError(lstrings.form_field_error_invalid_phone)
    }
  })

  // Format date as user types: YYYY-MM-DD
  const handleDobInput = useHandler((inputValue: string) => {
    const formatted = formatDateOfBirth(inputValue)
    setDateOfBirth(formatted)
    setDobError(undefined)
  })

  const handleDobBlur = useHandler(() => {
    if (dateOfBirth.trim() !== '' && !isValidDateOfBirth(dateOfBirth)) {
      setDobError(lstrings.form_field_error_invalid_dob)
    }
  })

  // Open date picker modal for DOB selection
  const handleDobPress = useHandler(async () => {
    const initialDate = parseDateString(dateOfBirth) ?? getDefaultDobDate()

    const selectedDate = await Airship.show<Date>(bridge => (
      <DateModal bridge={bridge} initialValue={initialDate} />
    ))

    const formatted = formatDateFromPicker(selectedDate)
    setDateOfBirth(formatted)
    setDobError(undefined)
  })

  // Format SSN as user types: XXX-XX-XXXX
  const handleSsnInput = useHandler((inputValue: string) => {
    const formatted = formatSsn(inputValue)
    setSsn(formatted)
    setSsnError(undefined)
  })

  const handleSsnBlur = useHandler(() => {
    if (ssn.trim() !== '' && !isValidSsn(ssn)) {
      setSsnError(lstrings.form_field_error_invalid_ssn)
    }
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
    phoneRef.current?.focus()
  })

  const handlePhoneSubmit = useHandler(() => {
    dobRef.current?.focus()
  })

  const handleDobSubmit = useHandler(() => {
    ssnRef.current?.focus()
  })

  const handleSsnSubmit = useHandler(() => {
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
    // Validate all fields
    let hasError = false

    if (!isValidEmail(email)) {
      setEmailError(lstrings.invalid_email)
      hasError = true
    }

    if (!isValidPhone(phone)) {
      setPhoneError(lstrings.form_field_error_invalid_phone)
      hasError = true
    }

    if (!isValidDateOfBirth(dateOfBirth)) {
      setDobError(lstrings.form_field_error_invalid_dob)
      hasError = true
    }

    if (!isValidSsn(ssn)) {
      setSsnError(lstrings.form_field_error_invalid_ssn)
      hasError = true
    }

    if (hasError) return

    setSubmitting(true)
    setError(null)

    try {
      // Treat whitespace-only address2 as undefined
      const sanitizedAddress2 =
        address2 != null && address2.trim() !== '' ? address2.trim() : undefined

      // Convert phone to E.164 format
      const e164Phone = phoneToE164(phone)

      await onSubmit({
        email: email.trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: e164Phone,
        dateOfBirth: dateOfBirth.trim(),
        ssn: ssn.trim(),
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
    phone.trim() !== '' &&
    dateOfBirth.trim() !== '' &&
    ssn.trim() !== '' &&
    address1.trim() !== '' &&
    city.trim() !== '' &&
    state.trim() !== '' &&
    postalCode.trim() !== ''

  return (
    <SceneWrapper scroll hasTabs>
      <SceneContainer headerTitle={headerTitle}>
        <SectionHeader
          leftTitle={lstrings.form_field_personal_information_title}
        />
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

        <GuiFormField
          fieldType="text"
          value={email}
          label={lstrings.form_field_title_email_address}
          onChangeText={handleEmailInput}
          onBlur={handleEmailBlur}
          onSubmitEditing={handleEmailSubmit}
          error={emailError}
          returnKeyType="next"
          fieldRef={emailRef}
        />

        {/* TODO: Add international phone number support with country code picker */}
        <GuiFormField
          fieldType="phone"
          value={phone}
          label={lstrings.form_field_title_phone}
          onChangeText={handlePhoneInput}
          onBlur={handlePhoneBlur}
          onSubmitEditing={handlePhoneSubmit}
          error={phoneError}
          returnKeyType="next"
          fieldRef={phoneRef}
        />

        {/* DOB field with text input and calendar picker button */}
        <View style={styles.dobRow}>
          <View style={styles.dobInputContainer}>
            <GuiFormField
              fieldType="date"
              value={dateOfBirth}
              label={lstrings.form_field_title_date_of_birth}
              onChangeText={handleDobInput}
              onBlur={handleDobBlur}
              onSubmitEditing={handleDobSubmit}
              error={dobError}
              returnKeyType="next"
              fieldRef={dobRef}
            />
          </View>
          <EdgeTouchableOpacity
            style={styles.calendarButton}
            onPress={handleDobPress}
          >
            <IonIcon
              name="calendar-outline"
              size={theme.rem(1.5)}
              color={theme.iconTappable}
            />
          </EdgeTouchableOpacity>
        </View>

        <GuiFormField
          fieldType="ssn"
          value={ssn}
          label={lstrings.form_field_title_ssn}
          onChangeText={handleSsnInput}
          onBlur={handleSsnBlur}
          onSubmitEditing={handleSsnSubmit}
          error={ssnError}
          returnKeyType="next"
          fieldRef={ssnRef}
        />
        <SectionHeader leftTitle={lstrings.form_field_mailing_address_title} />
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
        <SceneButtons
          primary={{
            label: submitButtonText,
            onPress: handleSubmit,
            disabled: !isFormValid || submitting
          }}
        />
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

/**
 * Formats phone number as user types: (XXX) XXX-XXXX
 * Only allows digits, auto-inserts formatting characters
 */
const formatPhoneNumber = (input: string): string => {
  // Remove all non-digits
  let digits = input.replace(/\D/g, '')

  // Strip leading 1 for US numbers with country code (e.g. +1 415 555 1234)
  if (digits.length === 11 && digits.startsWith('1')) {
    digits = digits.slice(1)
  }

  // Limit to 10 digits (US phone number)
  const limited = digits.slice(0, 10)

  // Format based on length
  if (limited.length === 0) return ''
  if (limited.length <= 3) return `(${limited}`
  if (limited.length <= 6) return `(${limited.slice(0, 3)}) ${limited.slice(3)}`
  return `(${limited.slice(0, 3)}) ${limited.slice(3, 6)}-${limited.slice(6)}`
}

/**
 * Validates phone number format: (XXX) XXX-XXXX (10 digits)
 */
const isValidPhone = (phone: string): boolean => {
  const digits = phone.replace(/\D/g, '')
  return digits.length === 10
}

/**
 * Converts formatted phone to E.164 format: +1XXXXXXXXXX
 */
const phoneToE164 = (phone: string): string => {
  const digits = phone.replace(/\D/g, '')
  return `+1${digits}`
}

/**
 * Validates date of birth format: YYYY-MM-DD
 * Also checks for reasonable date values
 */
const isValidDateOfBirth = (dob: string): boolean => {
  // Check format
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/
  if (!dateRegex.test(dob)) return false

  // Parse and validate date
  const [year, month, day] = dob.split('-').map(Number)
  const date = new Date(year, month - 1, day)

  // Check if date is valid and matches input
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return false
  }

  // Check reasonable range (must be at least 18 years old, not more than 120)
  const now = new Date()
  let age = now.getFullYear() - year

  // Adjust age if birthday hasn't occurred yet this year
  const monthDiff = now.getMonth() - (month - 1)
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < day)) {
    age--
  }

  return age >= 18 && age <= 120
}

/**
 * Formats date of birth as user types: YYYY-MM-DD
 * Only allows digits, auto-inserts dashes
 */
const formatDateOfBirth = (input: string): string => {
  // Remove all non-digits
  const digits = input.replace(/\D/g, '')

  // Limit to 8 digits (YYYYMMDD)
  const limited = digits.slice(0, 8)

  // Format based on length
  if (limited.length === 0) return ''
  if (limited.length <= 4) return limited
  if (limited.length <= 6) return `${limited.slice(0, 4)}-${limited.slice(4)}`
  return `${limited.slice(0, 4)}-${limited.slice(4, 6)}-${limited.slice(6)}`
}

/**
 * Parses a YYYY-MM-DD string into a Date object.
 * Returns null for partial or invalid input.
 */
const parseDateString = (dateStr: string): Date | null => {
  const parts = dateStr.split('-')
  if (parts.length !== 3) return null
  const [year, month, day] = parts.map(Number)
  if (isNaN(year) || isNaN(month) || isNaN(day)) return null
  const date = new Date(year, month - 1, day)
  if (isNaN(date.getTime())) return null
  return date
}

/**
 * Returns a default date for the DOB picker (30 years ago)
 */
const getDefaultDobDate = (): Date => {
  const date = new Date()
  date.setFullYear(date.getFullYear() - 30)
  return date
}

/**
 * Formats a Date object to YYYY-MM-DD string
 */
const formatDateFromPicker = (date: Date): string => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Formats SSN as user types: XXX-XX-XXXX
 * Only allows digits, auto-inserts dashes
 */
const formatSsn = (input: string): string => {
  // Remove all non-digits
  const digits = input.replace(/\D/g, '')

  // Limit to 9 digits
  const limited = digits.slice(0, 9)

  // Format based on length
  if (limited.length === 0) return ''
  if (limited.length <= 3) return limited
  if (limited.length <= 5) return `${limited.slice(0, 3)}-${limited.slice(3)}`
  return `${limited.slice(0, 3)}-${limited.slice(3, 5)}-${limited.slice(5)}`
}

/**
 * Validates SSN format: XXX-XX-XXXX (9 digits)
 */
const isValidSsn = (ssn: string): boolean => {
  const digits = ssn.replace(/\D/g, '')
  return digits.length === 9
}

const getStyles = cacheStyles((theme: Theme) => ({
  dobRow: {
    flexDirection: 'row',
    alignItems: 'flex-start'
  },
  dobInputContainer: {
    flex: 1
  },
  calendarButton: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.rem(0.75),
    paddingTop: theme.rem(1.25)
  }
}))
