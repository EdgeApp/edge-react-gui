import * as React from 'react'
import { Alert, View } from 'react-native'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'

import { writeSpendingLimits } from '../../actions/LocalSettingsActions'
import { getSymbolFromCurrency } from '../../constants/WalletAndCurrencyConstants'
import { useHandler } from '../../hooks/useHandler'
import { lstrings } from '../../locales/strings'
import { useDispatch, useSelector } from '../../types/reactRedux'
import { EdgeSceneProps } from '../../types/routerTypes'
import { zeroString } from '../../util/utils'
import { SceneWrapper } from '../common/SceneWrapper'
import { showError } from '../services/AirshipInstance'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { SettingsSwitchRow } from '../settings/SettingsSwitchRow'
import { EdgeText } from '../themed/EdgeText'
import { MainButton } from '../themed/MainButton'
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
    !zeroString(transactionSpendingLimit.amount?.toString()) ? transactionSpendingLimit.amount.toString() : ''
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
    await writeSpendingLimits(account, spendingLimits)
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

  const amount = parseFloat(transactionAmount)
  const enableSlider = password.length > 8 && !isNaN(amount) && amount > 0
  return (
    <SceneWrapper hasHeader>
      <KeyboardAwareScrollView contentContainerStyle={styles.scene}>
        <OutlinedTextInput secureTextEntry autoFocus label={lstrings.enter_your_password} value={password} onChangeText={setPassword} />

        <View style={styles.switchRow}>
          <View style={styles.textBlock}>
            <EdgeText style={styles.bodyText}>{lstrings.spending_limits_tx_title}</EdgeText>
            <EdgeText style={styles.bodyText}>{lstrings.spending_limits_tx_description}</EdgeText>
          </View>
          <SettingsSwitchRow value={transactionIsEnabled} onPress={handleTransactionIsEnabledChanged} />
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

        <MainButton label={lstrings.save} disabled={!enableSlider} onPress={handleSubmit} />
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
