import * as React from 'react'
import { type TextInput, View } from 'react-native'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'

import { SCROLL_INDICATOR_INSET_FIX } from '../../constants/constantSettings'
import { useBackEvent } from '../../hooks/useBackEvent'
import { useHandler } from '../../hooks/useHandler'
import { lstrings } from '../../locales/strings'
import type { EdgeAppSceneProps } from '../../types/routerTypes'
import { SceneButtons } from '../buttons/SceneButtons'
import { AlertCardUi4 } from '../cards/AlertCard'
import { SceneWrapper } from '../common/SceneWrapper'
import { styled } from '../hoc/styled'
import { useTheme } from '../services/ThemeContext'
import { FilledTextInput } from '../themed/FilledTextInput'

export interface BankDetailsFormData {
  type: 'bank_account'
  bank_name: string
  account_number: string
  routing_number: string
  account_name: string
  account_owner_name: string
}

export interface RampBankFormParams {
  onSubmit: (formData: BankDetailsFormData) => Promise<void>
  onCancel?: () => void
}

interface Props extends EdgeAppSceneProps<'rampBankForm'> {}

export const RampBankFormScene = (props: Props) => {
  const { navigation, route } = props
  const { onSubmit, onCancel } = route.params

  const theme = useTheme()

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
  const [error, setError] = React.useState<string | null>(null)

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
        bank_name: bankName.trim(),
        account_number: accountNumber.trim(),
        routing_number: routingNumber.trim(),
        account_name: accountName.trim(),
        account_owner_name: accountOwnerName.trim()
      })
      navigation.goBack()
    } catch (err) {
      setError(String(err))
    } finally {
      setIsSubmitting(false)
    }
  })

  return (
    <SceneWrapper scroll>
      <StyledKeyboardAwareScrollView
        extraScrollHeight={theme.rem(2.75)}
        enableOnAndroid
        scrollIndicatorInsets={SCROLL_INDICATOR_INSET_FIX}
      >
        <ContentContainer>
          {error != null && (
            <AlertCardUi4
              title={lstrings.ramp_bank_details_error_title}
              body={error}
              type="error"
              marginRem={[0, 0, 1, 0]}
            />
          )}

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
            maxLength={9}
            bottomRem={1}
            onSubmitEditing={handleSubmit}
          />
        </ContentContainer>
      </StyledKeyboardAwareScrollView>

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

// Styled components
const StyledKeyboardAwareScrollView = styled(KeyboardAwareScrollView)(
  theme => ({
    paddingTop: theme.rem(0.5)
  })
)

const ContentContainer = styled(View)(theme => ({
  paddingHorizontal: theme.rem(0.5)
}))
