import * as React from 'react'
import { type TextInput, View } from 'react-native'

import { useBackEvent } from '../../hooks/useBackEvent'
import { useHandler } from '../../hooks/useHandler'
import { lstrings } from '../../locales/strings'
import type { EdgeAppSceneProps } from '../../types/routerTypes'
import { SceneButtons } from '../buttons/SceneButtons'
import { ErrorCard } from '../cards/ErrorCard'
import { SceneWrapper } from '../common/SceneWrapper'
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
  onCancel?: () => void
}

interface Props extends EdgeAppSceneProps<'rampBankForm'> {}

export const RampBankFormScene: React.FC<Props> = props => {
  const { navigation, route } = props
  const { onSubmit, onCancel } = route.params

  const theme = useTheme()
  const styles = getStyles(theme)

  // Handle back navigation
  useBackEvent(navigation, () => {
    if (onCancel != null) onCancel()
  })

  const [bankName, setBankName] = React.useState('')
  const [accountNumber, setAccountNumber] = React.useState('')
  const [routingNumber, setRoutingNumber] = React.useState('')
  const [accountName, setAccountName] = React.useState('')
  const [ownerFirstName, setOwnerFirstName] = React.useState('')
  const [ownerLastName, setOwnerLastName] = React.useState('')
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [error, setError] = React.useState<unknown>(null)

  // Create refs for each input field
  const ownerFirstNameRef = React.useRef<TextInput>(null)
  const ownerLastNameRef = React.useRef<TextInput>(null)
  const accountNameRef = React.useRef<TextInput>(null)
  const accountNumberRef = React.useRef<TextInput>(null)
  const routingNumberRef = React.useRef<TextInput>(null)

  const isFormValid = React.useMemo(() => {
    return (
      bankName.trim() !== '' &&
      accountNumber.trim() !== '' &&
      routingNumber.trim() !== '' &&
      accountName.trim() !== '' &&
      ownerFirstName.trim() !== '' &&
      ownerLastName.trim() !== ''
    )
  }, [
    bankName,
    accountNumber,
    routingNumber,
    accountName,
    ownerFirstName,
    ownerLastName
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
      <View style={styles.container}>
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
          onChangeText={setAccountNumber}
          placeholder={lstrings.ramp_account_number_placeholder}
          keyboardType="number-pad"
          returnKeyType="next"
          minLength={4}
          maxLength={17}
          aroundRem={0.5}
          onSubmitEditing={() => routingNumberRef.current?.focus()}
        />

        <FilledTextInput
          ref={routingNumberRef}
          value={routingNumber}
          onChangeText={setRoutingNumber}
          placeholder={lstrings.ramp_routing_number_placeholder}
          keyboardType="number-pad"
          returnKeyType="done"
          minLength={9}
          maxLength={9}
          aroundRem={0.5}
          onSubmitEditing={() => {
            handleSubmit().catch(showError)
          }}
        />
      </View>
      {error != null && <ErrorCard error={error} />}
      <SceneButtons
        primary={{
          label: lstrings.string_submit,
          onPress: handleSubmit,
          disabled: !isFormValid || isSubmitting,
          spinner: isSubmitting
        }}
      />
    </SceneWrapper>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  container: {
    paddingHorizontal: theme.rem(0.5)
  },
  row: {
    flexDirection: 'row'
  }
}))
