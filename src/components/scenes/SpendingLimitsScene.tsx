import * as React from 'react'
import { Alert, Switch, View } from 'react-native'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'

import { getSymbolFromCurrency } from '../../constants/WalletAndCurrencyConstants'
import { useHandler } from '../../hooks/useHandler'
import { lstrings } from '../../locales/strings'
import { setSpendingLimits } from '../../modules/Core/Account/settings'
import { useDispatch, useSelector } from '../../types/reactRedux'
import { EdgeSceneProps } from '../../types/routerTypes'
import { zeroString } from '../../util/utils'
import { SceneWrapper } from '../common/SceneWrapper'
import { PrimaryButton } from '../legacy/Buttons/PrimaryButton.ui'
import { FormattedText } from '../legacy/FormattedText/FormattedText.ui'
import { showError } from '../services/AirshipInstance'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { OutlinedTextInput } from '../themed/OutlinedTextInput'

interface Props extends EdgeSceneProps<'spendingLimits'> {}

export const SpendingLimitsScene = (props: Props) => {
  const { navigation } = props
  const theme = useTheme()
  const styles = getStyles(theme)
  const dispatch = useDispatch()

  const account = useSelector(state => state.core.account)
  const currencySymbol = useSelector(state => getSymbolFromCurrency(state.ui.settings.defaultFiat))
  const transactionSpendingLimit = useSelector(state => state.ui.settings.spendingLimits.transaction)

  const [password, setPassword] = React.useState('')
  const [transactionAmount, setTransactionAmount] = React.useState(
    !zeroString(transactionSpendingLimit.amount.toString()) ? transactionSpendingLimit.amount.toString() : ''
  )
  const [transactionIsEnabled, setTransactionIsEnabled] = React.useState(transactionSpendingLimit.isEnabled)

  const handleTransactionIsEnabledChanged = useHandler(() => setTransactionIsEnabled(!transactionIsEnabled))

  const handleSubmitAsync = async () => {
    const isAuthorized = await account.checkPassword(password)
    if (!isAuthorized) return Alert.alert(lstrings.password_check_incorrect_password_title)

    const spendingLimits = {
      transaction: {
        isEnabled: transactionIsEnabled,
        amount: parseFloat(transactionAmount)
      }
    }
    await setSpendingLimits(account, spendingLimits)
    dispatch({
      type: 'SPENDING_LIMITS/NEW_SPENDING_LIMITS',
      data: { spendingLimits }
    })
    navigation.pop()
  }

  // Satsify "misused promise"
  const handleSubmit = useHandler(() => {
    handleSubmitAsync().catch(err => showError(err))
  })

  return (
    <SceneWrapper background="legacy" hasHeader>
      <KeyboardAwareScrollView contentContainerStyle={styles.scene}>
        <OutlinedTextInput secureTextEntry autoFocus label={lstrings.enter_your_password} value={password} onChangeText={setPassword} />

        <View style={styles.switchRow}>
          <View style={styles.textBlock}>
            <FormattedText style={styles.bodyText}>{lstrings.spending_limits_tx_title}</FormattedText>
            <FormattedText style={styles.bodyText}>{lstrings.spending_limits_tx_description}</FormattedText>
          </View>
          <Switch onValueChange={handleTransactionIsEnabledChanged} value={transactionIsEnabled} accessibilityHint={lstrings.toggle_button_hint} />
        </View>

        <OutlinedTextInput
          disabled={!transactionIsEnabled}
          value={transactionAmount}
          onChangeText={setTransactionAmount}
          label={lstrings.spending_limits_tx_title}
          autoCorrect={false}
          autoFocus={false}
          keyboardType="numeric"
          prefix={currencySymbol}
        />

        <View style={styles.spacer} />

        <PrimaryButton onPress={handleSubmit}>
          <PrimaryButton.Text>{lstrings.save}</PrimaryButton.Text>
        </PrimaryButton>
      </KeyboardAwareScrollView>
    </SceneWrapper>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  scene: {
    alignItems: 'stretch',
    padding: theme.rem(1.5)
  },
  spacer: {
    height: theme.rem(1.75)
  },
  switchRow: {
    flexDirection: 'row',
    paddingVertical: theme.rem(1.75)
  },
  textBlock: {
    flex: 1
  },
  bodyText: {
    fontSize: theme.rem(0.875)
  }
}))
