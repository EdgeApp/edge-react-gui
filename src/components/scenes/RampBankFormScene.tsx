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
  onSubmit: (formData: BankFormData) => Promise<void>
  /**
   * Callback invoked when the user navigates away from the scene.
   */
  onCancel: () => void
}

interface Props extends EdgeAppSceneProps<'rampBankForm'> {}

export const RampBankFormScene: React.FC<Props> = props => {
  const { navigation, route } = props
  const { onSubmit, onCancel } = route.params

  const theme = useTheme()
  const styles = getStyles(theme)

  // Handle back navigation
  useBackEvent(navigation, onCancel)

  const [bankName, setBankName] = React.useState('')
  const [accountNumber, setAccountNumber] = React.useState('')
  const [routingNumber, setRoutingNumber] = React.useState('')
  const [accountName, setAccountName] = React.useState('')
  const [ownerFirstName, setOwnerFirstName] = React.useState('')
  const [ownerLastName, setOwnerLastName] = React.useState('')
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [error, setError] = React.useState<unknown>(null)
  const [fieldErrors, setFieldErrors] = React.useState({
    accountNumber: '',
    routingNumber: ''
  })

  // Create refs for each input field
  const ownerFirstNameRef = React.useRef<TextInput>(null)
  const ownerLastNameRef = React.useRef<TextInput>(null)
  const accountNameRef = React.useRef<TextInput>(null)
  const accountNumberRef = React.useRef<TextInput>(null)
  const routingNumberRef = React.useRef<TextInput>(null)

  const validateField = useHandler(
    (field: 'accountNumber' | 'routingNumber', value: string) => {
      const trimmed = value.trim()
      if (trimmed === '') {
        setFieldErrors(prev => ({ ...prev, [field]: '' }))
        return
      }

      if (field === 'accountNumber' && trimmed.length < 8) {
        setFieldErrors(prev => ({
          ...prev,
          [field]: sprintf(
            lstrings.ramp_account_number_error_min_length_1s,
            '8'
          )
        }))
        return
      }

      if (field === 'routingNumber' && trimmed.length !== 9) {
        setFieldErrors(prev => ({
          ...prev,
          [field]: sprintf(lstrings.ramp_routing_number_error_length_1s, '9')
        }))
        return
      }

      setFieldErrors(prev => ({ ...prev, [field]: '' }))
    }
  )

  const handleAccountNumberBlur = useHandler(() => {
    validateField('accountNumber', accountNumber)
  })

  const handleRoutingNumberBlur = useHandler(() => {
    validateField('routingNumber', routingNumber)
  })

  const clearFieldError = useHandler(
    (field: 'accountNumber' | 'routingNumber') => {
      setFieldErrors(prev => ({ ...prev, [field]: '' }))
    }
  )

  const isFormValid = React.useMemo(() => {
    const hasRequiredFields =
      bankName.trim() !== '' &&
      accountNumber.trim() !== '' &&
      routingNumber.trim() !== '' &&
      accountName.trim() !== '' &&
      ownerFirstName.trim() !== '' &&
      ownerLastName.trim() !== ''

    const hasValidLengths =
      accountNumber.trim().length >= 4 && routingNumber.trim().length === 9

    const hasNoFieldErrors =
      fieldErrors.accountNumber === '' && fieldErrors.routingNumber === ''

    return hasRequiredFields && hasValidLengths && hasNoFieldErrors
  }, [
    bankName,
    accountNumber,
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
      <SceneContainer>
        <FilledTextInput
          value={bankName}
          onChangeText={setBankName}
          placeholder={lstrings.ramp_bank_name_placeholder}
          returnKeyType="next"
          autoCapitalize="words"
          aroundRem={0.5}
          onSubmitEditing={() => ownerFirstNameRef.current?.focus()}
        />

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
            onSubmitEditing={() => accountNameRef.current?.focus()}
          />
        </View>

        <FilledTextInput
          ref={accountNameRef}
          value={accountName}
          onChangeText={setAccountName}
          placeholder={lstrings.ramp_account_name_placeholder}
          returnKeyType="next"
          autoCapitalize="words"
          aroundRem={0.5}
          onSubmitEditing={() => accountNumberRef.current?.focus()}
        />

        <FilledTextInput
          ref={accountNumberRef}
          value={accountNumber}
          onChangeText={useHandler((text: string) => {
            setAccountNumber(text)
            clearFieldError('accountNumber')
          })}
          placeholder={lstrings.ramp_account_number_placeholder}
          keyboardType="number-pad"
          returnKeyType="next"
          error={fieldErrors.accountNumber}
          aroundRem={0.5}
          onBlur={handleAccountNumberBlur}
          onSubmitEditing={() => routingNumberRef.current?.focus()}
        />

        <FilledTextInput
          ref={routingNumberRef}
          value={routingNumber}
          onChangeText={useHandler((text: string) => {
            setRoutingNumber(text)
            clearFieldError('routingNumber')
          })}
          placeholder={lstrings.ramp_routing_number_placeholder}
          keyboardType="number-pad"
          returnKeyType="done"
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
