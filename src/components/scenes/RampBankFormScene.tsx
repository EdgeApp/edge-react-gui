import * as React from 'react'
import { type TextInput, View } from 'react-native'
import { sprintf } from 'sprintf-js'

import { useBackEvent } from '../../hooks/useBackEvent'
import { useHandler } from '../../hooks/useHandler'
import { lstrings } from '../../locales/strings'
import type { EdgeAppSceneProps } from '../../types/routerTypes'
import { SceneButtons } from '../buttons/SceneButtons'
import { ErrorCard } from '../cards/ErrorCard'
import { SceneWrapper } from '../common/SceneWrapper'
import { SectionHeader } from '../common/SectionHeader'
import { SceneContainer } from '../layout/SceneContainer'
import { showError } from '../services/AirshipInstance'
import { cacheStyles, type Theme, useTheme } from '../services/ThemeContext'
import { FilledTextInput } from '../themed/FilledTextInput'

export interface BankFormData {
  type: 'bank_account'
  bankName: string
  ownerFirstName: string
  ownerLastName: string
  accountName: string
  accountNumber: string
  routingNumber: string
}

export interface RampBankFormParams {
  /** ISO country code for region-specific validation */
  countryCode: string
  /** Optional initial value for owner first name (e.g., from KYC) */
  initialFirstName?: string
  /** Optional initial value for owner last name (e.g., from KYC) */
  initialLastName?: string
  onSubmit: (formData: BankFormData) => Promise<void>
  /**
   * Callback invoked when the user navigates away from the scene.
   */
  onCancel: () => void
}

interface Props extends EdgeAppSceneProps<'rampBankForm'> {}

// Validation result type
interface ValidationResult {
  isValid: boolean
  errorMessage: string
}

export const RampBankFormScene: React.FC<Props> = props => {
  const { navigation, route } = props
  const {
    countryCode,
    initialFirstName = '',
    initialLastName = '',
    onSubmit,
    onCancel
  } = route.params

  const theme = useTheme()
  const styles = getStyles(theme)

  // Handle back navigation
  useBackEvent(navigation, onCancel)

  // Generate default account nickname from initial names if both are provided
  const initialAccountName =
    initialFirstName !== '' && initialLastName !== ''
      ? sprintf(
          lstrings.ramp_account_nickname_default_2s,
          initialFirstName,
          initialLastName
        )
      : ''

  const [bankName, setBankName] = React.useState('')
  const [accountNumber, setAccountNumber] = React.useState('')
  const [routingNumber, setRoutingNumber] = React.useState('')
  const [accountName, setAccountName] = React.useState(initialAccountName)
  const [ownerFirstName, setOwnerFirstName] = React.useState(initialFirstName)
  const [ownerLastName, setOwnerLastName] = React.useState(initialLastName)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [error, setError] = React.useState<unknown>(null)
  const [fieldErrors, setFieldErrors] = React.useState({
    accountNumber: '',
    routingNumber: ''
  })

  // Create refs for each input field
  const ownerFirstNameRef = React.useRef<TextInput>(null)
  const ownerLastNameRef = React.useRef<TextInput>(null)
  const bankNameRef = React.useRef<TextInput>(null)
  const accountNumberRef = React.useRef<TextInput>(null)
  const routingNumberRef = React.useRef<TextInput>(null)

  const handleAccountNumberBlur = useHandler(() => {
    const result = validateAccountNumber(accountNumber, countryCode)
    setFieldErrors(prev => ({ ...prev, accountNumber: result.errorMessage }))
  })

  const handleRoutingNumberBlur = useHandler(() => {
    const result = validateRoutingNumber(routingNumber, countryCode)
    setFieldErrors(prev => ({ ...prev, routingNumber: result.errorMessage }))
  })

  const handleAccountNumberChange = useHandler((text: string) => {
    setAccountNumber(text)
    setFieldErrors(prev => ({ ...prev, accountNumber: '' }))
  })

  const handleRoutingNumberChange = useHandler((text: string) => {
    setRoutingNumber(text)
    setFieldErrors(prev => ({ ...prev, routingNumber: '' }))
  })

  const isFormValid = React.useMemo(() => {
    const hasRequiredFields =
      bankName.trim() !== '' &&
      accountNumber.trim() !== '' &&
      routingNumber.trim() !== '' &&
      accountName.trim() !== '' &&
      ownerFirstName.trim() !== '' &&
      ownerLastName.trim() !== ''

    // Use the same validation functions for form validity
    const accountValid = validateAccountNumber(
      accountNumber,
      countryCode
    ).isValid
    const routingValid = validateRoutingNumber(
      routingNumber,
      countryCode
    ).isValid

    const hasNoFieldErrors =
      fieldErrors.accountNumber === '' && fieldErrors.routingNumber === ''

    return hasRequiredFields && accountValid && routingValid && hasNoFieldErrors
  }, [
    bankName,
    accountNumber,
    countryCode,
    routingNumber,
    accountName,
    ownerFirstName,
    ownerLastName,
    fieldErrors
  ])

  const handleSubmit = useHandler(async () => {
    if (!isFormValid) return

    setIsSubmitting(true)
    setError(null)

    try {
      await onSubmit({
        type: 'bank_account',
        bankName: bankName.trim(),
        accountNumber: accountNumber.trim(),
        routingNumber: routingNumber.trim(),
        accountName: accountName.trim(),
        ownerFirstName: ownerFirstName.trim(),
        ownerLastName: ownerLastName.trim()
      })
    } catch (err) {
      setError(err)
    } finally {
      setIsSubmitting(false)
    }
  })

  return (
    <SceneWrapper scroll hasTabs>
      <SceneContainer headerTitle={lstrings.bank_info_title}>
        <FilledTextInput
          value={accountName}
          onChangeText={setAccountName}
          placeholder={lstrings.ramp_account_nickname_placeholder}
          returnKeyType="next"
          autoCapitalize="words"
          aroundRem={0.5}
          bottomRem={1}
          onSubmitEditing={() => ownerFirstNameRef.current?.focus()}
        />

        <SectionHeader leftTitle={lstrings.form_field_title_account_owner} />
        <View style={styles.row}>
          <FilledTextInput
            expand
            ref={ownerFirstNameRef}
            value={ownerFirstName}
            onChangeText={setOwnerFirstName}
            placeholder={lstrings.form_field_title_first_name}
            returnKeyType="next"
            autoCapitalize="words"
            aroundRem={0.5}
            onSubmitEditing={() => ownerLastNameRef.current?.focus()}
          />

          <FilledTextInput
            expand
            ref={ownerLastNameRef}
            value={ownerLastName}
            onChangeText={setOwnerLastName}
            placeholder={lstrings.form_field_title_last_name}
            returnKeyType="next"
            autoCapitalize="words"
            aroundRem={0.5}
            onSubmitEditing={() => bankNameRef.current?.focus()}
          />
        </View>

        <SectionHeader leftTitle={lstrings.ramp_bank_details_section_title} />
        <FilledTextInput
          ref={bankNameRef}
          value={bankName}
          onChangeText={setBankName}
          placeholder={lstrings.ramp_bank_name_placeholder}
          returnKeyType="next"
          autoCapitalize="words"
          aroundRem={0.5}
          onSubmitEditing={() => accountNumberRef.current?.focus()}
        />

        {/* TODO: Adjust maxLength for other countries when internationalized */}
        <FilledTextInput
          ref={accountNumberRef}
          value={accountNumber}
          onChangeText={handleAccountNumberChange}
          placeholder={lstrings.ramp_account_number_placeholder}
          keyboardType="number-pad"
          returnKeyType="next"
          maxLength={countryCode === 'US' ? 17 : undefined}
          transformInput={input => input.replace(/[^0-9]/g, '')}
          error={fieldErrors.accountNumber}
          aroundRem={0.5}
          onBlur={handleAccountNumberBlur}
          onSubmitEditing={() => routingNumberRef.current?.focus()}
        />

        <FilledTextInput
          ref={routingNumberRef}
          value={routingNumber}
          onChangeText={handleRoutingNumberChange}
          placeholder={lstrings.ramp_routing_number_placeholder}
          keyboardType="number-pad"
          returnKeyType="done"
          maxLength={countryCode === 'US' ? 9 : undefined}
          transformInput={input => input.replace(/[^0-9]/g, '')}
          error={fieldErrors.routingNumber}
          aroundRem={0.5}
          onBlur={handleRoutingNumberBlur}
          onSubmitEditing={() => {
            handleSubmit().catch(showError)
          }}
        />
        {error != null && <ErrorCard error={error} />}
        <SceneButtons
          primary={{
            label: lstrings.string_submit,
            onPress: handleSubmit,
            disabled: !isFormValid || isSubmitting,
            spinner: isSubmitting
          }}
        />
      </SceneContainer>
    </SceneWrapper>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  row: {
    flexDirection: 'row'
  }
}))

// Single source of truth for field validation
// TODO: Extend validation for other countries when the form is internationalized
const validateAccountNumber = (
  value: string,
  countryCode: string
): ValidationResult => {
  const trimmed = value.trim()
  if (trimmed === '') {
    return { isValid: false, errorMessage: '' }
  }

  // US bank account numbers typically range from 4-17 digits
  if (countryCode === 'US') {
    if (trimmed.length < 4) {
      return {
        isValid: false,
        errorMessage: sprintf(
          lstrings.ramp_account_number_error_min_length_1s,
          '4'
        )
      }
    }
  }

  return { isValid: true, errorMessage: '' }
}

const validateRoutingNumber = (
  value: string,
  countryCode: string
): ValidationResult => {
  const trimmed = value.trim()
  if (trimmed === '') {
    return { isValid: false, errorMessage: '' }
  }

  // US ABA routing numbers are exactly 9 digits
  if (countryCode === 'US') {
    if (trimmed.length !== 9) {
      return {
        isValid: false,
        errorMessage: sprintf(lstrings.ramp_routing_number_error_length_1s, '9')
      }
    }
  }

  return { isValid: true, errorMessage: '' }
}
