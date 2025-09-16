import * as React from 'react'
import { type TextInput, View } from 'react-native'

import { useBackEvent } from '../../hooks/useBackEvent'
import { useHandler } from '../../hooks/useHandler'
import { lstrings } from '../../locales/strings'
import type { InfiniteCustomerAccountsResponse } from '../../plugins/ramps/infinite/infiniteApiTypes'
import type { EdgeAppSceneProps } from '../../types/routerTypes'
import { SceneButtons } from '../buttons/SceneButtons'
import { ErrorCard } from '../cards/ErrorCard'
import { SceneWrapper } from '../common/SceneWrapper'
import { styled } from '../hoc/styled'
import { showError } from '../services/AirshipInstance'
import { FilledTextInput } from '../themed/FilledTextInput'

export interface BankDetailsFormData {
  type: 'bank_account'
  bankName: string
  accountNumber: string
  routingNumber: string
  accountName: string
  accountOwnerName: string
}

export interface RampBankFormParams {
  onSubmit: (formData: BankDetailsFormData) => Promise<void>
  onCancel?: () => void
  // Debug helper: when provided, the scene will fetch and display
  // the customer's accounts list at the bottom of the screen.
  debugGetAccounts?: () => Promise<InfiniteCustomerAccountsResponse>
}

interface Props extends EdgeAppSceneProps<'rampBankForm'> {}

export const RampBankFormScene = (props: Props): React.JSX.Element => {
  const { navigation, route } = props
  const { onSubmit, onCancel } = route.params

  // Handle back navigation
  useBackEvent(navigation, () => {
    if (onCancel != null) onCancel()
  })

  const [bankName, setBankName] = React.useState('')
  const [accountNumber, setAccountNumber] = React.useState('')
  const [routingNumber, setRoutingNumber] = React.useState('')
  const [accountName, setAccountName] = React.useState('')
  const [accountOwnerName, setAccountOwnerName] = React.useState('')
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [error, setError] = React.useState<unknown>(null)
  const [accountsDebugText, setAccountsDebugText] = React.useState('')

  // Create refs for each input field
  const bankNameRef = React.useRef<TextInput>(null)
  const accountOwnerNameRef = React.useRef<TextInput>(null)
  const accountNameRef = React.useRef<TextInput>(null)
  const accountNumberRef = React.useRef<TextInput>(null)
  const routingNumberRef = React.useRef<TextInput>(null)

  const isFormValid = React.useMemo(() => {
    return (
      bankName.trim() !== '' &&
      accountNumber.trim() !== '' &&
      routingNumber.trim() !== '' &&
      accountName.trim() !== '' &&
      accountOwnerName.trim() !== ''
    )
  }, [bankName, accountNumber, routingNumber, accountName, accountOwnerName])

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
        accountOwnerName: accountOwnerName.trim()
      })
    } catch (err) {
      setError(err)
    } finally {
      setIsSubmitting(false)
    }
  })

  // Debug: Load and display customer accounts if a debug fetcher is provided.
  React.useEffect(() => {
    let isMounted = true
    const { debugGetAccounts } = route.params
    if (debugGetAccounts == null)
      return () => {
        isMounted = false
      }

    debugGetAccounts()
      .then(response => {
        if (!isMounted) return
        try {
          const text = JSON.stringify(response.accounts, null, 2)
          setAccountsDebugText(text)
        } catch {
          setAccountsDebugText('')
        }
      })
      .catch(() => {
        if (!isMounted) return
        setAccountsDebugText('')
      })

    return () => {
      isMounted = false
    }
  }, [route.params])

  return (
    <SceneWrapper scroll hasTabs>
      <ContentContainer>
        <FilledTextInput
          ref={bankNameRef}
          value={bankName}
          onChangeText={setBankName}
          placeholder={lstrings.ramp_bank_name_placeholder}
          returnKeyType="next"
          autoCapitalize="words"
          topRem={0.5}
          bottomRem={1}
          onSubmitEditing={() => accountOwnerNameRef.current?.focus()}
        />

        <FilledTextInput
          ref={accountOwnerNameRef}
          value={accountOwnerName}
          onChangeText={setAccountOwnerName}
          placeholder={lstrings.ramp_account_owner_name_placeholder}
          returnKeyType="next"
          autoCapitalize="words"
          bottomRem={1}
          onSubmitEditing={() => accountNameRef.current?.focus()}
        />

        <FilledTextInput
          ref={accountNameRef}
          value={accountName}
          onChangeText={setAccountName}
          placeholder={lstrings.ramp_account_name_placeholder}
          returnKeyType="next"
          autoCapitalize="words"
          bottomRem={1}
          onSubmitEditing={() => accountNumberRef.current?.focus()}
        />

        <FilledTextInput
          ref={accountNumberRef}
          value={accountNumber}
          onChangeText={setAccountNumber}
          placeholder={lstrings.ramp_account_number_placeholder}
          keyboardType="number-pad"
          returnKeyType="next"
          // minLength={4}
          maxLength={17}
          bottomRem={1}
          onSubmitEditing={() => routingNumberRef.current?.focus()}
        />

        <FilledTextInput
          ref={routingNumberRef}
          value={routingNumber}
          onChangeText={setRoutingNumber}
          placeholder={lstrings.ramp_routing_number_placeholder}
          keyboardType="number-pad"
          returnKeyType="done"
          // minLength={9}
          maxLength={9}
          bottomRem={1}
          onSubmitEditing={() => {
            handleSubmit().catch(showError)
          }}
        />
      </ContentContainer>
      {error != null && <ErrorCard error={error} />}
      {accountsDebugText !== '' && (
        <FilledTextInput
          value={accountsDebugText}
          multiline
          numberOfLines={8}
          disabled
          bottomRem={0.5}
        />
      )}
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

const ContentContainer = styled(View)(theme => ({
  paddingHorizontal: theme.rem(0.5)
}))
